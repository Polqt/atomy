import { useQuery } from '@tanstack/react-query';
import { getHabits } from '../services/habits';
import { queryKeys } from './queryKeys';

export function useHabits() {
  return useQuery({
    queryKey: queryKeys.habits,
    queryFn: getHabits,
  });
}
