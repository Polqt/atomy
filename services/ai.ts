import { supabase } from '../config/supabase';

const API_URL = process.env.EXPO_PUBLIC_API_URL;
if (!API_URL) {
  throw new Error(
    '[atomy] EXPO_PUBLIC_API_URL is not set. Add it to your .env file.',
  );
}

export type HabitEntry = {
  habit: string;
  completed: boolean;
};

export type GenerateHabitResult = {
  habit: string;
  reason: string;
};

export type WeeklyInsightResult = {
  summary: string;
  insight: string;
};

export async function getWeeklyInsight(
  habits: HabitEntry[]
): Promise<WeeklyInsightResult> {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    throw new Error('Not authenticated');
  }

  const res = await fetch(`${API_URL}/api/weekly-insight`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ habits }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? `Request failed: ${res.status}`);
  }

  return res.json();
}

export async function generateHabit(
  goal: string,
  history: HabitEntry[] = []
): Promise<GenerateHabitResult> {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    throw new Error('Not authenticated');
  }

  const res = await fetch(`${API_URL}/api/generate-habit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ goal, history }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? `Request failed: ${res.status}`);
  }

  return res.json();
}
