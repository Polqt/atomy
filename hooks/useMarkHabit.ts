import { useMutation, useQueryClient } from '@tanstack/react-query';
import { markHabit, type TodayHabit, type HabitHistoryRow } from '../services/habits';
import { queryKeys } from './queryKeys';

export function useMarkHabit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, completed }: { id: string; completed: boolean }) =>
      markHabit(id, completed),

    onMutate: async ({ id, completed }) => {
      // Cancel any outgoing refetches to avoid overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: queryKeys.todayHabits });
      await queryClient.cancelQueries({ queryKey: queryKeys.history });

      // Snapshot previous values for rollback
      const prevToday = queryClient.getQueryData<TodayHabit[]>(queryKeys.todayHabits);
      const prevHistory = queryClient.getQueryData<HabitHistoryRow[]>(queryKeys.history);

      // Optimistically update today's habits
      queryClient.setQueryData<TodayHabit[]>(
        queryKeys.todayHabits,
        (old) => old?.map((h) => (h.id === id ? { ...h, completed } : h)),
      );

      // Optimistically update history if it exists
      if (prevHistory) {
        queryClient.setQueryData<HabitHistoryRow[]>(
          queryKeys.history,
          (old) =>
            old?.map((h) =>
              h.habit_id === id ? { ...h, completed } : h,
            ),
        );
      }

      return { prevToday, prevHistory };
    },

    onError: (_err, _vars, context) => {
      // Rollback on error
      if (context?.prevToday !== undefined) {
        queryClient.setQueryData(queryKeys.todayHabits, context.prevToday);
      }
      if (context?.prevHistory !== undefined) {
        queryClient.setQueryData(queryKeys.history, context.prevHistory);
      }
    },

    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: queryKeys.todayHabits });
      queryClient.invalidateQueries({ queryKey: queryKeys.history });
      queryClient.invalidateQueries({ queryKey: queryKeys.streak });
    },
  });
}
