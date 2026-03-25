import { Injectable, NotFoundException } from '@nestjs/common';
import { CartRepository } from './cart.repository';
import { BooksService } from '../books/books.service';
import { AddToCartDto } from './dto/add-to-cart.dto';

@Injectable()
export class CartService {
  constructor(
    private readonly cartRepo: CartRepository,
    private readonly booksService: BooksService,
  ) {}

  async getCart(userId: number) {
    const items = await this.cartRepo.findByUser(userId);
    const cartItems = items.map((item) => ({
      id: item.id,
      bookId: item.bookId,
      quantity: item.quantity,
      book: item.book
        ? {
            id: item.book.id,
            title: item.book.title,
            author: item.book.author,
            price: Number(item.book.price),
            coverImage: item.book.coverImage,
          }
        : null,
    }));
    const total = cartItems.reduce(
      (sum, item) => sum + (item.book?.price ?? 0) * item.quantity,
      0,
    );
    return { items: cartItems, total };
  }

  async addToCart(userId: number, dto: AddToCartDto) {
    await this.booksService.findOneOrThrow(dto.bookId);
    const item = await this.cartRepo.addItem(userId, dto.bookId, dto.quantity ?? 1);
    return { id: item.id, bookId: item.bookId, quantity: item.quantity };
  }

  async updateQuantity(userId: number, itemId: number, quantity: number) {
    const items = await this.cartRepo.findByUser(userId);
    const item = items.find((i) => i.id === itemId);
    if (!item) throw new NotFoundException('Cart item not found');

    if (quantity <= 0) {
      await this.cartRepo.removeItem(itemId);
      return { removed: true };
    }

    await this.cartRepo.updateQuantity(itemId, quantity);
    return { id: itemId, quantity };
  }

  async removeFromCart(userId: number, itemId: number) {
    const items = await this.cartRepo.findByUser(userId);
    const item = items.find((i) => i.id === itemId);
    if (!item) throw new NotFoundException('Cart item not found');
    await this.cartRepo.removeItem(itemId);
    return { removed: true };
  }

  async clearCart(userId: number) {
    await this.cartRepo.clearCart(userId);
    return { cleared: true };
  }
}
