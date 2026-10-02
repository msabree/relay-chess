import { useContext, useEffect, useMemo } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import ReactGA from 'react-ga4';
import NavigationBar from '@/components/NavigationBar';
import Footer from '@/components/Footer';
import PlayOptions from '@/components/PlayOptions';
import GameHistory from '@/components/GameHistory';
import InviteTeammates from '@/modals/InviteTeammates';
import CreatePrivateGame from '@/modals/CreatePrivateGame';
import { AppContext } from '@/contexts/App';
import { useUser } from '@/hooks/useUser';
import useOnlineStats from '@/hooks/useOnlineStats';
import { ANALYTICS_TEST_MODE, GOOGLE_ANALYTICS_ID, SITE_URL } from '@/constants';

const greeting = () => {
  const h = new Date().getHours();
  if (h < 5) return 'Up late';
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
};

export default function Home() {
  const { setModal, modal } = useContext(AppContext);
  const { data: session, status } = useSession();
  const user = useUser();
  const { totalOnline } = useOnlineStats();
  const router = useRouter();
  const hello = useMemo(greeting, []);

  useEffect(() => {
    if (!session && status === 'unauthenticated') router.replace('/');
  }, [router, session, status]);

  useEffect(() => {
    if (GOOGLE_ANALYTICS_ID) ReactGA.initialize(GOOGLE_ANALYTICS_ID, { testMode: ANALYTICS_TEST_MODE, gaOptions: { userId: user.data?._id } });
  }, [user.data?._id]);

  return (
    <>
      <Head>
        <title>Home · Relay Chess</title>
        <meta name="robots" content="noindex, nofollow" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="canonical" href={`${SITE_URL}/home`} />
      </Head>
      <NavigationBar />

      <main className="mx-auto max-w-6xl px-4 pb-20 pt-10 sm:pt-14">
        <header className="mb-10">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            {hello}, {user.data?.username ?? 'friend'}.
          </h1>
          <p className="mt-3 text-lg text-fg-muted">Pull up a chair. Who are we playing with tonight?</p>
          {totalOnline > 1 && (
            <p className="mt-4 inline-flex items-center gap-2 rounded-full border border-line px-3 py-1 text-sm text-fg-muted">
              <span className="h-2 w-2 rounded-full bg-success" />
              {totalOnline} players around right now
            </p>
          )}
        </header>

        <PlayOptions />

        <section className="mt-16">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">Your recent games</h2>
              <p className="mt-1 text-fg-muted">Every game is saved with a move-by-move review.</p>
            </div>
          </div>
          <div className="rounded-2xl border border-line bg-surface p-4 sm:p-6">
            <GameHistory />
          </div>
        </section>
      </main>

      <Footer />
      <InviteTeammates open={modal.name === 'INVITE_TEAMMATES'} onClose={() => setModal({ name: '' })} />
      <CreatePrivateGame open={modal.name === 'CREATING_PRIVATE_GAME'} onClose={() => setModal({ name: '' })} />
    </>
  );
}
