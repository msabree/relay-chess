// Same as apps/web/src/lib/result.ts.
type Winner = 'w' | 'b' | null | undefined;

const side = (c: 'w' | 'b') => (c === 'w' ? 'White' : 'Black');

/** Human result for a finished game. Shared by the game screen and share previews. */
export function describeResult(winner: Winner, reason: string): { title: string; detail: string } {
  const w = winner ? side(winner) : '';
  const l = winner ? side(winner === 'w' ? 'b' : 'w') : '';
  switch (reason) {
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
    default:
      return winner ? { title: `${w} wins`, detail: '' } : { title: 'Draw', detail: '' };
  }
}

/** Short phrase for share text, e.g. "by checkmate". */
const HOW: Record<string, string> = {
  checkmate: 'by checkmate',
  timeout: 'on time',
  resign: 'by resignation',
  abandoned: 'by forfeit',
};

/**
 * One line to share. Written from the player's side when we know it.
 * `moves` is plies; we report full moves like chess players do.
 */
export function shareText(opts: { winner: Winner; reason: string; plies: number; me?: 'w' | 'b' | null }): string {
  const moves = Math.max(1, Math.ceil(opts.plies / 2));
  const how = HOW[opts.reason] ?? '';
  const tail = `in ${moves} moves on Relay Chess, 2v2 chess with friends ♟️`;
  if (!opts.winner) return `Draw ${tail}`;
  if (opts.me) return `${opts.me === opts.winner ? 'We won' : 'We lost'} ${how} ${tail}`.replace(/\s+/g, ' ');
  return `${side(opts.winner)} won ${how} ${tail}`.replace(/\s+/g, ' ');
}
