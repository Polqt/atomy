import { useQuery } from '@tanstack/react-query';
import { getHabitHistory } from '../services/habits';
import { queryKeys } from './queryKeys';

export function useHabitHistory() {
  return useQuery({
    queryKey: queryKeys.history,
    queryFn: getHabitHistory,
  });
}
