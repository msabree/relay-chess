import { nextMover, turn, type Color, type GameState, type Player } from '@relay-chess/game';

export const initials = (name: string) => {
  const words = name.trim().split(/[\s_-]+/).filter(Boolean);
  if (words.length >= 2 && /^[A-Za-z]/.test(words[1]!)) return (words[0]![0]! + words[1]![0]!).toUpperCase();
  return (name[0] ?? '?').toUpperCase();
};

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
  const w = r.winner ? colorName(r.winner) : '';
  const l = r.winner ? colorName(r.winner === 'w' ? 'b' : 'w') : '';
  switch (r.reason) {
    case 'checkmate':
      return { title: `${w} wins`, detail: 'by checkmate' };
    case 'timeout':
      return { title: `${w} wins`, detail: `${l} ran out of time` };
    case 'resign':
      return { title: `${w} wins`, detail: `${l} resigned` };
    case 'abandoned':
      return { title: `${w} wins`, detail: `${l} left the game` };
    case 'agreement':
      return { title: 'Draw', detail: 'by agreement' };
    case 'stalemate':
      return { title: 'Draw', detail: 'by stalemate' };
    case 'threefold-repetition':
      return { title: 'Draw', detail: 'by repetition' };
    case 'insufficient-material':
      return { title: 'Draw', detail: 'not enough material to mate' };
    case 'fifty-move-rule':
      return { title: 'Draw', detail: 'by the 50-move rule' };
    case 'aborted':
      return { title: 'Game aborted', detail: 'no result recorded' };
  }
}

export const formatClock = (ms: number) => {
  const total = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
};

export const sideToMove = (game: GameState): Color => turn(game);
