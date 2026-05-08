import { Injectable, NotFoundException } from '@nestjs/common';
import { HabitsRepository } from './habits.repository';

@Injectable()
export class HabitsService {
  constructor(private readonly habitsRepository: HabitsRepository) {}

  async getHabitsByUser(userId: string) {
    return this.habitsRepository.findByUserId(userId);
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
