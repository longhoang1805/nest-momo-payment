import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { OrdersService } from '../orders/orders.service';
import { OrdersRepository } from '../orders/orders.repository';
import { OrderStatus } from '../orders/entities/order.entity';
import {
  MOMO_LANG,
  MOMO_ORDER_ID_PREFIX,
  MOMO_REQUEST_TYPE,
  MOMO_RESULT_CODE,
} from '../constants/momo.constants';

interface MomoCreateResponse {
  partnerCode: string;
  requestId: string;
  orderId: string;
  amount: number;
  responseTime: number;
  message: string;
  resultCode: number;
  payUrl: string;
  shortLink?: string;
  deeplink?: string;
  qrCodeUrl?: string;
}

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly ordersService: OrdersService,
    private readonly ordersRepo: OrdersRepository,
  ) {}

  private createSignature(rawSignature: string, secretKey: string): string {
    return crypto.createHmac('sha256', secretKey).update(rawSignature).digest('hex');
  }

  async createMomoPayment(orderId: number) {
    const order = await this.ordersService.getOrderOrThrow(orderId);

    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException('Order is not in pending state');
    }

    const partnerCode = this.config.getOrThrow<string>('MOMO_PARTNER_CODE');
    const accessKey = this.config.getOrThrow<string>('MOMO_ACCESS_KEY');
    const secretKey = this.config.getOrThrow<string>('MOMO_SECRET_KEY');
    const endpoint = this.config.getOrThrow<string>('MOMO_ENDPOINT');
    const redirectUrl = this.config.getOrThrow<string>('MOMO_REDIRECT_URL');
    const ipnUrl = this.config.getOrThrow<string>('MOMO_IPN_URL');

    const requestId = uuidv4();
    const momoOrderId = `${MOMO_ORDER_ID_PREFIX}_${orderId}_${Date.now()}`;
    const amount = Math.round(order.totalAmount);
    const orderInfo = `Payment for order #${orderId}`;
    const requestType = MOMO_REQUEST_TYPE.CAPTURE_WALLET;
    const extraData = '';

    // Build raw signature string (alphabetical order of keys)
    const rawSignature =
      `accessKey=${accessKey}` +
      `&amount=${amount}` +
      `&extraData=${extraData}` +
      `&ipnUrl=${ipnUrl}` +
      `&orderId=${momoOrderId}` +
      `&orderInfo=${orderInfo}` +
      `&partnerCode=${partnerCode}` +
      `&redirectUrl=${redirectUrl}` +
      `&requestId=${requestId}` +
      `&requestType=${requestType}`;

    const signature = this.createSignature(rawSignature, secretKey);

    const requestBody = {
      partnerCode,
      accessKey,
      requestId,
      amount: String(amount),
      orderId: momoOrderId,
      orderInfo,
      redirectUrl,
      ipnUrl,
      extraData,
      requestType,
      signature,
      lang: MOMO_LANG.EN,
    };

    this.logger.log(`Creating MoMo payment for order ${orderId}`);

    const response = await axios.post(endpoint, requestBody);

    const momoData = response.data as MomoCreateResponse;

    if (momoData.resultCode !== MOMO_RESULT_CODE.SUCCESS) {
      this.logger.error(`MoMo error: ${momoData.message}`);
      throw new BadRequestException(`MoMo payment failed: ${momoData.message}`);
    }

    await this.ordersRepo.updateMomoFields(orderId, {
      momoOrderId: momoData.orderId,
      momoRequestId: requestId,
      momoPayUrl: momoData.payUrl,
      momoQrCodeUrl: momoData.qrCodeUrl ?? momoData.payUrl,
    });

    return {
      orderId,
      momoOrderId: momoData.orderId,
      payUrl: momoData.payUrl,
      qrCodeUrl: momoData.qrCodeUrl ?? momoData.payUrl,
      amount: momoData.amount,
      message: momoData.message,
    };
  }

  async handleIpn(body: Record<string, any>) {
    const secretKey = this.config.getOrThrow<string>('MOMO_SECRET_KEY');
    const accessKey = this.config.getOrThrow<string>('MOMO_ACCESS_KEY');

    const {
      partnerCode,
      orderId,
      requestId,
      amount,
      orderInfo,
      orderType,
      transId,
      resultCode,
      message,
      payType,
      responseTime,
      extraData,
      signature: receivedSignature,
    } = body;

    const rawSignature =
      `accessKey=${accessKey}` +
      `&amount=${amount}` +
      `&extraData=${extraData}` +
      `&message=${message}` +
      `&orderId=${orderId}` +
      `&orderInfo=${orderInfo}` +
      `&orderType=${orderType}` +
      `&partnerCode=${partnerCode}` +
      `&payType=${payType}` +
      `&requestId=${requestId}` +
      `&responseTime=${responseTime}` +
      `&resultCode=${resultCode}` +
      `&transId=${transId}`;

    const expectedSignature = this.createSignature(rawSignature, secretKey);

    if (expectedSignature !== receivedSignature) {
      this.logger.warn('MoMo IPN: Invalid signature');
      return { status: 'invalid_signature' };
    }

    if (resultCode === MOMO_RESULT_CODE.SUCCESS) {
      // Extract orderId from momoOrderId format: ORDER_{id}_{timestamp}
      const match = orderId.match(/^ORDER_(\d+)_/);
      if (match) {
        const internalOrderId = parseInt(match[1], 10);
        await this.ordersService.markAsPaid(internalOrderId);
        this.logger.log(`Order ${internalOrderId} marked as paid via MoMo IPN`);
      }
    }

    return { status: 'received' };
  }

  async handleCallback(query: Record<string, any>) {
    const { orderId, resultCode } = query;

    if (!orderId) return { status: 'no_order' };

    // Extract internal order ID
    const match = String(orderId).match(/^ORDER_(\d+)_/);
    if (!match) return { status: 'invalid_order_id' };

    const internalOrderId = parseInt(match[1], 10);

    if (String(resultCode) === String(MOMO_RESULT_CODE.SUCCESS)) {
      await this.ordersService.markAsPaid(internalOrderId);
    }

    return { orderId: internalOrderId, resultCode };
  }
}
