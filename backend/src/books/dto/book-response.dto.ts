import { Book } from '../entities/book.entity';

export class BookResponseDto {
  id: number;
  title: string;
  author: string;
  price: number;
  description: string;
  coverImage: string;
  genre: string;
  stock: number;
  rating: number;

  static from(book: Book): BookResponseDto {
    return {
      id: book.id,
      title: book.title,
      author: book.author,
      price: Number(book.price),
      description: book.description,
      coverImage: book.coverImage,
      genre: book.genre,
      stock: book.stock,
      rating: book.rating,
    };
  }
}
