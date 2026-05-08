import { Injectable, Inject } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DB_CONNECTION } from '../../database/database.constants';
import { DatabaseType } from '../../database/database.module';
import * as schema from '../../database/schema';

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

  async upsert(data: {
    id: string;
    email: string;
    name?: string;
    preferences?: Record<string, unknown>;
  }) {
    const values = {
      id: data.id,
      email: data.email,
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.preferences !== undefined ? { preferences: data.preferences } : {}),
    };

    const updateValues = {
      email: data.email,
      updatedAt: new Date(),
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.preferences !== undefined ? { preferences: data.preferences } : {}),
    };

    return this.db
      .insert(schema.usersTable)
      .values(values)
      .onConflictDoUpdate({
        target: schema.usersTable.id,
        set: updateValues,
      })
      .returning();
  }
}
