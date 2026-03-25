import { Module } from '@nestjs/common';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { OrdersModule } from '../orders/orders.module';
import { SequelizeModule } from '@nestjs/sequelize';
import { Order } from '../orders/entities/order.entity';
import { OrderItem } from '../orders/entities/order-item.entity';
import { OrdersRepository } from '../orders/orders.repository';

@Module({
  imports: [SequelizeModule.forFeature([Order, OrderItem]), OrdersModule],
  controllers: [PaymentController],
  providers: [PaymentService, OrdersRepository],
})
export class PaymentModule {}
