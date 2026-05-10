import { Inject, Injectable } from '@nestjs/common';
import { eq, inArray } from 'drizzle-orm';
import { DB_CONNECTION } from '../../database/database.constants';
import { DatabaseType } from '../../database/database.module';
import * as schema from '../../database/schema';

@Injectable()
export class NotificationsRepository {
  constructor(@Inject(DB_CONNECTION) private readonly db: DatabaseType) {}

  async upsertToken(userId: string, token: string) {
    return this.db
      .insert(schema.pushTokensTable)
      .values({ userId, token })
      .onConflictDoUpdate({
        target: schema.pushTokensTable.token,
        set: { userId, updatedAt: new Date() },
      })
      .returning();
  }

  async getAllTokens(): Promise<Array<{ token: string }>> {
    return this.db
      .select({ token: schema.pushTokensTable.token })
      .from(schema.pushTokensTable);
  }

  async deleteTokensByUserId(userId: string) {
    return this.db
      .delete(schema.pushTokensTable)
      .where(eq(schema.pushTokensTable.userId, userId))
      .returning();
  }

  async deleteTokens(tokens: string[]) {
    if (tokens.length === 0) {
      return [];
    }

    return this.db
      .delete(schema.pushTokensTable)
      .where(inArray(schema.pushTokensTable.token, tokens))
      .returning({ token: schema.pushTokensTable.token });
  }
}
