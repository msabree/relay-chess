import Link from 'next/link';
import { Chessboard } from 'react-chessboard';
import useLiveGames from '@/hooks/useLiveGames';
import { BOARD_COLOR_SCHEMES } from '@/constants';
import { getTimerLabel } from '@/components/TimerSelection';
import { formatAnonUsername } from '@/utils/strings';

const team = (names: string[]) => (names.length ? names.map((n) => formatAnonUsername(n)).join(' & ') : 'Anonymous');

/** Home page: one slim row of live games. Hidden when nothing is live. */
const LiveGamesStrip = () => {
  const { liveGames } = useLiveGames();
  if (liveGames.length === 0) return null;

  return (
    <section className="mx-auto max-w-6xl px-4 pb-12" aria-labelledby="live-strip">
      <div className="mb-3 flex items-center gap-2">
        <span className="h-2 w-2 animate-pulse rounded-full bg-success" />
        <h2 id="live-strip" className="text-sm font-semibold">
          Live now
        </h2>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-1">
        {liveGames.map((g) => (
          <Link
            key={g.roomId}
            href={`/games/${g.roomId}`}
            className="flex w-72 shrink-0 items-center gap-3 rounded-xl border border-line p-2 hover:bg-fg/5 transition-colors"
          >
            <div className="pointer-events-none h-16 w-16 shrink-0">
              <Chessboard
                options={{
                  id: `strip-${g.roomId}`,
                  position: g.currentFen,
                  allowDragging: false,
                  showNotation: false,
                  animationDurationInMs: 200,
                  darkSquareStyle: { backgroundColor: BOARD_COLOR_SCHEMES[0].dark },
                  lightSquareStyle: { backgroundColor: BOARD_COLOR_SCHEMES[0].light },
                  boardStyle: { borderRadius: 4, overflow: 'hidden' },
                }}
              />
            </div>
            <div className="min-w-0 text-sm">
              <p className="truncate font-medium">{team(g.whiteTeam.usernames)}</p>
              <p className="truncate font-medium">vs {team(g.blackTeam.usernames)}</p>
              <p className="mt-0.5 text-xs text-fg-subtle">
                {g.moveCount} moves · {getTimerLabel(g.timeControl, 'No clock')}
              </p>
            </div>
          </Link>
        ))}
      </div>
      <Link
        href="/live-games"
        className="mt-3 inline-flex h-9 items-center rounded-lg border border-line px-4 text-sm font-medium hover:bg-fg/5 transition-colors"
      >
        Watch live games
      </Link>
    </section>
  );
};

export default LiveGamesStrip;
