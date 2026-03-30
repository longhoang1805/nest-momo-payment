import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminLoginDto } from './dto/admin-login.dto';
import { JwtAdminGuard } from '../common/guards/jwt-admin.guard';
import { UsersService } from '../users/users.service';
import { OrdersService } from '../orders/orders.service';
import { BooksService } from '../books/books.service';
import { CreateBookDto } from '../books/dto/create-book.dto';
import { UpdateBookDto } from '../books/dto/update-book.dto';

@Controller('admin')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly usersService: UsersService,
    private readonly ordersService: OrdersService,
    private readonly booksService: BooksService,
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: AdminLoginDto) {
    return this.adminService.login(dto);
  }

  @Get('users')
  @UseGuards(JwtAdminGuard)
  getAllUsers() {
    return this.usersService.findAll();
  }

  @Get('orders')
  @UseGuards(JwtAdminGuard)
  getAllOrders() {
    return this.ordersService.getAllOrders();
  }

  @Get('books')
  @UseGuards(JwtAdminGuard)
  getAllBooks() {
    return this.booksService.findAll();
  }

  @Post('books')
  @UseGuards(JwtAdminGuard)
  createBook(@Body() dto: CreateBookDto) {
    return this.booksService.create(dto);
  }

  @Patch('books/:id')
  @UseGuards(JwtAdminGuard)
  updateBook(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateBookDto) {
    return this.booksService.update(id, dto);
  }

  @Delete('books/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAdminGuard)
  deleteBook(@Param('id', ParseIntPipe) id: number) {
    return this.booksService.delete(id);
  }
}
