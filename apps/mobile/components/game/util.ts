import { describeResult } from '@/lib/result';
import { nextMover, turn, type Color, type GameState, type Player } from '@relay-chess/game';

export { initials } from '@/components/ui/Avatar';

export const colorName = (c: Color) => (c === 'w' ? 'White' : 'Black');

/** Team in relay order, starting with whoever plays that side's next move. */
export function relayOrder(game: GameState, c: Color): Player[] {
  const team = game.teams[c];
  const next = nextMover(game, c);
  const start = next ? team.findIndex((p) => p.id === next.id) : 0;
  return team.map((_, i) => team[(start + i) % team.length]!);
}

export function resultText(game: GameState): { title: string; detail: string } {
  const r = game.result;
  if (!r) return { title: '', detail: '' };
  return describeResult(r.winner, r.reason);
}

export const formatClock = (ms: number) => {
  const total = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
};

export const sideToMove = (game: GameState): Color => turn(game);
