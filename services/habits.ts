import { authorizedJson, authorizedRequest } from './backend';

export type TodayHabit = {
  id: string;
  goal: string;
  habit: string;
  completed: boolean;
};

export type HabitRow = {
  id: string;
  goal: string;
  habit: string;
  completed: boolean;
  created_at: string;
  updated_at: string;
};

export type HabitHistoryRow = {
  id: string;
  habit_id: string;
  goal: string;
  habit: string;
  completed: boolean;
  created_at: string;
};

type HabitApiRow = {
  id: string;
  goal: string;
  habit: string;
  completed: boolean;
  createdAt: string;
  updatedAt?: string;
};

type HabitHistoryApiRow = {
  id: string;
  habitId: string;
  goal: string;
  habit: string;
  completed: boolean;
  createdAt: string;
};

function normalizeHabit(row: HabitApiRow): HabitRow {
  const createdAt = new Date(row.createdAt).toISOString();
  const updatedAt = row.updatedAt
    ? new Date(row.updatedAt).toISOString()
    : createdAt;

  return {
    id: row.id,
    goal: row.goal,
    habit: row.habit,
    completed: row.completed,
    created_at: createdAt,
    updated_at: updatedAt,
  };
}

function normalizeHabitHistory(row: HabitHistoryApiRow): HabitHistoryRow {
  return {
    id: row.id,
    habit_id: row.habitId,
    goal: row.goal,
    habit: row.habit,
    completed: row.completed,
    created_at: new Date(row.createdAt).toISOString(),
  };
}

async function fetchHabits(): Promise<HabitRow[]> {
  const rows = await authorizedJson<HabitApiRow[]>('/api/habits');
  return (rows ?? [])
    .map(normalizeHabit)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export async function getTodayHabits(): Promise<TodayHabit[]> {
  const rows = await authorizedJson<HabitApiRow[]>('/api/habits/today');
  return (rows ?? []).map(normalizeHabit).map((habit) => ({
    id: habit.id,
    goal: habit.goal,
    habit: habit.habit,
    completed: habit.completed,
  }));
}

export async function getHabits(): Promise<HabitRow[]> {
  return fetchHabits();
}

export async function getHabitHistory(): Promise<HabitHistoryRow[]> {
  const rows = await authorizedJson<HabitHistoryApiRow[]>('/api/habits/history');
  return (rows ?? [])
    .map(normalizeHabitHistory)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export async function getStreak(): Promise<number> {
  const data = await authorizedJson<{ streak?: number }>('/api/habits/streak');
  if (typeof data?.streak === 'number') {
    return data.streak;
  }
  return 0;
}

export async function updateHabit(id: string, habit: string, goal: string): Promise<void> {
  await authorizedRequest(`/api/habits/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ habit, goal }),
  });
}

export async function deleteHabit(id: string): Promise<void> {
  await authorizedRequest(`/api/habits/${id}`, {
    method: 'DELETE',
  });
}

export async function markHabit(id: string, completed: boolean): Promise<void> {
  await authorizedRequest(`/api/habits/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ completed }),
  });
}

export async function saveHabit(goal: string, habit: string): Promise<void> {
  await authorizedRequest('/api/habits', {
    method: 'POST',
    body: JSON.stringify({ goal, habit }),
  });
}
