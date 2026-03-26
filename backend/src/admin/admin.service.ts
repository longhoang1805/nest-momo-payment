import { Injectable, OnModuleInit, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Admin, AdminRole } from './entities/admin.entity';
import { AdminLoginDto } from './dto/admin-login.dto';

@Injectable()
export class AdminService implements OnModuleInit {
  constructor(
    @InjectModel(Admin) private readonly adminModel: typeof Admin,
    private readonly jwtService: JwtService,
  ) {}

  async onModuleInit() {
    const superAdminEmail = 'superadmin-bookstore@yopmail.com';
    const existing = await this.adminModel.findOne({
      where: { email: superAdminEmail },
    });
    if (!existing) {
      const hashedPassword = await bcrypt.hash('superadmin', 10);
      await this.adminModel.create({
        email: superAdminEmail,
        password: hashedPassword,
        role: AdminRole.SUPERADMIN,
      });
    }
  }

  async login(dto: AdminLoginDto) {
    const admin = await this.adminModel.findOne({ where: { email: dto.email } });
    if (!admin) throw new UnauthorizedException('Invalid credentials');

    const isMatch = await bcrypt.compare(dto.password, admin.password);
    if (!isMatch) throw new UnauthorizedException('Invalid credentials');

    const token = this.jwtService.sign({
      sub: admin.id,
      email: admin.email,
      role: admin.role,
    });
    return { token, admin: { id: admin.id, email: admin.email, role: admin.role } };
  }

  async findByEmail(email: string): Promise<Admin | null> {
    return this.adminModel.findOne({ where: { email } });
  }
}
