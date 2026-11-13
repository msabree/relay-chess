import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Chessboard } from 'react-chessboard';
import { ErrorBoundary } from 'react-error-boundary';
import NavigationBar from '@/components/NavigationBar';
import ShareResult from '@/components/game/ShareResult';
import { Awards, EvalBar, EvalGraph, GLYPH, MoveNote, MoveTable, PlayerBar } from '@/components/review/parts';
import { useGame } from '@/hooks/useGame';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useUser } from '@/hooks/useUser';
import { saveAnalysis } from '@/apis/games';
import { analyzeGame, buildReview, hasAnalysis, START_FEN, type AnalyzedMove, type GameRecord } from '@/lib/analysis';
import { describeResult } from '@/lib/result';
import { useBoardColor } from '@/lib/settings';

const tint = (square: string) => ((square.charCodeAt(0) - 97 + Number(square[1])) % 2 === 0 ? '#EFE2A6' : '#C9B35E');

function Fallback() {
  return (
    <div className="mx-auto max-w-md px-4 py-24 text-center">
      <h1 className="text-2xl font-semibold">Something went wrong</h1>
      <p className="mt-3 text-fg-muted">Reloading usually fixes it.</p>
      <button type="button" onClick={() => window.location.reload()} className="mt-6 h-11 rounded-lg bg-accent px-5 font-semibold text-accent-fg">
        Reload
      </button>
    </div>
  );
}

/** `?embed=1`: inside the mobile app's WebView. The app brings its own header and share button. */
const useEmbed = () => useSearchParams()?.get('embed') === '1';

/** Game review: replay the game, see who carried and who blundered. */
export default function GameReview() {
  const embed = useEmbed();
  return (
    <>
      {!embed && <NavigationBar compact />}
      <ErrorBoundary fallback={<Fallback />} onError={(e) => console.error('review page crashed', e)}>
        <Review />
      </ErrorBoundary>
    </>
  );
}

function Review() {
  const roomId = usePathname()?.split('analysis/')[1] ?? '';
  const { data, isLoading } = useGame(roomId);
  const game = data as unknown as GameRecord | undefined;
  const me = useUser().data?._id;
  const desktop = useMediaQuery('(min-width: 1024px)');
  const scheme = useBoardColor();
  const embed = useEmbed();

  // Analysis: use the saved one, or run Stockfish here and save it for everyone else.
  const [fresh, setFresh] = useState<AnalyzedMove[] | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const analysis = fresh ?? (game && hasAnalysis(game) ? game.analysis! : null);

  useEffect(() => {
    if (!game || hasAnalysis(game) || game.gameHistory.length === 0) return;
    const ctrl = new AbortController();
    setProgress(0);
    analyzeGame(game.gameHistory, { signal: ctrl.signal, onProgress: setProgress })
      .then((a) => {
        setFresh(a);
        saveAnalysis(game.roomId, a as never).catch(() => {});
      })
      .catch(() => {})
      .finally(() => !ctrl.signal.aborted && setProgress(null));
    return () => ctrl.abort();
  }, [game]);

  const review = useMemo(() => (game && analysis ? buildReview({ ...game, analysis }) : null), [game, analysis]);
  const names = useMemo(() => {
    const m = new Map<string, string>();
    for (const p of [...(game?.whiteTeam ?? []), ...(game?.blackTeam ?? [])]) m.set(p.id, p.name);
    for (const h of game?.gameHistory ?? []) if (!m.has(h.userId)) m.set(h.userId, h.username ?? 'Player');
    return m;
  }, [game]);

  // -1 is the starting position; open on the final position.
  const total = game?.gameHistory.length ?? 0;
  const [picked, setPicked] = useState<number | null>(null);
  const index = picked ?? total - 1; // null = final position, without animating the whole game in
  const go = useCallback((i: number) => setPicked(Math.max(-1, Math.min(total - 1, i))), [total]);

  // Viewer's side if they played, otherwise White.
  const mySide = me && game?.blackTeamUserIds.includes(me) ? 'black' : 'white';
  const [flip, setFlip] = useState(false);
  const orientation = (mySide === 'white') !== flip ? 'white' : 'black';

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const step: Record<string, number> = { ArrowLeft: index - 1, ArrowRight: index + 1, Home: -1, End: total - 1 };
      if (e.key in step) {
        e.preventDefault();
        go(step[e.key]!);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [index, total, go]);

  if (isLoading) return <p className="py-24 text-center text-fg-muted">Loading game…</p>;
  if (!game || total === 0) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <h1 className="text-2xl font-semibold">Game not found</h1>
        <p className="mt-3 text-fg-muted">The link might be off, or no moves were played.</p>
        <Link href="/" className="mt-6 inline-flex h-11 items-center rounded-lg bg-accent px-5 font-semibold text-accent-fg">
          Play a game
        </Link>
      </div>
    );
  }

  const winner = game.winningColor === 'white' ? 'w' : game.winningColor === 'black' ? 'b' : null;
  const result = describeResult(winner, game.reason ?? game.result ?? '');
  const record = game.gameHistory[index];
  const move = review?.moves[index];
  const fen = record?.fen ?? START_FEN;
  const white = move?.white ?? 54.86;
  const bottom = orientation === 'white' ? 'w' : 'b';
  const top = bottom === 'w' ? 'b' : 'w';
  const players = review?.players ?? [
    ...(game.whiteTeam ?? []).map((p) => ({ ...p, color: 'w' as const, moves: 0, accuracy: 0, blunders: 0 })),
    ...(game.blackTeam ?? []).map((p) => ({ ...p, color: 'b' as const, moves: 0, accuracy: 0, blunders: 0 })),
  ];

  const squares: Record<string, React.CSSProperties> = {};
  if (record?.lanMove) {
    squares[record.lanMove.slice(0, 2)] = { backgroundColor: tint(record.lanMove.slice(0, 2)) };
    squares[record.lanMove.slice(2, 4)] = { backgroundColor: tint(record.lanMove.slice(2, 4)) };
  }
  const glyph = move && GLYPH[move.feedback];
  const to = record?.lanMove?.slice(2, 4);

  const board = (
    <div className="flex gap-2">
      <EvalBar white={white} flipped={orientation === 'black'} />
      <div className="min-w-0 flex-1">
        <Chessboard
          options={{
            id: 'review-board',
            position: fen,
            boardOrientation: orientation,
            allowDragging: false,
            allowDrawingArrows: false,
            animationDurationInMs: 120,
            darkSquareStyle: { backgroundColor: scheme.dark },
            lightSquareStyle: { backgroundColor: scheme.light },
            boardStyle: { borderRadius: 6, overflow: 'hidden' },
            arrows: move?.better ? [{ startSquare: move.betterFrom, endSquare: move.betterTo, color: 'rgba(22, 163, 74, 0.85)' }] : [],
            // With a custom renderer the library ignores squareStyles, so highlights go here.
            squareRenderer: ({ square, children }) => (
              <div style={{ position: 'relative', width: '100%', height: '100%', ...squares[square] }}>
                {children}
                {glyph && square === to && (
                  <span
                    className={`absolute -right-1 -top-1 z-10 flex h-5 min-w-5 items-center justify-center rounded-full px-1 font-mono text-[11px] font-bold text-white shadow ${
                      move.feedback === 'blunder' ? 'bg-danger' : move.feedback === 'mistake' ? 'bg-orange-500' : 'bg-accent-ink'
                    }`}
                  >
                    {glyph.mark}
                  </span>
                )}
              </div>
            ),
          }}
        />
      </div>
    </div>
  );

  const btn = 'flex h-10 flex-1 items-center justify-center rounded-lg border border-line text-sm font-medium hover:bg-fg/5 disabled:opacity-40';
  const controls = (
    <div className="flex gap-2">
      <button type="button" className={btn} onClick={() => go(-1)} disabled={index === -1} aria-label="Start">
        ⏮
      </button>
      <button type="button" className={btn} onClick={() => go(index - 1)} disabled={index === -1} aria-label="Previous move">
        ◀
      </button>
      <button type="button" className={btn} onClick={() => go(index + 1)} disabled={index === total - 1} aria-label="Next move">
        ▶
      </button>
      <button type="button" className={btn} onClick={() => go(total - 1)} disabled={index === total - 1} aria-label="Final position">
        ⏭
      </button>
      <button type="button" className={btn} onClick={() => setFlip((f) => !f)} aria-label="Flip board">
        ⇅
      </button>
    </div>
  );

  const status =
    progress !== null ? (
      <div className="space-y-1.5">
        <p className="text-sm text-fg-muted">Checking every move with Stockfish… {Math.round(progress * 100)}%</p>
        <div className="h-1.5 overflow-hidden rounded-full bg-raised">
          <div className="h-full bg-accent transition-[width] duration-300" style={{ width: `${progress * 100}%` }} />
        </div>
      </div>
    ) : (
      <MoveNote move={move} name={move ? (names.get(move.playerId) ?? 'Player') : ''} />
    );

  const header = (
    <div>
      <h1 className="text-xl font-semibold tracking-tight">
        {result.title} <span className="font-normal text-fg-muted">{result.detail}</span>
      </h1>
      <p className="text-sm text-fg-subtle">{Math.ceil(total / 2)} moves</p>
    </div>
  );

  const share = embed ? null : (
    <ShareResult winner={winner} reason={game.reason ?? ''} plies={total} roomId={game.roomId} me={mySide === 'black' ? 'b' : me && game.whiteTeamUserIds.includes(me) ? 'w' : null} />
  );

  if (desktop) {
    return (
      <div className="mx-auto flex max-w-[1400px] justify-center gap-6 px-6 py-5">
        <section aria-label="Board" className="flex flex-col gap-2" style={{ width: 'min(100%, calc(100dvh - 56px - 40px - 220px))', minWidth: 420 }}>
          <PlayerBar color={top} players={players} activeId={move?.color === top ? move.playerId : undefined} won={winner === top} />
          {board}
          <PlayerBar color={bottom} players={players} activeId={move?.color === bottom ? move.playerId : undefined} won={winner === bottom} />
          {review && <EvalGraph moves={review.moves} index={index} onPick={go} />}
        </section>
        <aside
          aria-label="Review"
          className="flex w-[380px] shrink-0 flex-col overflow-hidden rounded-xl border border-line bg-surface"
          style={{ height: 'calc(100dvh - 56px - 40px)', maxHeight: 900 }}
        >
          <div className="space-y-3 border-b border-line p-4">
            {header}
            {review && <Awards review={review} onPick={go} />}
          </div>
          <div data-scroll className="relative min-h-0 flex-1 overflow-y-auto">
            <MoveTable moves={review?.moves ?? fallbackMoves(game)} names={names} index={index} onPick={go} />
          </div>
          <div className="space-y-3 border-t border-line p-4">
            <div className="min-h-[40px]">{status}</div>
            {controls}
            {share}
          </div>
        </aside>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-[640px] flex-col gap-2 px-3 pb-8 pt-3">
      {header}
      <PlayerBar color={top} players={players} activeId={move?.color === top ? move.playerId : undefined} won={winner === top} />
      {board}
      <PlayerBar color={bottom} players={players} activeId={move?.color === bottom ? move.playerId : undefined} won={winner === bottom} />
      <div className="min-h-[40px] py-1">{status}</div>
      {controls}
      {review && <EvalGraph moves={review.moves} index={index} onPick={go} />}
      {review && <Awards review={review} onPick={go} />}
      <div data-scroll className="relative max-h-[320px] overflow-y-auto rounded-xl border border-line bg-surface">
        <MoveTable moves={review?.moves ?? fallbackMoves(game)} names={names} index={index} onPick={go} />
      </div>
      {share}
    </div>
  );
}

/** Moves without analysis yet, so the list works while Stockfish runs. */
function fallbackMoves(game: GameRecord) {
  return game.gameHistory.map((m, i) => ({
    index: i,
    san: m.sanMove ?? m.move ?? '',
    color: (i % 2 === 0 ? 'w' : 'b') as 'w' | 'b',
    playerId: m.userId,
    white: 50,
    accuracy: 100,
    feedback: 'good' as const,
    drop: 0,
    better: '',
    betterFrom: '',
    betterTo: '',
  }));
}
