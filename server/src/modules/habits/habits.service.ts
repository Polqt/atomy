import { Injectable } from '@nestjs/common';
import { HabitsRepository } from './habits.repository';

@Injectable()
export class HabitsService {
  constructor(private readonly habitsRepository: HabitsRepository) {}

  async getHabitsByUser(userId: string) {
    return this.habitsRepository.findByUserId(userId);
  }

  async createHabit(userId: string, goal: string, habit: string) {
    return this.habitsRepository.create({ userId, goal, habit, completed: false });
  }

  async updateHabit(
    id: string,
    userId: string,
    data: Partial<{ goal: string; habit: string; completed: boolean }>,
  ) {
    return this.habitsRepository.update(id, userId, data);
  }

  async deleteHabit(id: string, userId: string) {
    return this.habitsRepository.delete(id, userId);
  }

  async getHabitById(id: string, userId: string) {
    return this.habitsRepository.findById(id, userId);
  }
}
