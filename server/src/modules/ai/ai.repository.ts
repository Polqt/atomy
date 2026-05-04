import { Injectable, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DB_CONNECTION } from '../../database/database.constants';
import { DatabaseType } from '../../database/database.module';
import * as schema from '../../database/schema';

@Injectable()
export class AiRepository {
  constructor(@Inject(DB_CONNECTION) private readonly db: DatabaseType) {}

  async logRequest(input: {
    userId: string;
    endpoint: string;
    prompt: string;
    response: unknown;
    tokensUsed?: number;
  }) {
    await this.db.insert(schema.aiRequestsTable).values({
      userId: input.userId,
      endpoint: input.endpoint,
      prompt: input.prompt,
      response: JSON.stringify(input.response),
      tokensUsed: input.tokensUsed,
    });
  }
}
