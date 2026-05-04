import { IsString, IsOptional, IsArray, MaxLength, ValidateNested, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

class HabitEntryDto {
  @IsString()
  @MaxLength(200)
  habit!: string;

  @IsBoolean()
  completed!: boolean;
}

export class GenerateHabitDto {
  @IsString()
  @MaxLength(200)
  goal!: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => HabitEntryDto)
  history?: HabitEntryDto[];
}

export class WeeklyInsightDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => HabitEntryDto)
  habits!: HabitEntryDto[];
}
