import { supabase } from '../config/supabase';

export type TodayHabit = {
  id: string;
  goal: string;
  habit: string;
  completed: boolean;
};

export async function getTodayHabit(): Promise<TodayHabit | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from('habits')
    .select('id, goal, habit, completed')
    .eq('user_id', user.id)
    .gte('created_at', todayStart.toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

export type HabitRow = {
  id: string;
  goal: string;
  habit: string;
  completed: boolean;
  created_at: string;
};

export async function getHabits(): Promise<HabitRow[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('habits')
    .select('id, goal, habit, completed, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getStreak(): Promise<number> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('habits')
    .select('completed, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  if (!data || data.length === 0) return 0;

  // Bucket rows by calendar date (YYYY-MM-DD), keeping the latest row per day
  const byDate = new Map<string, boolean>();
  for (const row of data) {
    const day = row.created_at.slice(0, 10);
    if (!byDate.has(day)) byDate.set(day, row.completed);
  }

  // Walk backwards from yesterday (today is in-progress, don't penalise)
  let streak = 0;
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  cursor.setDate(cursor.getDate() - 1);

  while (true) {
    const key = cursor.toISOString().slice(0, 10);
    if (!byDate.has(key)) break;
    if (!byDate.get(key)) break;
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }

  // Count today too if already completed
  const todayKey = new Date().toISOString().slice(0, 10);
  if (byDate.get(todayKey) === true) streak++;

  return streak;
}

export async function markHabit(id: string, completed: boolean): Promise<void> {
  const { error } = await supabase
    .from('habits')
    .update({ completed })
    .eq('id', id);

  if (error) throw new Error(error.message);
}

export async function saveHabit(goal: string, habit: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase.from('habits').insert({
    user_id: user.id,
    goal,
    habit,
    completed: false,
  });

  if (error) throw new Error(error.message);
}
