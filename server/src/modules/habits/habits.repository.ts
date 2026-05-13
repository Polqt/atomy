import { Injectable, Inject } from '@nestjs/common';
import { and, desc, eq, gte, lte, sql } from 'drizzle-orm';
import { DB_CONNECTION } from '../../database/database.constants';
import { DatabaseType } from '../../database/database.module';
import * as schema from '../../database/schema';

@Injectable()
export class HabitsRepository {
  constructor(@Inject(DB_CONNECTION) private readonly db: DatabaseType) {}

  private toDateKey(value = new Date()) {
    return value.toISOString().slice(0, 10);
  }

  async findByUserId(userId: string, limit?: number, offset?: number) {
    return this.db
      .select()
      .from(schema.habitsTable)
      .where(eq(schema.habitsTable.userId, userId))
      .orderBy(desc(schema.habitsTable.createdAt))
      .limit(limit ?? 100)
      .offset(offset ?? 0);
  }

  async findTodayByUserId(userId: string) {
    const today = this.toDateKey();

    return this.db
      .select({
        id: schema.habitsTable.id,
        userId: schema.habitsTable.userId,
        goal: schema.habitsTable.goal,
        habit: schema.habitsTable.habit,
        frequency: schema.habitsTable.frequency,
        completed: sql<boolean>`coalesce(${schema.habitCheckinsTable.completed}, false)`,
        createdAt: schema.habitsTable.createdAt,
        updatedAt: schema.habitsTable.updatedAt,
      })
      .from(schema.habitsTable)
      .leftJoin(
        schema.habitCheckinsTable,
        and(
          eq(schema.habitCheckinsTable.habitId, schema.habitsTable.id),
          eq(schema.habitCheckinsTable.userId, userId),
          eq(schema.habitCheckinsTable.checkinDate, today),
        ),
      )
      .where(eq(schema.habitsTable.userId, userId))
      .orderBy(desc(schema.habitsTable.createdAt));
  }

  async upsertTodayCheckin(userId: string, habitId: string, completed: boolean) {
    const today = this.toDateKey();

    const checkins = await this.db
      .insert(schema.habitCheckinsTable)
      .values({
        userId,
        habitId,
        checkinDate: today,
        completed,
      })
      .onConflictDoUpdate({
        target: [
          schema.habitCheckinsTable.habitId,
          schema.habitCheckinsTable.checkinDate,
        ],
        set: { completed, updatedAt: new Date() },
      })
      .returning();

    return checkins[0] ?? null;
  }

  async getHistoryByUserId(userId: string, limit?: number, offset?: number) {
    return this.db
      .select({
        id: schema.habitCheckinsTable.id,
        habitId: schema.habitCheckinsTable.habitId,
        goal: schema.habitsTable.goal,
        habit: schema.habitsTable.habit,
        frequency: schema.habitsTable.frequency,
        completed: schema.habitCheckinsTable.completed,
        createdAt: schema.habitCheckinsTable.createdAt,
        checkinDate: schema.habitCheckinsTable.checkinDate,
      })
      .from(schema.habitCheckinsTable)
      .innerJoin(
        schema.habitsTable,
        and(
          eq(schema.habitsTable.id, schema.habitCheckinsTable.habitId),
          eq(schema.habitsTable.userId, userId),
        ),
      )
      .where(eq(schema.habitCheckinsTable.userId, userId))
      .orderBy(desc(schema.habitCheckinsTable.checkinDate), desc(schema.habitCheckinsTable.createdAt))
      .limit(limit ?? 100)
      .offset(offset ?? 0);
  }

  async getCheckinsRangeByUserId(userId: string, fromDate: string, toDate: string) {
    return this.db
      .select({
        checkinDate: schema.habitCheckinsTable.checkinDate,
        completed: schema.habitCheckinsTable.completed,
      })
      .from(schema.habitCheckinsTable)
      .where(
        and(
          eq(schema.habitCheckinsTable.userId, userId),
          gte(schema.habitCheckinsTable.checkinDate, fromDate),
          lte(schema.habitCheckinsTable.checkinDate, toDate),
        ),
      );
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
    frequency?: string;
    completed?: boolean;
  }) {
    return this.db.insert(schema.habitsTable).values(data).returning();
  }

  async update(
    id: string,
    userId: string,
    data: Partial<{ goal: string; habit: string; completed: boolean; frequency: string }>,
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
