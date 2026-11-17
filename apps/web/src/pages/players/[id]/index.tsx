import { useContext } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useQuery } from 'react-query';
import { isAxiosError } from 'axios';
import NavigationBar from '@/components/NavigationBar';
import Footer from '@/components/Footer';
import VerifiedMark from '@/components/VerifiedMark';
import GameCard from '@/components/profile/GameCard';
import Socials from '@/components/profile/Socials';
import { AppContext } from '@/contexts/App';
import { getProfile } from '@/apis/players';
import { useUser } from '@/hooks/useUser';

const initials = (name: string) =>
  name
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

export default function PlayerPage() {
  const router = useRouter();
  const id = typeof router.query.id === 'string' ? router.query.id : '';
  const me = useUser();
  const { setRightDrawerOpen } = useContext(AppContext);
  const profile = useQuery(['profile', id], () => getProfile(id), { enabled: !!id, retry: false });

  const isMe = !!id && me.data?._id === id;
  const signedIn = !!me.data?.verified;
  const p = profile.data;
  const notFound = profile.isError && isAxiosError(profile.error) && profile.error.response?.status === 404;
  const total = p ? `${p.record.games}${p.record.capped ? '+' : ''}` : '';

  return (
    <>
      <Head>
        <title>{p ? `${p.player.username} · Relay Chess` : 'Player · Relay Chess'}</title>
        <meta name="robots" content="noindex" />
      </Head>
      <NavigationBar />
      <main className="mx-auto max-w-6xl px-4 pb-20 pt-9">
        {profile.isLoading || !id ? (
          <p className="py-20 text-center text-fg-muted">Loading…</p>
        ) : notFound && isMe ? (
          <div className="py-16 text-center">
            <h1 className="text-2xl font-semibold">{me.data?.username}</h1>
            <p className="mt-2 text-fg-muted">Finish a game and it shows up here.</p>
            <Link href="/" className="mt-6 inline-flex h-11 items-center rounded-lg bg-accent px-5 text-sm font-semibold text-accent-fg">
              Play
            </Link>
          </div>
        ) : !p ? (
          <p className="py-20 text-center text-fg-muted">{notFound ? "We couldn't find that player." : "Couldn't load this profile."}</p>
        ) : (
          <div className="flex flex-col gap-10">
            <section className="flex flex-wrap items-center gap-4">
              <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-accent text-xl font-bold text-accent-fg">
                {initials(p.player.username)}
              </span>
              <div className="min-w-0 flex-1">
                <h1 className="flex items-center gap-2 text-3xl font-semibold tracking-tight">
                  <span className="truncate">{p.player.username}</span>
                  {p.player.verified && <VerifiedMark size={18} />}
                </h1>
                <p className="mt-1 text-sm text-fg-muted">
                  {total} {p.record.games === 1 ? 'game' : 'games'} · {p.record.wins} {p.record.wins === 1 ? 'win' : 'wins'} · {p.record.losses}{' '}
                  {p.record.losses === 1 ? 'loss' : 'losses'}
                </p>
              </div>
              <Socials player={p.player} />
              {isMe && (
                <button
                  type="button"
                  aria-label="Settings"
                  onClick={() => setRightDrawerOpen(true)}
                  className="flex h-11 w-11 items-center justify-center rounded-lg border border-line hover:bg-fg/5"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="12" cy="12" r="3" />
                    <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
                  </svg>
                </button>
              )}
            </section>

            {isMe && !signedIn && (
              <div className="-mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-surface p-4">
                <p className="text-sm text-fg-muted">Your games only live in this browser. Sign in to keep your name and games everywhere.</p>
                <button
                  type="button"
                  onClick={() => setRightDrawerOpen(true)}
                  className="h-10 shrink-0 rounded-lg bg-accent px-4 text-sm font-semibold text-accent-fg hover:bg-accent/90"
                >
                  Sign in
                </button>
              </div>
            )}

            <section aria-labelledby="recent-games" className="flex flex-col gap-3.5">
              <div className="flex items-baseline justify-between">
                <h2 id="recent-games" className="text-lg font-semibold">
                  Recent games
                </h2>
                {p.record.games > p.games.length && (
                  <Link href={`/players/${id}/games`} className="text-sm font-semibold text-accent-ink underline-offset-4 hover:underline">
                    View all {total}
                  </Link>
                )}
              </div>
              {p.games.length === 0 ? (
                <p className="text-sm text-fg-muted">No finished games yet.</p>
              ) : (
                <div className="-mx-4 flex snap-x gap-3.5 overflow-x-auto px-4 pb-2">
                  {p.games.map((g) => (
                    <GameCard key={g.roomId} game={g} className="w-[212px] shrink-0 snap-start" />
                  ))}
                </div>
              )}
            </section>

            <section aria-labelledby="partners" className="flex flex-col gap-3.5">
              <h2 id="partners" className="text-lg font-semibold">
                Partners
              </h2>
              {p.partners.length === 0 ? (
                <p className="text-sm text-fg-muted">Teammates show up here after a 2v2.</p>
              ) : (
                <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {p.partners.map((t) => (
                    <li key={t.id}>
                      <Link href={`/players/${t.id}`} className="flex items-center gap-3 rounded-xl border border-line bg-surface p-3 hover:bg-fg/5">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-raised text-xs font-bold">{initials(t.name)}</span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-1.5 truncate text-sm font-semibold">
                            {t.name}
                            {t.verified && <VerifiedMark size={12} />}
                          </span>
                          <span className="text-xs text-fg-muted">
                            {t.games} {t.games === 1 ? 'game' : 'games'} together · {t.wins} {t.wins === 1 ? 'win' : 'wins'}
                          </span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
