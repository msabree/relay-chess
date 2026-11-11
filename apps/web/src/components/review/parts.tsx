import { useEffect, useRef } from 'react';
import type { Feedback, Review, ReviewMove, ReviewPlayer } from '@/lib/analysis';
import { initials } from '@/components/game/util';

/** Chess annotation for a move, or nothing for good ones. */
export const GLYPH: Partial<Record<Feedback, { mark: string; label: string; tone: string }>> = {
  inaccuracy: { mark: '?!', label: 'Inaccuracy', tone: 'text-accent-ink' },
  mistake: { mark: '?', label: 'Mistake', tone: 'text-orange-500' },
  blunder: { mark: '??', label: 'Blunder', tone: 'text-danger' },
};

const Swatch = ({ color }: { color: 'w' | 'b' }) => (
  <span
    aria-hidden="true"
    className={`h-3.5 w-3.5 shrink-0 rounded-[3px] ${color === 'w' ? 'bg-white ring-1 ring-ink-300' : 'bg-ink-950 ring-1 ring-ink-500'}`}
  />
);

/** One team above or below the board: who played, and how accurately. */
export function PlayerBar({
  color,
  players,
  activeId,
  won,
}: {
  color: 'w' | 'b';
  players: ReviewPlayer[];
  activeId?: string;
  won: boolean;
}) {
  const team = players.filter((p) => p.color === color);
  return (
    <div className="flex h-[56px] items-center gap-3 rounded-xl border border-line bg-surface px-3">
      <Swatch color={color} />
      <ol className="flex min-w-0 flex-1 items-center gap-1.5 overflow-hidden">
        {team.map((p) => (
          <li
            key={p.id}
            className={`inline-flex h-8 min-w-0 items-center gap-1.5 rounded-full pl-1 pr-2.5 text-[13px] font-medium transition-colors ${
              p.id === activeId ? 'bg-fg text-bg' : 'bg-raised text-fg'
            }`}
          >
            <span className="flex h-6 min-w-6 shrink-0 items-center justify-center rounded-full bg-black/10 px-0.5 text-[11px] font-semibold dark:bg-white/10">
              {initials(p.name)}
            </span>
            <span className="truncate">{p.name}</span>
            {p.moves > 0 && <span className="font-mono text-xs opacity-70">{p.accuracy}%</span>}
          </li>
        ))}
      </ol>
      {won && <span className="rounded-md bg-accent px-2 py-1 text-xs font-semibold text-accent-fg">Won</span>}
    </div>
  );
}

/** Vertical bar: how much White is winning. Flips with the board. */
export function EvalBar({ white, flipped }: { white: number; flipped: boolean }) {
  const pct = Math.max(2, Math.min(98, white));
  return (
    <div
      className={`relative w-3 shrink-0 overflow-hidden rounded-md bg-ink-950 ring-1 ring-line ${flipped ? '' : 'rotate-180'}`}
      role="img"
      aria-label={`White ${Math.round(white)}% to win`}
    >
      <div className="absolute inset-x-0 top-0 bg-white transition-[height] duration-300" style={{ height: `${pct}%` }} />
    </div>
  );
}

/** Who's winning over the whole game. Click to jump to a move. */
export function EvalGraph({ moves, index, onPick }: { moves: ReviewMove[]; index: number; onPick: (_i: number) => void }) {
  if (moves.length < 2) return null;
  const w = 600;
  const h = 64;
  const x = (i: number) => ((i + 1) / moves.length) * w;
  const y = (white: number) => h - (white / 100) * h;
  const pts = [`0,${y(54.86)}`, ...moves.map((m, i) => `${x(i)},${y(m.white)}`)];
  const area = `M0,${h} L${pts.join(' L')} L${w},${h} Z`;
  const pick = (e: React.MouseEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const i = Math.round(((e.clientX - r.left) / r.width) * moves.length) - 1;
    onPick(Math.max(-1, Math.min(moves.length - 1, i)));
  };
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      className="h-16 w-full cursor-pointer rounded-lg bg-ink-950 ring-1 ring-line"
      onClick={pick}
      role="img"
      aria-label="Who was winning, move by move. Click to jump."
    >
      <path d={area} fill="white" opacity={0.9} />
      <line x1={0} x2={w} y1={h / 2} y2={h / 2} stroke="currentColor" className="text-fg-subtle" strokeDasharray="4 4" strokeWidth={1} vectorEffect="non-scaling-stroke" />
      {moves.map((m, i) =>
        m.feedback === 'blunder' ? <circle key={i} cx={x(i)} cy={y(m.white)} r={3.5} className="fill-danger" vectorEffect="non-scaling-stroke" /> : null,
      )}
      <line x1={x(index)} x2={x(index)} y1={0} y2={h} className="stroke-accent" strokeWidth={2} vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

/** Moves in pairs with who played them and a ?/?? mark. */
export function MoveTable({
  moves,
  names,
  index,
  onPick,
}: {
  moves: ReviewMove[];
  names: Map<string, string>;
  index: number;
  onPick: (_i: number) => void;
}) {
  const active = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    // keep the current move visible inside the list only (never scroll the page)
    const el = active.current;
    const box = el?.closest('[data-scroll]');
    if (!el || !box) return;
    const top = el.offsetTop - box.clientHeight / 2;
    box.scrollTo({ top, behavior: 'smooth' });
  }, [index]);

  const cell = (i: number) => {
    const m = moves[i];
    if (!m) return <span />;
    const g = GLYPH[m.feedback];
    return (
      <button
        ref={i === index ? active : undefined}
        type="button"
        onClick={() => onPick(i)}
        className={`flex h-8 items-center gap-1.5 rounded-md px-2 text-left text-sm ${i === index ? 'bg-accent/25 font-semibold' : 'hover:bg-fg/5'}`}
      >
        <span className="font-medium">{m.san}</span>
        {g && <span className={`font-mono text-xs font-bold ${g.tone}`}>{g.mark}</span>}
        <span className="ml-auto text-[11px] text-fg-subtle">{initials(names.get(m.playerId) ?? '?')}</span>
      </button>
    );
  };
  return (
    <ol className="relative px-2 py-1" aria-label="Moves">
      {Array.from({ length: Math.ceil(moves.length / 2) }, (_, r) => (
        <li key={r} className="grid grid-cols-[32px_1fr_1fr] items-center">
          <span className="pl-2 font-mono text-xs text-fg-subtle">{r + 1}.</span>
          {cell(r * 2)}
          {cell(r * 2 + 1)}
        </li>
      ))}
    </ol>
  );
}

/** The fun part: who carried, and the move everyone will bring up at dinner. */
export function Awards({ review, onPick }: { review: Review; onPick: (_i: number) => void }) {
  const { carry, oops } = review;
  if (!carry && !oops) return null;
  const name = (id: string) => review.players.find((p) => p.id === id)?.name ?? 'Someone';
  return (
    <div className="grid grid-cols-2 gap-2">
      {carry && (
        <div className="rounded-xl bg-accent/15 p-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-accent-ink">Carried</div>
          <div className="mt-1 truncate text-base font-semibold">{carry.name}</div>
          <div className="text-sm text-fg-muted">{carry.accuracy}% accuracy</div>
        </div>
      )}
      {oops && (
        <button type="button" onClick={() => onPick(oops.index)} className="rounded-xl bg-danger/10 p-3 text-left hover:bg-danger/15">
          <div className="text-xs font-semibold uppercase tracking-wider text-danger">Oops</div>
          <div className="mt-1 truncate text-base font-semibold">{name(oops.playerId)}</div>
          <div className="truncate text-sm text-fg-muted">
            {Math.ceil((oops.index + 1) / 2)}
            {oops.color === 'w' ? '.' : '...'} {oops.san}
            {GLYPH[oops.feedback]?.mark} <span className="underline underline-offset-2">see it</span>
          </div>
        </button>
      )}
    </div>
  );
}

/** One line about the move on the board. */
export function MoveNote({ move, name }: { move?: ReviewMove; name: string }) {
  if (!move) return <p className="text-sm text-fg-muted">Starting position. Use the arrow keys to step through.</p>;
  const g = GLYPH[move.feedback];
  const num = `${Math.ceil((move.index + 1) / 2)}${move.color === 'w' ? '.' : '...'}`;
  return (
    <p className="text-sm">
      <span className="font-semibold">
        {num} {move.san}
      </span>{' '}
      <span className="text-fg-muted">by {name}</span>
      {g ? (
        <>
          {' · '}
          <span className={`font-semibold ${g.tone}`}>{g.label}.</span>
          {move.better && (
            <>
              {' '}
              Better was <span className="font-semibold text-success">{move.better}</span>.
            </>
          )}
        </>
      ) : (
        move.feedback === 'best' && (
          <>
            {' · '}
            <span className="font-semibold text-success">Best move</span>
          </>
        )
      )}
    </p>
  );
}
