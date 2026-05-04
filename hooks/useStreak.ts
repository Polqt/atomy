import { useQuery } from '@tanstack/react-query';
import { getStreak } from '../services/habits';
import { queryKeys } from './queryKeys';

export function useStreak() {
  return useQuery({
    queryKey: queryKeys.streak,
    queryFn: getStreak,
  });
}
