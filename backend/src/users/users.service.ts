import { Injectable, NotFoundException } from '@nestjs/common';
import { UsersRepository } from './users.repository';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepo: UsersRepository) {}

  async findByUsername(username: string): Promise<User | null> {
    return this.usersRepo.findByUsername(username);
  }

  async findByIdOrThrow(id: number): Promise<User> {
    const user = await this.usersRepo.findById(id);
    if (!user) throw new NotFoundException(`User not found`);
    return user;
  }

  async create(username: string, hashedPassword: string): Promise<User> {
    return this.usersRepo.create({ username, password: hashedPassword });
  }
}
