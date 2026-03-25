import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { CartItem } from './entities/cart-item.entity';
import { Book } from '../books/entities/book.entity';

@Injectable()
export class CartRepository {
  constructor(
    @InjectModel(CartItem) private readonly cartItemModel: typeof CartItem,
  ) {}

  async findByUser(userId: number): Promise<CartItem[]> {
    return this.cartItemModel.findAll({
      where: { userId },
      include: [Book],
    });
  }

  async findItem(userId: number, bookId: number): Promise<CartItem | null> {
    return this.cartItemModel.findOne({ where: { userId, bookId } });
  }

  async addItem(userId: number, bookId: number, quantity: number): Promise<CartItem> {
    const existing = await this.findItem(userId, bookId);
    if (existing) {
      existing.quantity += quantity;
      return existing.save();
    }
    return this.cartItemModel.create({ userId, bookId, quantity } as any);
  }

  async updateQuantity(id: number, quantity: number): Promise<void> {
    await this.cartItemModel.update({ quantity }, { where: { id } });
  }

  async removeItem(id: number): Promise<void> {
    await this.cartItemModel.destroy({ where: { id } });
  }

  async clearCart(userId: number): Promise<void> {
    await this.cartItemModel.destroy({ where: { userId } });
  }
}
