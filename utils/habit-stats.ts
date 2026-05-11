import { type HabitCheckin } from '@/services/habits';

type HabitCompletionEntry = Pick<HabitCheckin, 'created_at' | 'completed'>;

export type DayCompletionSummary = {
  dateKey: string;
  completed: boolean | null;
  completedCount?: number;
};

function dayStart(value: Date) {
  const next = new Date(value);
  next.setHours(0, 0, 0, 0);
  return next;
}

function getDateKey(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getCompletionRate(completed: number, total: number) {
  if (total <= 0) return 0;
  return Math.round((completed / total) * 100);
}

export function getCompletionStats(habits: Array<{ completed: boolean }>) {
  const completed = habits.filter((habit) => habit.completed).length;
  const total = habits.length;
  return { completed, total, rate: getCompletionRate(completed, total) };
}

export function buildDayMap(habits: HabitCompletionEntry[]) {
  const byDate = new Map<string, boolean>();
  for (const habit of habits) {
    const dateKey = getDateKey(new Date(habit.created_at));
    if (!byDate.has(dateKey)) byDate.set(dateKey, habit.completed);
    else if (habit.completed) byDate.set(dateKey, true);
  }
  return byDate;
}

export function buildRecentDaySummary(habits: HabitCompletionEntry[], days: number) {
  const byDate = buildDayMap(habits);
  const summary: DayCompletionSummary[] = [];

  for (let offset = days - 1; offset >= 0; offset--) {
    const d = dayStart(new Date());
    d.setDate(d.getDate() - offset);
    const dateKey = getDateKey(d);
    summary.push({
      dateKey,
      completed: byDate.has(dateKey) ? byDate.get(dateKey)! : null,
    });
  }

  return summary;
}

export function buildCurrentWeekSummary(habits: HabitCompletionEntry[]) {
  const byDate = new Map<string, { completedCount: number; total: number }>();

  for (const habit of habits) {
    const dateKey = getDateKey(new Date(habit.created_at));
    if (!byDate.has(dateKey)) byDate.set(dateKey, { completedCount: 0, total: 0 });
    const stat = byDate.get(dateKey)!;
    stat.total += 1;
    if (habit.completed) stat.completedCount += 1;
  }

  const today = dayStart(new Date());
  const start = dayStart(today);
  start.setDate(today.getDate() - today.getDay());
  const summary: DayCompletionSummary[] = [];

  for (let offset = 0; offset < 7; offset++) {
    const d = dayStart(start);
    d.setDate(start.getDate() + offset);
    const dateKey = getDateKey(d);
    const stat = byDate.get(dateKey);

    summary.push({
      dateKey,
      completed: stat ? stat.completedCount > 0 : null,
      completedCount: stat?.completedCount ?? 0,
    });
  }

  return summary;
}

export function computeMostConsistentDay(habits: HabitCompletionEntry[]) {
  const byWeekDay = new Map<number, { completed: number; total: number }>();

  for (const habit of habits) {
    const day = new Date(habit.created_at).getDay();
    if (!byWeekDay.has(day)) byWeekDay.set(day, { completed: 0, total: 0 });
    const stat = byWeekDay.get(day)!;
    stat.total += 1;
    if (habit.completed) stat.completed += 1;
  }

  let bestDay: number | null = null;
  let bestScore = -1;

  for (const [day, stat] of byWeekDay.entries()) {
    if (stat.total === 0) continue;
    const score = stat.completed / stat.total;
    if (score > bestScore || (score === bestScore && stat.total > (byWeekDay.get(bestDay ?? -1)?.total ?? 0))) {
      bestScore = score;
      bestDay = day;
    }
  }

  if (bestDay === null) return '-';
  const ref = new Date();
  const current = ref.getDay();
  const delta = (bestDay - current + 7) % 7;
  ref.setDate(ref.getDate() + delta);
  return ref.toLocaleDateString('en-US', { weekday: 'long' });
}

export function computeCurrentStreak(habits: HabitCompletionEntry[]) {
  const byDate = buildDayMap(habits);
  const cursor = dayStart(new Date());
  let streak = 0;

  while (true) {
    const key = getDateKey(cursor);
    if (!byDate.has(key)) break;
    if (byDate.get(key) !== true) break;
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}
