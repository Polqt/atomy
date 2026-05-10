import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { drizzle, PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { DB_CONNECTION } from './database.constants';
import * as schema from './schema';

export type DatabaseType = PostgresJsDatabase<{
  usersTable: typeof schema.usersTable;
  habitsTable: typeof schema.habitsTable;
  aiRequestsTable: typeof schema.aiRequestsTable;
  pushTokensTable: typeof schema.pushTokensTable;
}>;

@Module({
  providers: [
    {
      provide: DB_CONNECTION,
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const databaseUrl = configService.getOrThrow<string>('DATABASE_URL');
        const client = postgres(databaseUrl, {
          max: 20,
          idle_timeout: 20,
          connect_timeout: 10,
        });
        return drizzle(client, { schema });
      },
    },
  ],
  exports: [DB_CONNECTION],
})
export class DatabaseModule {}
