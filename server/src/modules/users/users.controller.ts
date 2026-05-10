import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { SupabaseUserPayload, UsersService } from './users.service';
import { SupabaseJwtGuard } from '../../common/supabase-jwt.guard';
import { CurrentUser } from '../../common/current-user.decorator';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('api/users')
@UseGuards(SupabaseJwtGuard)
@Throttle({ default: { ttl: 60000, limit: 30 } })
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  async getMe(@CurrentUser() user: SupabaseUserPayload) {
    return this.usersService.getMe(user);
  }

  @Patch('me')
  async updateMe(@CurrentUser() user: SupabaseUserPayload, @Body() dto: UpdateUserDto) {
    return this.usersService.updateProfile(user, dto);
  }
}
