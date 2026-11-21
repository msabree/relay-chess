import Link from 'next/link';
import { Chessboard } from 'react-chessboard';
import type { ProfileGame } from '@/apis/players';
import { useBoardColor } from '@/lib/settings';

const ago = (iso: string) => {
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60_000);
  if (m < 60) return `${Math.max(1, m)}m ago`;
  if (m < 60 * 24) return `${Math.round(m / 60)}h ago`;
  const d = Math.round(m / 1440);
  return d === 1 ? 'yesterday' : `${d}d ago`;
};

const CHIP = {
  win: 'bg-success/15 text-success',
  loss: 'bg-danger/15 text-danger',
  draw: 'bg-fg/10 text-fg-muted',
} as const;

/** One finished game: its final position from your side, the result and who played. */
const GameCard = ({ game, className = '' }: { game: ProfileGame; className?: string }) => {
  const scheme = useBoardColor();
  const last = game.lastMove ? [game.lastMove.slice(0, 2), game.lastMove.slice(2, 4)] : [];
  const highlight = Object.fromEntries(last.map((sq) => [sq, { backgroundColor: 'rgba(255, 200, 0, 0.45)' }]));

  return (
    <article className={`flex flex-col gap-2.5 rounded-xl border border-line bg-surface p-2.5 ${className}`}>
      <Link href={`/analysis/${game.roomId}`} aria-label={`Review this ${game.outcome}`} className="block overflow-hidden rounded-md">
        <div className="pointer-events-none">
          <Chessboard
            options={{
              id: `card-${game.roomId}`,
              position: game.fen,
              boardOrientation: game.side,
              allowDragging: false,
              allowDrawingArrows: false,
              showNotation: false,
              showAnimations: false,
              squareStyles: highlight,
              darkSquareStyle: { backgroundColor: scheme.dark },
              lightSquareStyle: { backgroundColor: scheme.light },
            }}
          />
        </div>
      </Link>
      <div className="flex items-center gap-2">
        <span className={`rounded px-1.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ${CHIP[game.outcome]}`}>{game.outcome}</span>
        <span className="text-xs text-fg-subtle">{ago(game.at)}</span>
        <Link href={`/analysis/${game.roomId}`} className="ml-auto text-sm font-semibold text-accent-ink underline-offset-4 hover:underline">
          Review
        </Link>
      </div>
      <div className="text-[13px] leading-snug">
        <p className="truncate font-medium">{game.team.length ? `with ${game.team.join(', ')}` : '1v1'}</p>
        <p className="truncate text-fg-muted">vs {game.opponents.join(', ')}</p>
      </div>
    </article>
  );
};

export default GameCard;
