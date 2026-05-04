import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { NotificationsRepository } from './notifications.repository';
import { RegisterTokenDto } from './dto/register-token.dto';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly notificationsRepository: NotificationsRepository) {}

  async registerToken(userId: string, dto: RegisterTokenDto) {
    const rows = await this.notificationsRepository.upsertToken(userId, dto.token);
    return rows[0];
  }

  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async sendDailyReminders() {
    const tokens = await this.notificationsRepository.getAllTokens();
    if (tokens.length === 0) return;

    const messages = tokens.map(({ token }) => ({
      to: token,
      title: 'Time to build your habit!',
      body: 'Check in on your daily habit and keep your streak going.',
      sound: 'default' as const,
    }));

    try {
      const res = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(messages),
      });
      const data = await res.json();
      this.logger.log(`Sent ${tokens.length} push notifications`, data);
    } catch (err) {
      this.logger.error('Failed to send push notifications', err);
    }
  }
}
