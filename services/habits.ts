import { authorizedJson, authorizedRequest } from './backend';
import { 
  type TodayHabit, 
  type HabitRecord, 
  type HabitCheckin,
  type HabitApiRow,
  type HabitHistoryApiRow,
  normalizeHabit,
  normalizeHabitHistory,
  normalizeTodayHabit,
} from '../types/habit';

export type { TodayHabit, HabitRecord, HabitCheckin };

async function fetchHabits(): Promise<HabitRecord[]> {
  const rows = await authorizedJson<HabitApiRow[]>('/api/habits');
  return (rows ?? [])
    .map(normalizeHabit)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export async function getTodayHabits(): Promise<TodayHabit[]> {
  const rows = await authorizedJson<HabitApiRow[]>('/api/habits/today');
  return (rows ?? []).map(normalizeTodayHabit);
}

export async function getHabits(): Promise<HabitRecord[]> {
  return fetchHabits();
}

export async function getHabitHistory(): Promise<HabitCheckin[]> {
  const rows = await authorizedJson<HabitHistoryApiRow[]>('/api/habits/history');
  return (rows ?? [])
    .map(normalizeHabitHistory)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export async function getStreak(): Promise<number> {
  const data = await authorizedJson<{ streak?: number }>('/api/habits/streak');
  return data?.streak ?? 0;
}

export async function updateHabit(id: string, habit: string, goal: string): Promise<void> {
  await authorizedRequest(`/api/habits/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ habit, goal }),
  });
}

export async function updateHabitWithFrequency(
  id: string,
  habit: string,
  goal: string,
  frequency: string,
): Promise<void> {
  await authorizedRequest(`/api/habits/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ habit, goal, frequency }),
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

export async function saveHabit(goal: string, habit: string, frequency = 'daily'): Promise<void> {
  await authorizedRequest('/api/habits', {
    method: 'POST',
    body: JSON.stringify({ goal, habit, frequency }),
  });
}
