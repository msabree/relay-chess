import { useQuery } from 'react-query';
import { getStats } from '@/apis/games';

/** Total games played, or undefined until it loads (or if the server is unreachable). */
const useGamesPlayed = () => {
  const { data } = useQuery(['stats'], () => getStats().then((r) => r.data.gamesPlayed), { staleTime: 60_000, retry: false });
  return data;
};

export default useGamesPlayed;
