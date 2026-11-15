import type { LiveGame } from '@relay-chess/game';
import { useAllLiveGames } from './useAllLiveGames';
import { useLobby } from './useLobby';

/** Only games that are under way (both sides have moved). */
const started = (games: LiveGame[]) => games.filter((g) => g.moveCount >= 2);

/** Every live game (Watch screen). */
export const useLiveGames = () => {
  const { games, connected } = useAllLiveGames();
  return { liveGames: started(games), connected };
};

/** The top few live games (home strip). */
export const useTopLiveGames = () => {
  const { games, connected } = useLobby();
  return { liveGames: started(games), connected };
};
