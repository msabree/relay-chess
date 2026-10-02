import type { LiveGameInfo } from '@/types';
import { fromServerTimer } from '@/lib/socket';
import { useLobby } from './useLobby';

/** Public games in progress (at least one move each side). */
const useLiveGames = () => {
  const { games, connected } = useLobby();
  const liveGames: LiveGameInfo[] = games
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
  return { liveGames, isConnected: connected };
};

export default useLiveGames;
