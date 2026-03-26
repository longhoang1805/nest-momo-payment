import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PaymentService } from './payment.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('momo/:orderId')
  @UseGuards(JwtAuthGuard)
  createMomoPayment(@Param('orderId', ParseIntPipe) orderId: number) {
    return this.paymentService.createMomoPayment(orderId);
  }

  // MoMo will POST to this endpoint after payment
  @Post('ipn')
  @HttpCode(204)
  handleIpn(@Body() body: Record<string, any>) {
    return this.paymentService.handleIpn(body);
  }

  // MoMo redirects user to this (frontend handles it, but we expose it too)
  @Get('callback')
  handleCallback(@Query() query: Record<string, any>) {
    return this.paymentService.handleCallback(query);
  }

  @Post('zalopay/:orderId')
  @UseGuards(JwtAuthGuard)
  createZaloPayPayment(@Param('orderId', ParseIntPipe) orderId: number) {
    return this.paymentService.createZaloPayPayment(orderId);
  }

  // ZaloPay POSTs to this endpoint after payment (must be before /:orderId to avoid conflict)
  @Post('zalopay/callback')
  @HttpCode(200)
  handleZaloPayCallback(@Body() body: { data: string; mac: string; type: number }) {
    return this.paymentService.handleZaloPayCallback(body);
  }

  // ZaloPay redirects user to this after payment
  @Get('zalopay/redirect')
  handleZaloPayRedirect(@Query() query: Record<string, any>) {
    return this.paymentService.handleZaloPayRedirect(query);
  }
}
