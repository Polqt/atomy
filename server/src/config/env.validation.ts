import * as Joi from 'joi';

export const envSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().default(3000),
  DATABASE_URL: Joi.string().required(),
  SUPABASE_URL: Joi.string().required(),
  SUPABASE_SERVICE_ROLE_KEY: Joi.string().required(),
  SUPABASE_JWKS_URL: Joi.string().required(),
  GROQ_API_KEY: Joi.string().required(),
  GROQ_MODEL: Joi.string().default('llama3-8b-8192'),
  LOG_LEVEL: Joi.string().default('info'),
  ALLOWED_ORIGINS: Joi.string().optional(),
}).unknown(true);

export interface AppConfig {
  nodeEnv: string;
  port: number;
  database: {
    url: string;
  };
  supabase: {
    url: string;
    serviceRoleKey: string;
    jwksUrl: string;
  };
  groq: {
    apiKey: string;
    model: string;
  };
  logLevel: string;
}
