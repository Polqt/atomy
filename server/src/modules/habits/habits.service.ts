import { Injectable, NotFoundException } from '@nestjs/common';
import { HabitsRepository } from './habits.repository';

@Injectable()
export class HabitsService {
  constructor(private readonly habitsRepository: HabitsRepository) {}

  async getHabitsByUser(userId: string, limit?: number, offset?: number) {
    return this.habitsRepository.findByUserId(userId, limit, offset);
  }

  async getTodayHabitsByUser(userId: string) {
    return this.habitsRepository.findTodayByUserId(userId);
  }

  async getHistoryByUser(userId: string, limit?: number, offset?: number) {
    return this.habitsRepository.getHistoryByUserId(userId, limit, offset);
  }

  async getCurrentStreak(userId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get habits created by user to know when streak should start
    const userHabits = await this.habitsRepository.findByUserId(userId, 1000, 0);
    
    if (userHabits.length === 0) {
      return { streak: 0 };
    }

    // Find oldest habit date - streak can only start from when user had habits
    const oldestHabitDate = new Date(
      Math.min(...userHabits.map(h => new Date(h.createdAt).getTime()))
    );
    oldestHabitDate.setHours(0, 0, 0, 0);

    // Calculate date range for checkins (from oldest habit or last 90 days, whichever is more recent)
    const from = new Date(oldestHabitDate);
    const maxDaysBack = new Date(today);
    maxDaysBack.setDate(today.getDate() - 90);
    
    const effectiveFrom = from > maxDaysBack ? from : maxDaysBack;
    const toDate = today.toISOString().slice(0, 10);
    const fromDate = effectiveFrom.toISOString().slice(0, 10);
    
    const checkins = await this.habitsRepository.getCheckinsRangeByUserId(userId, fromDate, toDate);
    const byDate = new Map<string, boolean>();

    checkins.forEach((entry) => {
      const key = entry.checkinDate;
      const prior = byDate.get(key) ?? false;
      byDate.set(key, prior || entry.completed);
    });

    const cursor = new Date(today);
    let streak = 0;

    // Start from today and go backwards
    while (cursor >= effectiveFrom) {
      const key = cursor.toISOString().slice(0, 10);
      
      // If no checkin recorded for this day, check if it's a gap vs just not yet completed today
      if (!byDate.has(key)) {
        // If this is today and no checkin yet, don't break - they might still do it
        if (key === today.toISOString().slice(0, 10)) {
          cursor.setDate(cursor.getDate() - 1);
          continue;
        }
        // For past days, if no checkin at all, streak is broken
        break;
      }
      
      if (byDate.get(key) !== true) {
        break;
      }
      
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    }

    return { streak };
  }

  async createHabit(userId: string, goal: string, habit: string) {
    const rows = await this.habitsRepository.create({ userId, goal, habit, completed: false });
    return rows[0];
  }

  async updateHabit(
    id: string,
    userId: string,
    data: Partial<{ goal: string; habit: string; completed: boolean }>,
  ) {
    if (typeof data.completed === 'boolean') {
      const habit = await this.habitsRepository.findById(id, userId);
      if (!habit) {
        throw new NotFoundException('Habit not found');
      }

      await this.habitsRepository.upsertTodayCheckin(userId, id, data.completed);
      const todayHabits = await this.habitsRepository.findTodayByUserId(userId);
      const updated = todayHabits.find((item) => item.id === id);
      if (!updated) {
        throw new NotFoundException('Habit not found');
      }
      return updated;
    }

    const rows = await this.habitsRepository.update(id, userId, data);
    if (rows.length === 0) {
      throw new NotFoundException('Habit not found');
    }

    return rows[0];
  }

  async deleteHabit(id: string, userId: string) {
    const rows = await this.habitsRepository.delete(id, userId);
    if (rows.length === 0) {
      throw new NotFoundException('Habit not found');
    }

    return rows[0];
  }

  async getHabitById(id: string, userId: string) {
    const habit = await this.habitsRepository.findById(id, userId);
    if (!habit) {
      throw new NotFoundException('Habit not found');
    }

    return habit;
  }
}
