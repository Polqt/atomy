import { HabitRow } from "@/services/habits";
import { DayCompletionSummary } from "./habit-stats";

type Section = {
  title: string; // YYYY-MM-DD
  data: HabitRow[];
};


export function formatSectionDate(iso: string) {
  const d = new Date(iso + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const target = new Date(d);
  target.setHours(0, 0, 0, 0);

  if (target.getTime() === today.getTime()) return { label: 'Today', sub: d.toLocaleDateString('en-US', { month: 'long', day: 'numeric' }) };
  if (target.getTime() === yesterday.getTime()) return { label: 'Yesterday', sub: d.toLocaleDateString('en-US', { month: 'long', day: 'numeric' }) };

  return {
    label: d.toLocaleDateString('en-US', { weekday: 'long' }),
    sub: d.toLocaleDateString('en-US', { month: 'long', day: 'numeric' }),
  };
}

export function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

export function groupByDate(habits: HabitRow[]): Section[] {
  const map = new Map<string, HabitRow[]>();
  for (const h of habits) {
    const day = h.created_at.slice(0, 10);
    if (!map.has(day)) map.set(day, []);
    map.get(day)!.push(h);
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([title, data]) => ({ title, data }));
}

export function formatWeekRange(week: DayCompletionSummary[]) {
  if (week.length === 0) return '';
  const first = new Date(`${week[0].dateKey}T00:00:00`);
  const last = new Date(`${week[week.length - 1].dateKey}T00:00:00`);

  const firstLabel = first.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const lastLabel = last.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `${firstLabel} - ${lastLabel}`;
}