import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  UseGuards,
  Body,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { HabitsService } from './habits.service';
import { SupabaseJwtGuard } from '../../common/supabase-jwt.guard';
import { CurrentUser } from '../../common/current-user.decorator';
import { CreateHabitDto, UpdateHabitDto } from './dto/habit.dto';

@Controller('api/habits')
@UseGuards(SupabaseJwtGuard)
export class HabitsController {
  constructor(private readonly habitsService: HabitsService) {}

  @Get()
  async getHabits(@CurrentUser('id') userId: string) {
    return this.habitsService.getHabitsByUser(userId);
  }

  @Get(':id')
  async getHabit(@Param('id', ParseUUIDPipe) id: string, @CurrentUser('id') userId: string) {
    return this.habitsService.getHabitById(id, userId);
  }

  @Post()
  async createHabit(
    @CurrentUser('id') userId: string,
    @Body() body: CreateHabitDto,
  ) {
    return this.habitsService.createHabit(userId, body.goal, body.habit);
  }

  @Put(':id')
  async updateHabit(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
    @Body() body: UpdateHabitDto,
  ) {
    return this.habitsService.updateHabit(id, userId, body);
  }

  @Delete(':id')
  async deleteHabit(@Param('id', ParseUUIDPipe) id: string, @CurrentUser('id') userId: string) {
    return this.habitsService.deleteHabit(id, userId);
  }
}
