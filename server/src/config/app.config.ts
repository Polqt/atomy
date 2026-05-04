import { ConfigService } from '@nestjs/config';
import { AppConfig } from './env.validation';

export const appConfigFactory = (configService: ConfigService): AppConfig => ({
  nodeEnv: configService.getOrThrow<string>('NODE_ENV'),
  port: configService.getOrThrow<number>('PORT'),
  database: {
    url: configService.getOrThrow<string>('DATABASE_URL'),
  },
  supabase: {
    url: configService.getOrThrow<string>('SUPABASE_URL'),
    serviceRoleKey: configService.getOrThrow<string>('SUPABASE_SERVICE_ROLE_KEY'),
    jwksUrl: configService.getOrThrow<string>('SUPABASE_JWKS_URL'),
  },
  groq: {
    apiKey: configService.getOrThrow<string>('GROQ_API_KEY'),
    model: configService.get<string>('GROQ_MODEL') ?? 'llama3-8b-8192',
  },
  logLevel: configService.get<string>('LOG_LEVEL') ?? 'info',
});
