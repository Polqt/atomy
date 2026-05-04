import { useMutation, useQueryClient } from '@tanstack/react-query';
import { markHabit, type TodayHabit, type HabitRow } from '../services/habits';
import { queryKeys } from './queryKeys';

export function useMarkHabit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, completed }: { id: string; completed: boolean }) =>
      markHabit(id, completed),

    onMutate: async ({ id, completed }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.todayHabit });
      await queryClient.cancelQueries({ queryKey: queryKeys.habits });

      const prevToday = queryClient.getQueryData<TodayHabit | null>(queryKeys.todayHabit);
      const prevHabits = queryClient.getQueryData<HabitRow[]>(queryKeys.habits);

      queryClient.setQueryData<TodayHabit | null>(
        queryKeys.todayHabit,
        (old) => (old ? { ...old, completed } : old),
      );
      queryClient.setQueryData<HabitRow[]>(
        queryKeys.habits,
        (old) => old?.map((h) => (h.id === id ? { ...h, completed } : h)),
      );

      return { prevToday, prevHabits };
    },

    onError: (_err, _vars, context) => {
      if (context?.prevToday !== undefined) {
        queryClient.setQueryData(queryKeys.todayHabit, context.prevToday);
      }
      if (context?.prevHabits !== undefined) {
        queryClient.setQueryData(queryKeys.habits, context.prevHabits);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.todayHabit });
      queryClient.invalidateQueries({ queryKey: queryKeys.habits });
      queryClient.invalidateQueries({ queryKey: queryKeys.streak });
    },
  });
}
