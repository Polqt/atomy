import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { HabitsController } from './habits.controller';
import { HabitsService } from './habits.service';
import { HabitsRepository } from './habits.repository';

@Module({
  imports: [DatabaseModule],
  controllers: [HabitsController],
  providers: [HabitsService, HabitsRepository],
  exports: [HabitsService],
})
export class HabitsModule {}
