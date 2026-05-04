import { useMutation } from '@tanstack/react-query';
import { getWeeklyInsight, type HabitEntry } from '../services/ai';

export function useWeeklyInsight() {
  return useMutation({
    mutationFn: (habits: HabitEntry[]) => getWeeklyInsight(habits),
  });
}
