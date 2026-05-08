import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { SupabaseUserPayload, UsersService } from './users.service';
import { SupabaseJwtGuard } from '../../common/supabase-jwt.guard';
import { CurrentUser } from '../../common/current-user.decorator';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('api/users')
@UseGuards(SupabaseJwtGuard)
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
