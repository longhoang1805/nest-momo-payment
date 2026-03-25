import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { Book } from './entities/book.entity';

@Injectable()
export class BooksRepository {
  constructor(@InjectModel(Book) private readonly bookModel: typeof Book) {}

  async findAll(search?: string): Promise<Book[]> {
    const where = search
      ? {
          [Op.or]: [
            { title: { [Op.iLike]: `%${search}%` } },
            { author: { [Op.iLike]: `%${search}%` } },
            { genre: { [Op.iLike]: `%${search}%` } },
          ],
        }
      : {};
    return this.bookModel.findAll({ where });
  }

  async findById(id: number): Promise<Book | null> {
    return this.bookModel.findByPk(id);
  }

  async bulkCreate(books: Partial<Book>[]): Promise<void> {
    await this.bookModel.bulkCreate(books as any[], { ignoreDuplicates: true });
  }
}
