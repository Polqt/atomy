import { IsBoolean, IsIn, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';

const HABIT_FREQUENCIES = ['daily', 'weekly', 'monthly', 'weekdays', 'weekends'] as const;

export class PaginationDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  limit?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  offset?: number;
}

export class CreateHabitDto {
  @IsString()
  @MaxLength(200)
  goal!: string;

  @IsString()
  @MaxLength(200)
  habit!: string;

  @IsOptional()
  @IsString()
  @IsIn(HABIT_FREQUENCIES)
  frequency?: string;
}

export class UpdateHabitDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  goal?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  habit?: string;

  @IsOptional()
  @IsBoolean()
  completed?: boolean;

  @IsOptional()
  @IsString()
  @IsIn(HABIT_FREQUENCIES)
  frequency?: string;
}
