import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useLeaderboard, useUserPosition } from '@/hooks/useLeaderboard';
import { useUser } from '@/hooks/useUser';

type Period = 'daily' | 'weekly';
const PAGE_SIZE = 25;

const resetsIn = (iso?: string) => {
  if (!iso) return '';
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return 'resets any moment';
  const h = Math.floor(ms / 3_600_000);
  if (h >= 48) return `resets in ${Math.round(h / 24)} days`;
  if (h >= 1) return `resets in ${h}h`;
  return `resets in ${Math.max(1, Math.round(ms / 60_000))}m`;
};

/** Today and this week, just for fun. Resets on its own. */
const Leaderboard = (_props: { showHeader?: boolean; showPagination?: boolean }) => {
  const router = useRouter();
  const [period, setPeriod] = useState<Period>('daily');
  const [page, setPage] = useState(0);
  const me = useUser();
  const board = useLeaderboard(page, PAGE_SIZE, period);
  const mine = useUserPosition(me.data?._id, period);

  useEffect(() => {
    if (router.isReady && (router.query.period === 'weekly' || router.query.period === 'daily')) setPeriod(router.query.period);
  }, [router.isReady, router.query.period]);

  const pick = (p: Period) => {
    setPeriod(p);
    setPage(0);
    router.replace({ query: { ...router.query, period: p } }, undefined, { shallow: true });
  };

  const rows = board.data?.rows ?? [];
  const total = board.data?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <main className="mx-auto max-w-3xl px-4 pb-20 pt-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Leaderboard</h1>
          <p className="mt-2 text-fg-muted">
            Just for fun. Every finished game counts, and the board wipes itself clean{' '}
            {period === 'daily' ? 'every day' : 'every Monday'} (UTC).
          </p>
        </div>
        <div role="tablist" aria-label="Period" className="flex shrink-0 gap-1 rounded-lg bg-raised p-1">
          {(['daily', 'weekly'] as Period[]).map((p) => (
            <button
              key={p}
              role="tab"
              type="button"
              aria-selected={period === p}
              onClick={() => pick(p)}
              className={`h-9 rounded-md px-4 text-sm font-medium ${period === p ? 'bg-surface shadow-sm' : 'text-fg-muted hover:text-fg'}`}
            >
              {p === 'daily' ? 'Today' : 'This week'}
            </button>
          ))}
        </div>
      </div>

      {mine.data && (
        <p className="mt-6 rounded-xl border border-accent bg-accent/10 px-4 py-3 text-sm">
          You&apos;re <strong>#{mine.data.rank}</strong> {period === 'daily' ? 'today' : 'this week'} with {mine.data.user.wins}{' '}
          {mine.data.user.wins === 1 ? 'win' : 'wins'}.
        </p>
      )}

      <div className="mt-6 overflow-hidden rounded-xl border border-line bg-surface">
        <div className="flex items-center justify-between border-b border-line px-4 py-3 text-xs text-fg-subtle">
          <span>
            {total} {total === 1 ? 'player' : 'players'}
          </span>
          <span>{resetsIn(board.data?.resetsAt)}</span>
        </div>
        {board.isLoading ? (
          <p className="px-4 py-10 text-center text-sm text-fg-muted">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="px-4 py-12 text-center text-fg-muted">
            Nobody on the board yet {period === 'daily' ? 'today' : 'this week'}. Finish a game and you&apos;re on it.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-fg-subtle">
                <th scope="col" className="w-14 px-4 py-2 font-medium">#</th>
                <th scope="col" className="px-2 py-2 font-medium">Player</th>
                <th scope="col" className="w-14 px-2 py-2 text-right font-medium">W</th>
                <th scope="col" className="w-14 px-2 py-2 text-right font-medium">L</th>
                <th scope="col" className="w-14 px-4 py-2 text-right font-medium">D</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const isMe = r.userId === me.data?._id;
                return (
                  <tr key={r.userId} className={`border-t border-line ${isMe ? 'bg-accent/10' : ''}`}>
                    <td className="px-4 py-3 font-mono text-fg-muted">{r._rank}</td>
                    <td className="px-2 py-3 font-medium">
                      {r.username}
                      {isMe && <span className="ml-2 rounded bg-accent px-1.5 text-[10px] font-semibold uppercase text-accent-fg">you</span>}
                    </td>
                    <td className="px-2 py-3 text-right font-mono font-semibold">{r.wins}</td>
                    <td className="px-2 py-3 text-right font-mono text-fg-muted">{r.losses}</td>
                    <td className="px-4 py-3 text-right font-mono text-fg-muted">{r.draws}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {pages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm">
          <button type="button" disabled={page === 0} onClick={() => setPage((p) => p - 1)} className="h-9 rounded-lg border border-line px-3 disabled:opacity-40">
            Previous
          </button>
          <span className="text-fg-muted">
            Page {page + 1} of {pages}
          </span>
          <button type="button" disabled={page + 1 >= pages} onClick={() => setPage((p) => p + 1)} className="h-9 rounded-lg border border-line px-3 disabled:opacity-40">
            Next
          </button>
        </div>
      )}
    </main>
  );
};

export default Leaderboard;
