import { Body, Controller, Post, UseGuards, BadRequestException } from '@nestjs/common';
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

  @Post('disable')
  async disable(@CurrentUser('id') userId: string) {
    if (!userId) {
      throw new BadRequestException('User ID not found in token');
    }
    return this.notificationsService.disableForUser(userId);
  }
}
