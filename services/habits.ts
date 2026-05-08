import { authorizedJson, authorizedRequest } from './backend';
import { computeCurrentStreak } from '@/utils/habit-stats';

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
};

type HabitApiRow = {
  id: string;
  goal: string;
  habit: string;
  completed: boolean;
  createdAt: string;
  updatedAt?: string;
};

function normalizeHabit(row: HabitApiRow): HabitRow {
  return {
    id: row.id,
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
  const habits = await fetchHabits();

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);

  return habits.filter((habit) => {
    const createdAt = new Date(habit.created_at);
    return createdAt >= todayStart && createdAt < tomorrowStart;
  });
}

export async function getHabits(): Promise<HabitRow[]> {
  return fetchHabits();
}

export async function getStreak(): Promise<number> {
  return computeCurrentStreak(await fetchHabits());
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
