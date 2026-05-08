import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

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
