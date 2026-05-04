import { useQuery } from '@tanstack/react-query';
import { getTodayHabit } from '../services/habits';
import { queryKeys } from './queryKeys';

export function useTodayHabit() {
  return useQuery({
    queryKey: queryKeys.todayHabit,
    queryFn: getTodayHabit,
  });
}
