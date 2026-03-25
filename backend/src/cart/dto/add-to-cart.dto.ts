import { IsInt, IsPositive, IsOptional, Min } from 'class-validator';

export class AddToCartDto {
  @IsInt()
  @IsPositive()
  bookId: number;

  @IsInt()
  @Min(1)
  @IsOptional()
  quantity?: number = 1;
}
