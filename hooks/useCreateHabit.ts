import { useMutation, useQueryClient } from '@tanstack/react-query';
import { saveHabit } from '../services/habits';
import { queryKeys } from './queryKeys';

export function useCreateHabit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ goal, habit }: { goal: string; habit: string }) =>
      saveHabit(goal, habit),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.todayHabits });
      queryClient.invalidateQueries({ queryKey: queryKeys.habits });
      queryClient.invalidateQueries({ queryKey: queryKeys.history });
      queryClient.invalidateQueries({ queryKey: queryKeys.streak });
    },
  });
}
