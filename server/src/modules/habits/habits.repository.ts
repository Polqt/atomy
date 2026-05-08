import { Injectable, Inject } from '@nestjs/common';
import { and, desc, eq } from 'drizzle-orm';
import { DB_CONNECTION } from '../../database/database.constants';
import { DatabaseType } from '../../database/database.module';
import * as schema from '../../database/schema';

@Injectable()
export class HabitsRepository {
  constructor(@Inject(DB_CONNECTION) private readonly db: DatabaseType) {}

  async findByUserId(userId: string) {
    return this.db
      .select()
      .from(schema.habitsTable)
      .where(eq(schema.habitsTable.userId, userId))
      .orderBy(desc(schema.habitsTable.createdAt));
  }

  async findById(id: string, userId: string) {
    const rows = await this.db
      .select()
      .from(schema.habitsTable)
      .where(and(eq(schema.habitsTable.id, id), eq(schema.habitsTable.userId, userId)))
      .limit(1);

    return rows[0] ?? null;
  }

  async create(data: {
    userId: string;
    goal: string;
    habit: string;
    completed?: boolean;
  }) {
    return this.db.insert(schema.habitsTable).values(data).returning();
  }

  async update(
    id: string,
    userId: string,
    data: Partial<{ goal: string; habit: string; completed: boolean }>,
  ) {
    return this.db
      .update(schema.habitsTable)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(schema.habitsTable.id, id), eq(schema.habitsTable.userId, userId)))
      .returning();
  }

  async delete(id: string, userId: string) {
    return this.db
      .delete(schema.habitsTable)
      .where(and(eq(schema.habitsTable.id, id), eq(schema.habitsTable.userId, userId)))
      .returning({ id: schema.habitsTable.id });
  }
}
