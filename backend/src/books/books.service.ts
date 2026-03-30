import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { BooksRepository } from './books.repository';
import { BookResponseDto } from './dto/book-response.dto';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';
import { BOOK_SEED_DATA } from './books.seed';

@Injectable()
export class BooksService implements OnModuleInit {
  constructor(private readonly booksRepo: BooksRepository) {}

  async onModuleInit() {
    const books = await this.booksRepo.findAll();
    if (books.length === 0) {
      await this.booksRepo.bulkCreate(BOOK_SEED_DATA);
    }
  }

  async findAll(search?: string): Promise<BookResponseDto[]> {
    const books = await this.booksRepo.findAll(search);
    return books.map(BookResponseDto.from);
  }

  async findOneOrThrow(id: number): Promise<BookResponseDto> {
    const book = await this.booksRepo.findById(id);
    if (!book) throw new NotFoundException(`Book with id ${id} not found`);
    return BookResponseDto.from(book);
  }

  async create(dto: CreateBookDto): Promise<BookResponseDto> {
    const book = await this.booksRepo.create(dto);
    return BookResponseDto.from(book);
  }

  async update(id: number, dto: UpdateBookDto): Promise<BookResponseDto> {
    const book = await this.booksRepo.update(id, dto);
    if (!book) throw new NotFoundException(`Book with id ${id} not found`);
    return BookResponseDto.from(book);
  }

  async delete(id: number): Promise<void> {
    const deleted = await this.booksRepo.delete(id);
    if (!deleted) throw new NotFoundException(`Book with id ${id} not found`);
  }
}
