import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteHabit } from '../services/habits';
import { queryKeys } from './queryKeys';

export function useDeleteHabit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteHabit(id),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.habits });
      queryClient.invalidateQueries({ queryKey: queryKeys.todayHabits });
      queryClient.invalidateQueries({ queryKey: queryKeys.history });
      queryClient.invalidateQueries({ queryKey: queryKeys.streak });
    },
  });
}
