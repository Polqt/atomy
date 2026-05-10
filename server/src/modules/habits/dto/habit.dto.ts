import { IsBoolean, IsOptional, IsString, MaxLength, IsNumber, Min } from 'class-validator';

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
}
