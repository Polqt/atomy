import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { SupabaseJwtGuard } from '../../common/supabase-jwt.guard';
import { CurrentUser } from '../../common/current-user.decorator';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('api/users')
@UseGuards(SupabaseJwtGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  async getMe(
    @CurrentUser('id') userId: string,
    @CurrentUser('email') email: string,
  ) {
    return this.usersService.getMe(userId, email);
  }

  @Patch('me')
  async updateMe(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateUserDto,
  ) {
    return this.usersService.updateProfile(userId, dto);
  }
}
