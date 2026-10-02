import { useContext, useEffect, useRef } from 'react';
import { ChessGameContext } from '@/contexts/ChessGame';
import { initials } from './util';

/** Moves in pairs. Each move carries the initial of the teammate who played it. */
const MoveList = ({ horizontal = false }: { horizontal?: boolean }) => {
  const { game, moveHistoryFen, setMoveHistoryFen, isGameOver } = useContext(ChessGameContext);
  const end = useRef<HTMLDivElement>(null);
  const moves = game?.moves ?? [];
  const names = new Map([...(game?.teams.w ?? []), ...(game?.teams.b ?? [])].map((p) => [p.id, p.name]));
  const initial = (id: string) => initials(names.get(id) ?? '?');
  const lastFen = moves.at(-1)?.fen;

  useEffect(() => {
    end.current?.scrollIntoView({ block: 'nearest', inline: 'end' });
  }, [moves.length]);

  const view = (fen: string) => setMoveHistoryFen(fen === lastFen ? '' : fen);
  const isViewing = (fen: string) => (moveHistoryFen ? moveHistoryFen === fen : fen === lastFen);

  if (moves.length === 0) {
    return <p className="px-4 py-3 text-sm text-fg-subtle">{isGameOver ? 'No moves were played.' : 'No moves yet.'}</p>;
  }

  const cell = (i: number) => {
    const m = moves[i];
    if (!m) return <span />;
    return (
      <button
        type="button"
        onClick={() => view(m.fen)}
        className={`flex h-8 items-center gap-2 rounded-md px-2 text-left text-sm ${isViewing(m.fen) ? 'bg-raised font-semibold' : 'hover:bg-fg/5'}`}
        aria-label={`${m.san} by ${names.get(m.playerId) ?? 'unknown'}`}
      >
        <span className="font-medium">{m.san}</span>
        <span className="text-[11px] text-fg-subtle">{initial(m.playerId)}</span>
      </button>
    );
  };

  if (horizontal) {
    return (
      <ol className="flex items-center gap-1 overflow-x-auto px-3 py-1 scrollbar-hide" aria-label="Moves">
        {moves.map((m, i) => (
          <li key={i} className="flex shrink-0 items-center">
            {i % 2 === 0 && <span className="mr-0.5 font-mono text-xs text-fg-subtle">{i / 2 + 1}.</span>}
            {cell(i)}
          </li>
        ))}
        <div ref={end} />
      </ol>
    );
  }

  const rows = Math.ceil(moves.length / 2);
  return (
    <ol className="px-2 py-1" aria-label="Moves">
      {Array.from({ length: rows }, (_, r) => (
        <li key={r} className="grid grid-cols-[32px_1fr_1fr] items-center">
          <span className="pl-2 font-mono text-xs text-fg-subtle">{r + 1}.</span>
          {cell(r * 2)}
          {cell(r * 2 + 1)}
        </li>
      ))}
      <div ref={end} />
    </ol>
  );
};

export default MoveList;
