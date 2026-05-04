import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  UseGuards,
  Body,
  Param,
  BadRequestException,
} from '@nestjs/common';
import { HabitsService } from './habits.service';
import { SupabaseJwtGuard } from '../../common/supabase-jwt.guard';
import { CurrentUser } from '../../common/current-user.decorator';

@Controller('api/habits')
@UseGuards(SupabaseJwtGuard)
export class HabitsController {
  constructor(private readonly habitsService: HabitsService) {}

  @Get()
  async getHabits(@CurrentUser('id') userId: string) {
    if (!userId) throw new BadRequestException('User ID not found');
    return this.habitsService.getHabitsByUser(userId);
  }

  @Get(':id')
  async getHabit(@Param('id') id: string, @CurrentUser('id') userId: string) {
    if (!userId) throw new BadRequestException('User ID not found');
    return this.habitsService.getHabitById(id, userId);
  }

  @Post()
  async createHabit(
    @CurrentUser('id') userId: string,
    @Body() body: { goal: string; habit: string },
  ) {
    if (!userId) throw new BadRequestException('User ID not found');
    if (!body.goal || !body.habit) {
      throw new BadRequestException('goal and habit are required');
    }
    return this.habitsService.createHabit(userId, body.goal, body.habit);
  }

  @Put(':id')
  async updateHabit(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() body: Partial<{ goal: string; habit: string; completed: boolean }>,
  ) {
    if (!userId) throw new BadRequestException('User ID not found');
    return this.habitsService.updateHabit(id, userId, body);
  }

  @Delete(':id')
  async deleteHabit(@Param('id') id: string, @CurrentUser('id') userId: string) {
    if (!userId) throw new BadRequestException('User ID not found');
    return this.habitsService.deleteHabit(id, userId);
  }
}
