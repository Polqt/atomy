import { IsString, Matches } from 'class-validator';

export class RegisterTokenDto {
  @IsString()
  @Matches(/^ExponentPushToken\[.+\]$/, { message: 'Invalid Expo push token format' })
  token!: string;
}
