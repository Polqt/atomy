import { Body, Controller, Post, UseGuards, BadRequestException } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AiService } from './ai.service';
import { GenerateHabitDto, WeeklyInsightDto } from './ai.dto';
import { SupabaseJwtGuard } from '../../common/supabase-jwt.guard';
import { CurrentUser } from '../../common/current-user.decorator';

@Controller('api')
@UseGuards(SupabaseJwtGuard)
@Throttle({ default: { ttl: 60000, limit: 10 } })
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('generate-habit')
  async generateHabit(
    @CurrentUser('id') userId: string,
    @Body() dto: GenerateHabitDto,
  ) {
    if (!userId) {
      throw new BadRequestException('User ID not found in token');
    }
    return this.aiService.generateHabit(userId, dto);
  }

  @Post('weekly-insight')
  async weeklyInsight(
    @CurrentUser('id') userId: string,
    @Body() dto: WeeklyInsightDto,
  ) {
    if (!userId) {
      throw new BadRequestException('User ID not found in token');
    }
    return this.aiService.weeklyInsight(userId, dto);
  }
}
