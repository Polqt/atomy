import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { SupabaseJwtGuard } from '../../common/supabase-jwt.guard';
import { CurrentUser } from '../../common/current-user.decorator';
import { NotificationsService } from './notifications.service';
import { RegisterTokenDto } from './dto/register-token.dto';

@Controller('api/notifications')
@UseGuards(SupabaseJwtGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post('register')
  async register(
    @CurrentUser('id') userId: string,
    @Body() dto: RegisterTokenDto,
  ) {
    return this.notificationsService.registerToken(userId, dto);
  }
}
