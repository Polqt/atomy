import { type WeeklyInsightResult } from '@/services/ai';

export function getFallbackWeeklyInsight(
  completionRate: number,
  tracked: number,
  completed: number,
): WeeklyInsightResult {
  if (tracked === 0) {
    return {
      summary: 'You have no tracked habit entries this week yet.',
      insight: 'Log one habit today to start building your weekly rhythm.',
    };
  }

  if (completionRate >= 80) {
    return {
      summary: `Great consistency this week. You completed ${completed} of ${tracked} tracked days.`,
      insight: 'Keep the same cue and time slot tomorrow to protect your momentum.',
    };
  }

  if (completionRate >= 50) {
    return {
      summary: `Solid progress this week with ${completed} completed days out of ${tracked}.`,
      insight: 'Reduce friction on your toughest day by preparing the habit trigger the night before.',
    };
  }

  return {
    summary: `You completed ${completed} of ${tracked} tracked days this week.`,
    insight: "Shrink tomorrow's habit to a 2-minute version so it is easier to start.",
  };
}

