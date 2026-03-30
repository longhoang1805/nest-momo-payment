import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { Admin } from './entities/admin.entity';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { JwtAdminStrategy } from './strategies/jwt-admin.strategy';
import { UsersModule } from '../users/users.module';
import { OrdersModule } from '../orders/orders.module';
import { BooksModule } from '../books/books.module';

@Module({
  imports: [
    SequelizeModule.forFeature([Admin]),
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: config.get<string>('JWT_EXPIRES_IN') },
      }),
    }),
    UsersModule,
    OrdersModule,
    BooksModule,
  ],
  controllers: [AdminController],
  providers: [AdminService, JwtAdminStrategy],
  exports: [AdminService],
})
export class AdminModule {}
