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
}
