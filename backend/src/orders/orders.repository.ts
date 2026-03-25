import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { Book } from '../books/entities/book.entity';

@Injectable()
export class OrdersRepository {
  constructor(
    @InjectModel(Order) private readonly orderModel: typeof Order,
    @InjectModel(OrderItem) private readonly orderItemModel: typeof OrderItem,
  ) {}

  async create(data: Partial<Order>): Promise<Order> {
    return this.orderModel.create(data as any);
  }

  async createItems(items: Partial<OrderItem>[]): Promise<void> {
    await this.orderItemModel.bulkCreate(items as any[]);
  }

  async findByUser(userId: number): Promise<Order[]> {
    return this.orderModel.findAll({
      where: { userId },
      include: [{ model: OrderItem, include: [Book] }],
      order: [['createdAt', 'DESC']],
    });
  }

  async findById(id: number): Promise<Order | null> {
    return this.orderModel.findByPk(id, {
      include: [{ model: OrderItem, include: [Book] }],
    });
  }

  async updateStatus(id: number, status: string): Promise<void> {
    await this.orderModel.update({ status }, { where: { id } });
  }

  async updateMomoFields(
    id: number,
    fields: {
      momoOrderId?: string;
      momoRequestId?: string;
      momoPayUrl?: string;
      momoQrCodeUrl?: string;
    },
  ): Promise<void> {
    await this.orderModel.update(fields, { where: { id } });
  }
}
