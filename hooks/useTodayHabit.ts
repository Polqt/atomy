import { useQuery } from '@tanstack/react-query';
import { getTodayHabits } from '../services/habits';
import { queryKeys } from './queryKeys';

export function useTodayHabit() {
  return useQuery({
    queryKey: queryKeys.todayHabits,
    queryFn: getTodayHabits,
  });
}

export const useTodayHabits = useTodayHabit;
