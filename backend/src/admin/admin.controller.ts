import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminLoginDto } from './dto/admin-login.dto';
import { JwtAdminGuard } from '../common/guards/jwt-admin.guard';
import { UsersService } from '../users/users.service';
import { OrdersService } from '../orders/orders.service';

@Controller('admin')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly usersService: UsersService,
    private readonly ordersService: OrdersService,
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
}
