import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { OrdersRepository } from './orders.repository';
import { CartService } from '../cart/cart.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderStatus } from './entities/order.entity';

@Injectable()
export class OrdersService {
  constructor(
    private readonly ordersRepo: OrdersRepository,
    private readonly cartService: CartService,
  ) {}

  async createFromCart(userId: number, dto: CreateOrderDto) {
    const cart = await this.cartService.getCart(userId);
    if (cart.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    const order = await this.ordersRepo.create({
      userId,
      totalAmount: cart.total,
      status: OrderStatus.PENDING,
      firstName: dto.firstName,
      lastName: dto.lastName,
      address: dto.address,
    });

    const orderItems = cart.items.map((item) => ({
      orderId: order.id,
      bookId: item.bookId,
      quantity: item.quantity,
      unitPrice: item.book?.price ?? 0,
    }));
    await this.ordersRepo.createItems(orderItems);

    await this.cartService.clearCart(userId);

    return this.getOrderOrThrow(order.id);
  }

  async getOrders(userId: number) {
    const orders = await this.ordersRepo.findByUser(userId);
    return orders.map(this.formatOrder);
  }

  async getOrderOrThrow(orderId: number) {
    const order = await this.ordersRepo.findById(orderId);
    if (!order) throw new NotFoundException('Order not found');
    return this.formatOrder(order);
  }

  async getAllOrders() {
    const orders = await this.ordersRepo.findAll();
    return orders.map(this.formatOrder);
  }

  async markAsPaid(orderId: number) {
    await this.ordersRepo.updateStatus(orderId, OrderStatus.PAID);
    return this.getOrderOrThrow(orderId);
  }

  private formatOrder(order: any) {
    return {
      id: order.id,
      userId: order.userId,
      totalAmount: Number(order.totalAmount),
      status: order.status,
      firstName: order.firstName,
      lastName: order.lastName,
      address: order.address,
      momoOrderId: order.momoOrderId,
      momoPayUrl: order.momoPayUrl,
      momoQrCodeUrl: order.momoQrCodeUrl,
      items: (order.items ?? []).map((item: any) => ({
        id: item.id,
        bookId: item.bookId,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        book: item.book
          ? {
              id: item.book.id,
              title: item.book.title,
              author: item.book.author,
              coverImage: item.book.coverImage,
            }
          : null,
      })),
      createdAt: order.createdAt,
    };
  }
}
