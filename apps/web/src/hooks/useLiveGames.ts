import type { LiveGame } from '@relay-chess/game';
import type { LiveGameInfo } from '@/types';
import { fromServerTimer } from '@/lib/socket';
import { useLobby } from './useLobby';
import { useAllLiveGames } from './useAllLiveGames';

/** Public games in progress (at least one move each side), in the shape the UI uses. */
const toInfo = (games: LiveGame[]): LiveGameInfo[] =>
  games
    .filter((g) => g.moveCount >= 2)
    .map((g) => ({
      roomId: g.roomId,
      whiteTeam: { usernames: g.white, userIds: [] },
      blackTeam: { usernames: g.black, userIds: [] },
      moveCount: g.moveCount,
      currentFen: g.fen,
      timeControl: fromServerTimer(g.timeControl),
      timer: { white: Math.round((g.clocks?.w ?? 0) / 1000), black: Math.round((g.clocks?.b ?? 0) / 1000) },
      isPrivate: false,
      spectatorCount: g.spectators,
      startedAt: new Date(g.createdAt).toISOString(),
      lastMoveAt: new Date(g.createdAt).toISOString(),
      currentTurn: g.turn,
    }));

/** Every live game (the live games page). */
const useLiveGames = () => {
  const { games, connected } = useAllLiveGames();
  return { liveGames: toInfo(games), isConnected: connected };
};

/** The top few live games (the home page strip). */
export const useTopLiveGames = () => {
  const { games, connected } = useLobby();
  return { liveGames: toInfo(games), isConnected: connected };
};

export default useLiveGames;
