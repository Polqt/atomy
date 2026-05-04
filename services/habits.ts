import { supabase } from '../config/supabase';

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

async function getAuthenticatedUserId(): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  return user.id;
}

export async function getTodayHabits(): Promise<TodayHabit[]> {
  const userId = await getAuthenticatedUserId();

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);

  const { data, error } = await supabase
    .from('habits')
    .select('id, goal, habit, completed')
    .eq('user_id', userId)
    .gte('created_at', todayStart.toISOString())
    .lt('created_at', tomorrowStart.toISOString())
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getHabits(): Promise<HabitRow[]> {
  const userId = await getAuthenticatedUserId();

  const { data, error } = await supabase
    .from('habits')
    .select('id, goal, habit, completed, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getStreak(): Promise<number> {
  const userId = await getAuthenticatedUserId();

  const { data, error } = await supabase
    .from('habits')
    .select('completed, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  if (!data || data.length === 0) return 0;

  // A day counts as completed if ANY habit that day was completed.
  const byDate = new Map<string, boolean>();
  for (const row of data) {
    const day = row.created_at.slice(0, 10);
    if (!byDate.has(day)) byDate.set(day, row.completed);
    else if (row.completed) byDate.set(day, true);
  }

  // Walk backwards from yesterday (today is in-progress, don't penalise).
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

  // Count today if any habit is already completed.
  const todayKey = new Date().toISOString().slice(0, 10);
  if (byDate.get(todayKey) === true) streak++;

  return streak;
}

export async function updateHabit(id: string, habit: string, goal: string): Promise<void> {
  const userId = await getAuthenticatedUserId();

  const { error } = await supabase
    .from('habits')
    .update({ habit, goal })
    .eq('id', id)
    .eq('user_id', userId);

  if (error) throw new Error(error.message);
}

export async function deleteHabit(id: string): Promise<void> {
  const userId = await getAuthenticatedUserId();

  const { error } = await supabase
    .from('habits')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) throw new Error(error.message);
}

export async function markHabit(id: string, completed: boolean): Promise<void> {
  const userId = await getAuthenticatedUserId();

  const { error } = await supabase
    .from('habits')
    .update({ completed })
    .eq('id', id)
    .eq('user_id', userId);

  if (error) throw new Error(error.message);
}

export async function saveHabit(goal: string, habit: string): Promise<void> {
  const userId = await getAuthenticatedUserId();

  const { error } = await supabase.from('habits').insert({
    user_id: userId,
    goal,
    habit,
    completed: false,
  });

  if (error) throw new Error(error.message);
}
