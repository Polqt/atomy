import { useMutation, useQueryClient } from '@tanstack/react-query';
import { markHabit, type TodayHabit } from '../services/habits';
import { queryKeys } from './queryKeys';

export function useMarkHabit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, completed }: { id: string; completed: boolean }) =>
      markHabit(id, completed),

    onMutate: async ({ id, completed }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.todayHabits });
      await queryClient.cancelQueries({ queryKey: queryKeys.history });

      const prevToday = queryClient.getQueryData<TodayHabit[]>(queryKeys.todayHabits);

      queryClient.setQueryData<TodayHabit[]>(
        queryKeys.todayHabits,
        (old) => old?.map((h) => (h.id === id ? { ...h, completed } : h)),
      );

      return { prevToday };
    },

    onError: (_err, _vars, context) => {
      if (context?.prevToday !== undefined) {
        queryClient.setQueryData(queryKeys.todayHabits, context.prevToday);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.todayHabits });
      queryClient.invalidateQueries({ queryKey: queryKeys.history });
      queryClient.invalidateQueries({ queryKey: queryKeys.streak });
    },
  });
}
