import {
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  boolean,
  uuid,
  date,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

export const usersTable = pgTable('users', {
  id: uuid('id').primaryKey(),
  email: text('email').unique().notNull(),
  name: text('name'),
  preferences: jsonb('preferences').$type<Record<string, unknown>>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull().$onUpdateFn(() => new Date()),
});

export const habitsTable = pgTable('habits', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => usersTable.id, { onDelete: 'cascade' }),
  goal: text('goal').notNull(),
  habit: text('habit').notNull(),
  frequency: text('frequency').default('daily').notNull(),
  completed: boolean('completed').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull().$onUpdateFn(() => new Date()),
});

export const habitCheckinsTable = pgTable(
  'habit_checkins',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade' }),
    habitId: uuid('habit_id')
      .notNull()
      .references(() => habitsTable.id, { onDelete: 'cascade' }),
    checkinDate: date('checkin_date').notNull(),
    completed: boolean('completed').default(false).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull().$onUpdateFn(() => new Date()),
  },
  (table) => ({
    habitDateUnique: uniqueIndex('habit_checkins_habit_date_unique').on(
      table.habitId,
      table.checkinDate,
    ),
  }),
);

export const pushTokensTable = pgTable('push_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => usersTable.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull().$onUpdateFn(() => new Date()),
});

export const aiRequestsTable = pgTable('ai_requests', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => usersTable.id, { onDelete: 'cascade' }),
  endpoint: text('endpoint').notNull(),
  prompt: text('prompt').notNull(),
  response: text('response').notNull(),
  tokensUsed: integer('tokens_used'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
