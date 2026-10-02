import { useContext } from 'react';
import { nextMover, type Color } from '@relay-chess/game';
import { ChessGameContext } from '@/contexts/ChessGame';
import { colorName, formatClock, initials, relayOrder, sideToMove } from './util';

/**
 * One side of the board: relay order as chips, a status line, and the clock.
 * Yellow always means "you".
 */
const TeamBar = ({ color, compact = false }: { color: Color; compact?: boolean }) => {
  const { game, userId, clocks } = useContext(ChessGameContext);
  if (!game) return <div className={compact ? 'h-[60px]' : 'h-[68px]'} />;

  const over = game.status === 'over';
  const turn = sideToMove(game);
  const onMove = !over && turn === color && game.teams.w.length > 0 && game.teams.b.length > 0;
  const order = relayOrder(game, color);
  const next = nextMover(game, color);
  const mine = game.teams[color].some((p) => p.id === userId);
  const myMove = onMove && next?.id === userId;

  let status = '';
  if (game.teams[color].length === 0) status = 'Waiting for a player';
  else if (over) status = game.result?.winner === color ? 'Won' : game.result?.winner ? 'Lost' : '';
  else if (myMove) status = order.length > 1 ? `Your move. ${order[1]!.name} plays after you.` : 'Your move.';
  else if (onMove) status = mine && order[1]?.id === userId ? `${next?.name} is moving. You're next.` : `${next?.name} is moving.`;
  else if (game.status === 'waiting') status = color === 'w' ? `${next?.name} makes the first move.` : `${next?.name} plays Black's first move.`;
  else status = mine && next?.id === userId ? `You play ${colorName(color)}'s next move.` : `${next?.name} plays next.`;

  const clock = clocks ? formatClock(clocks[color]) : null;
  const low = clocks ? clocks[color] < 20_000 && onMove : false;

  return (
    <div
      className={`flex items-center gap-3 rounded-xl border bg-surface pl-3 pr-2 ${compact ? 'h-[60px]' : 'h-[68px]'} ${
        myMove ? 'border-accent' : 'border-line'
      }`}
    >
      <span
        aria-hidden="true"
        className={`h-3.5 w-3.5 shrink-0 rounded-[3px] ${color === 'w' ? 'bg-white ring-1 ring-ink-300' : 'bg-ink-950 ring-1 ring-ink-500'}`}
      />
      <span className="sr-only">{colorName(color)} team</span>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <ol className="flex min-w-0 items-center gap-1 overflow-hidden" aria-label={`${colorName(color)} relay order`}>
          {order.map((p, i) => {
            const isMe = p.id === userId;
            const moving = i === 0 && onMove;
            const tag = i === 0 && !over ? (moving ? 'moving' : 'next') : '';
            const tone =
              moving && isMe ? 'bg-accent text-accent-fg' : moving ? 'bg-fg text-bg' : isMe ? 'bg-accent/20 text-fg ring-1 ring-accent/60' : 'bg-raised text-fg';
            return (
              <li key={p.id} className="flex min-w-0 items-center gap-1">
                {i > 0 && (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="shrink-0 text-fg-subtle" aria-hidden="true">
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                )}
                <span className={`inline-flex h-7 min-w-0 items-center gap-1.5 rounded-full pl-1 ${compact && i > 0 ? 'pr-1' : 'pr-2.5'} text-[13px] font-medium ${tone} ${p.connected ? '' : 'opacity-50'}`}>
                  <span className="flex h-5 min-w-5 px-0.5 shrink-0 items-center justify-center rounded-full bg-black/10 text-[11px] font-semibold dark:bg-white/10">
                    {initials(p.name)}
                  </span>
                  <span className={compact && i > 0 ? 'sr-only' : 'truncate'}>{isMe ? 'You' : p.name}</span>
                  {tag && <span className="hidden text-[10px] uppercase tracking-wider opacity-70 sm:inline">{tag}</span>}
                  {!p.connected && <span className="text-[10px] uppercase tracking-wider opacity-70">away</span>}
                </span>
              </li>
            );
          })}
        </ol>
        {status && (
          <p className={`truncate text-[13px] ${myMove ? 'font-semibold text-accent-ink' : 'text-fg-muted'}`} aria-live="polite">
            {status}
          </p>
        )}
      </div>
      <div
        className={`flex h-[52px] min-w-[96px] items-center justify-center rounded-lg px-3 font-mono text-[26px] font-semibold tabular-nums ${
          compact ? 'h-10 min-w-[76px] text-xl' : ''
        } ${
          low ? 'bg-danger text-white' : onMove ? (myMove ? 'bg-accent text-accent-fg' : 'bg-fg text-bg') : 'bg-raised text-fg-muted'
        }`}
        aria-label={clock ? `${colorName(color)} clock ${clock}` : 'No clock'}
      >
        {clock ?? <span className="text-base font-medium">No clock</span>}
      </div>
    </div>
  );
};

export default TeamBar;
