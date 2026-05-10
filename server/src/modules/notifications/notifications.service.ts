import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { NotificationsRepository } from './notifications.repository';
import { RegisterTokenDto } from './dto/register-token.dto';

type ExpoTicket = { id?: string; status?: 'ok' | 'error'; details?: { error?: string } };
type ExpoReceipt = { status?: 'ok' | 'error'; details?: { error?: string } };

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly notificationsRepository: NotificationsRepository) {}

  async registerToken(userId: string, dto: RegisterTokenDto) {
    const rows = await this.notificationsRepository.upsertToken(userId, dto.token);
    return rows[0];
  }

  async disableForUser(userId: string) {
    await this.notificationsRepository.deleteTokensByUserId(userId);
    return { ok: true };
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

      if (!res.ok) {
        const text = await res.text();
        this.logger.error(`Expo send failed: ${res.status} ${text}`);
        return;
      }

      const payload = (await res.json()) as { data?: ExpoTicket[] };
      const tickets = payload.data ?? [];
      const ticketByReceiptId = new Map<string, string>();
      tickets.forEach((ticket, index) => {
        const id = ticket.id;
        const token = tokens[index]?.token;
        if (typeof id === 'string' && id.length > 0 && token) {
          ticketByReceiptId.set(id, token);
        }
      });
      const receiptIds = [...ticketByReceiptId.keys()];

      const invalidTokens = new Set<string>();

      tickets.forEach((ticket, index) => {
        if (ticket.status === 'error' && ticket.details?.error === 'DeviceNotRegistered') {
          const token = tokens[index]?.token;
          if (token) invalidTokens.add(token);
        }
      });

      if (receiptIds.length > 0) {
        const receiptResponse = await fetch('https://exp.host/--/api/v2/push/getReceipts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: receiptIds }),
        });

        if (receiptResponse.ok) {
          const receiptPayload = (await receiptResponse.json()) as {
            data?: Record<string, ExpoReceipt>;
          };
          const receipts = receiptPayload.data ?? {};

          receiptIds.forEach((id) => {
            const receipt = receipts[id];
            if (receipt?.status === 'error' && receipt.details?.error === 'DeviceNotRegistered') {
              const token = ticketByReceiptId.get(id);
              if (token) invalidTokens.add(token);
            }
          });
        }
      }

      if (invalidTokens.size > 0) {
        const removed = await this.notificationsRepository.deleteTokens([...invalidTokens]);
        this.logger.log(`Pruned ${removed.length} invalid Expo push tokens`);
      }

      this.logger.log(`Sent ${tokens.length} push notifications`);
    } catch (err) {
      this.logger.error('Failed to send push notifications', err);
    }
  }
}
