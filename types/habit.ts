/**
 * Unified Habit Types
 * Single source of truth for all habit-related types across the app
 */

// Note: Internal app types use snake_case to match backend API responses
// This simplifies data flow without needing transformation

// Habit with today's completion status (from /habits/today endpoint)
export type TodayHabit = {
  id: string;
  goal: string;
  habit: string;
  completed: boolean;
  created_at: string;
};

// Full habit record from /habits endpoint
export type HabitRecord = {
  id: string;
  goal: string;
  habit: string;
  completed: boolean;
  created_at: string;
  updated_at: string;
};

// Habit check-in record from /habits/history endpoint
export type HabitCheckin = {
  id: string;
  habit_id: string;
  goal: string;
  habit: string;
  completed: boolean;
  created_at: string;
  checkin_date: string;
};

// API response row types (camelCase from backend JSON)
export type HabitApiRow = {
  id: string;
  goal: string;
  habit: string;
  completed: boolean;
  createdAt: string;
  updatedAt?: string;
};

export type HabitHistoryApiRow = {
  id: string;
  habitId: string;
  goal: string;
  habit: string;
  completed: boolean;
  createdAt: string;
};

// Factory functions for normalization (camelCase API -> snake_case internal)
export function normalizeHabit(row: HabitApiRow): HabitRecord {
  const createdAt = new Date(row.createdAt).toISOString();
  return {
    id: row.id,
    goal: row.goal,
    habit: row.habit,
    completed: row.completed,
    created_at: createdAt,
    updated_at: row.updatedAt ? new Date(row.updatedAt).toISOString() : createdAt,
  };
}

export function normalizeHabitHistory(row: HabitHistoryApiRow): HabitCheckin {
  return {
    id: row.id,
    habit_id: row.habitId,
    goal: row.goal,
    habit: row.habit,
    completed: row.completed,
    created_at: new Date(row.createdAt).toISOString(),
    checkin_date: row.createdAt.slice(0, 10),
  };
}

export function normalizeTodayHabit(row: HabitApiRow): TodayHabit {
  return {
    id: row.id,
    goal: row.goal,
    habit: row.habit,
    completed: row.completed,
    created_at: new Date(row.createdAt).toISOString(),
  };
}

// AI API payload type
export type HabitEntry = {
  habit: string;
  completed: boolean;
};