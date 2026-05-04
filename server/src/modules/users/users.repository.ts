import { Injectable, Inject } from '@nestjs/common';
import { DB_CONNECTION } from '../../database/database.constants';
import { DatabaseType } from '../../database/database.module';
import * as schema from '../../database/schema';
import { eq } from 'drizzle-orm';

@Injectable()
export class UsersRepository {
  constructor(@Inject(DB_CONNECTION) private readonly db: DatabaseType) {}

  async findById(id: string) {
    return this.db.select().from(schema.usersTable).where(eq(schema.usersTable.id, id)).limit(1);
  }

  async findByEmail(email: string) {
    return this.db
      .select()
      .from(schema.usersTable)
      .where(eq(schema.usersTable.email, email))
      .limit(1);
  }

  async upsert(data: { id: string; email: string }) {
    return this.db
      .insert(schema.usersTable)
      .values(data)
      .onConflictDoUpdate({
        target: schema.usersTable.id,
        set: { email: data.email, updatedAt: new Date() },
      })
      .returning();
  }

  async updateProfile(
    id: string,
    data: Partial<{ name: string; preferences: Record<string, unknown> }>,
  ) {
    return this.db
      .update(schema.usersTable)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(schema.usersTable.id, id))
      .returning();
  }
}
