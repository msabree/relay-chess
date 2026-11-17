import { useContext } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useQuery } from 'react-query';
import { isAxiosError } from 'axios';
import NavigationBar from '@/components/NavigationBar';
import Footer from '@/components/Footer';
import VerifiedMark from '@/components/VerifiedMark';
import { initials } from '@/components/game/util';
import RecentGames from '@/components/profile/RecentGames';
import Partners from '@/components/profile/Partners';
import Socials from '@/components/profile/Socials';
import { AppContext } from '@/contexts/App';
import { getProfile } from '@/apis/players';
import { useUser } from '@/hooks/useUser';

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

            <RecentGames profile={p} />
            <Partners profile={p} />
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
