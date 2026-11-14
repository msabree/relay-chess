import { getStats } from '@/apis/stats';
import { useQuery } from '@tanstack/react-query';

/** Total games played, or undefined until it loads (or if the server is unreachable). */
export const useGamesPlayed = () =>
  useQuery({
    queryKey: ['stats'],
    queryFn: () => getStats().then((r) => r.data.gamesPlayed),
    staleTime: 60_000,
    retry: false,
  });
