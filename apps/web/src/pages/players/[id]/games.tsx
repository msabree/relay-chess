import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useInfiniteQuery } from 'react-query';
import NavigationBar from '@/components/NavigationBar';
import Footer from '@/components/Footer';
import GameCard from '@/components/profile/GameCard';
import { getProfile } from '@/apis/players';

const PAGE = 24;
type Filter = 'all' | 'win' | 'loss';

/** Every game on a profile (the newest 100), as boards. */
export default function PlayerGames() {
  const router = useRouter();
  const id = typeof router.query.id === 'string' ? router.query.id : '';
  const [filter, setFilter] = useState<Filter>('all');
  const q = useInfiniteQuery(['profile-games', id], ({ pageParam = 0 }) => getProfile(id, pageParam, PAGE), {
    enabled: !!id,
    retry: false,
    getNextPageParam: (last, pages) => {
      const loaded = pages.length * PAGE;
      return loaded < Math.min(last.record.games, 100) ? loaded : undefined;
    },
  });

  const first = q.data?.pages[0];
  const games = (q.data?.pages ?? []).flatMap((p) => p.games).filter((g) => filter === 'all' || g.outcome === filter);
  const tabs: [Filter, string][] = first
    ? [
        ['all', `All ${first.record.games}${first.record.capped ? '+' : ''}`],
        ['win', `Wins ${first.record.wins}`],
        ['loss', `Losses ${first.record.losses}`],
      ]
    : [];

  return (
    <>
      <Head>
        <title>{first ? `${first.player.username}'s games · Relay Chess` : 'Games · Relay Chess'}</title>
        <meta name="robots" content="noindex" />
      </Head>
      <NavigationBar />
      <main className="mx-auto max-w-6xl px-4 pb-20 pt-9">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            {first && (
              <Link href={`/players/${id}`} className="text-sm font-medium text-accent-ink underline-offset-4 hover:underline">
                {first.player.username}
              </Link>
            )}
            <h1 className="mt-1 text-3xl font-semibold tracking-tight">All games</h1>
          </div>
          {tabs.length > 0 && (
            <div role="tablist" aria-label="Filter games" className="flex gap-1 rounded-lg bg-raised p-1">
              {tabs.map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  aria-selected={filter === key}
                  onClick={() => setFilter(key)}
                  className={`h-9 rounded-md px-4 text-sm font-medium ${filter === key ? 'bg-surface shadow-sm' : 'text-fg-muted hover:text-fg'}`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>

        {q.isLoading ? (
          <p className="py-20 text-center text-fg-muted">Loading…</p>
        ) : games.length === 0 ? (
          <p className="py-20 text-center text-fg-muted">No games here yet.</p>
        ) : (
          <div className="mt-6 grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-3.5">
            {games.map((g) => (
              <GameCard key={g.roomId} game={g} />
            ))}
          </div>
        )}

        {q.hasNextPage && (
          <div className="mt-8 text-center">
            <button
              type="button"
              disabled={q.isFetchingNextPage}
              onClick={() => q.fetchNextPage()}
              className="h-11 rounded-lg border border-line px-5 text-sm font-medium hover:bg-fg/5 disabled:opacity-50"
            >
              {q.isFetchingNextPage ? 'Loading' : 'Load more'}
            </button>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
