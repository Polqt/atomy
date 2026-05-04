import { Injectable, NotFoundException } from '@nestjs/common';
import { UsersRepository } from './users.repository';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async getMe(userId: string, email: string) {
    const rows = await this.usersRepository.upsert({ id: userId, email });
    return rows[0];
  }

  async updateProfile(userId: string, dto: UpdateUserDto) {
    const rows = await this.usersRepository.updateProfile(userId, dto);
    if (rows.length === 0) {
      throw new NotFoundException('User not found');
    }
    return rows[0];
  }

  async findById(id: string) {
    const rows = await this.usersRepository.findById(id);
    return rows[0] ?? null;
  }
}
