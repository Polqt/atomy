import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { AiRepository } from './ai.repository';

@Module({
  imports: [DatabaseModule],
  controllers: [AiController],
  providers: [AiService, AiRepository],
  exports: [AiService],
})
export class AiModule {}
