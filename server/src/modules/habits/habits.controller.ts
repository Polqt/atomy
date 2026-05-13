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
  Query,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { HabitsService } from './habits.service';
import { SupabaseJwtGuard } from '../../common/supabase-jwt.guard';
import { CurrentUser } from '../../common/current-user.decorator';
import { CreateHabitDto, UpdateHabitDto, PaginationDto } from './dto/habit.dto';

@Controller('api/habits')
@UseGuards(SupabaseJwtGuard)
@Throttle({ default: { ttl: 60000, limit: 30 } })
export class HabitsController {
  constructor(private readonly habitsService: HabitsService) {}

  @Get()
  async getHabits(
    @CurrentUser('id') userId: string,
    @Query() pagination: PaginationDto,
  ) {
    return this.habitsService.getHabitsByUser(userId, pagination.limit, pagination.offset);
  }

  @Get('today')
  async getTodayHabits(@CurrentUser('id') userId: string) {
    return this.habitsService.getTodayHabitsByUser(userId);
  }

  @Get('history')
  async getHistory(
    @CurrentUser('id') userId: string,
    @Query() pagination: PaginationDto,
  ) {
    return this.habitsService.getHistoryByUser(userId, pagination.limit, pagination.offset);
  }

  @Get('streak')
  async getStreak(@CurrentUser('id') userId: string) {
    return this.habitsService.getCurrentStreak(userId);
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
    return this.habitsService.createHabit(userId, body.goal, body.habit, body.frequency);
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
