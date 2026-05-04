import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './src/database/schema';

async function seed() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  const client = postgres(process.env.DATABASE_URL);
  const db = drizzle(client, { schema });

  console.log('🌱 Starting database seed...');

  try {
    // Insert test user
    const testUserId = 'test-user-1';
    await db
      .insert(schema.usersTable)
      .values({
        id: testUserId,
        email: 'test@example.com',
      })
      .onConflictDoNothing();

    console.log('✅ Test user created');

    // Insert sample habits
    await db
      .insert(schema.habitsTable)
      .values([
        {
          userId: testUserId,
          goal: 'Get fit',
          habit: 'Morning jog - 10 minutes',
          completed: false,
        },
        {
          userId: testUserId,
          goal: 'Learn programming',
          habit: 'Code review - 30 minutes',
          completed: false,
        },
        {
          userId: testUserId,
          goal: 'Health',
          habit: 'Drink 8 glasses of water',
          completed: false,
        },
      ])
      .onConflictDoNothing();

    console.log('✅ Sample habits created');
    console.log('🌱 Seed completed successfully!');
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

seed();
