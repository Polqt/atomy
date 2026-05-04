import { useMutation } from '@tanstack/react-query';
import { generateHabit, type HabitEntry } from '../services/ai';

export function useGenerateHabit() {
  return useMutation({
    mutationFn: ({ goal, history }: { goal: string; history: HabitEntry[] }) =>
      generateHabit(goal, history),
  });
}
