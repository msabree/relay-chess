import type { GameState } from '@relay-chess/game';
import type { GameRecord } from './store/types';
import type { Outcome } from './leaderboard';

export function gameType(tc: GameState['timeControl']): GameRecord['gameType'] {
  if (!tc) return 'untimed';
  const minutes = tc.initialMs / 60_000;
  if (minutes < 8) return 'blitz';
  if (minutes < 15) return 'rapid';
  return 'classic';
}

const legacyResult = (reason: string): GameRecord['result'] => {
  if (reason === 'checkmate' || reason === 'timeout') return reason;
  if (reason === 'resign' || reason === 'abandoned') return 'resign';
  return 'draw';
};

/** Build the stored record for a finished (not aborted) game. */
export function toGameRecord(game: GameState, at: Date): GameRecord {
  const result = game.result!;
  const names = new Map([...game.teams.w, ...game.teams.b].map((p) => [p.id, p.name]));
  const team = (c: 'w' | 'b') => game.teams[c].map((p) => ({ id: p.id, name: p.name }));
  return {
    roomId: game.id,
    gameType: gameType(game.timeControl),
    result: legacyResult(result.reason),
    reason: result.reason,
    winningColor: result.winner === 'w' ? 'white' : result.winner === 'b' ? 'black' : null,
    timeControl: game.timeControl,
    whiteTeam: team('w'),
    blackTeam: team('b'),
    whiteTeamUserIds: team('w').map((p) => p.id),
    blackTeamUserIds: team('b').map((p) => p.id),
    userIds: [...team('w'), ...team('b')].map((p) => p.id),
    gameHistory: game.moves.map((m) => ({
      move: m.san,
      sanMove: m.san,
      lanMove: m.lan,
      userId: m.playerId,
      username: names.get(m.playerId) ?? '',
      fen: m.fen,
    })),
    timestamp: at,
  };
}

/** Leaderboard outcome for every seated player. */
export function outcomes(game: GameState): { userId: string; username: string; outcome: Outcome }[] {
  const w = game.result?.winner ?? null;
  return (['w', 'b'] as const).flatMap((c) =>
    game.teams[c].map((p) => ({
      userId: p.id,
      username: p.name,
      outcome: (w === null ? 'draw' : w === c ? 'win' : 'loss') as Outcome,
    })),
  );
}
