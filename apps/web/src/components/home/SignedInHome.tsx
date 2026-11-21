import { useContext, useState } from 'react';
import Head from 'next/head';
import { useQuery } from 'react-query';
import NavigationBar from '@/components/NavigationBar';
import Footer from '@/components/Footer';
import TimerSelection from '@/components/TimerSelection';
import LiveGamesStrip from '@/components/LiveGamesStrip';
import RecentGames from '@/components/profile/RecentGames';
import Partners from '@/components/profile/Partners';
import InviteTeammates from '@/modals/InviteTeammates';
import CreatePrivateGame from '@/modals/CreatePrivateGame';
import { AppContext } from '@/contexts/App';
import { getProfile } from '@/apis/players';
import { useUser } from '@/hooks/useUser';

/** Home for signed-in players: start a game, then your games and your people. */
const SignedInHome = () => {
  const { setModal, modal } = useContext(AppContext);
  const me = useUser();
  const id = me.data?._id ?? '';
  // 404 just means no finished games yet
  const profile = useQuery(['profile', id], () => getProfile(id), { enabled: !!id, retry: false });
  const [code, setCode] = useState('');

  return (
    <>
      <Head>
        <title>Relay Chess</title>
      </Head>
      <NavigationBar />
      <main className="mx-auto flex max-w-6xl flex-col gap-10 px-4 pb-16 pt-8">
        <section id="play" aria-label="Play" className="grid gap-4 md:grid-cols-3">
          <div className="flex flex-col justify-between gap-6 rounded-2xl bg-accent p-6 text-accent-fg">
            <div>
              <h2 className="text-xl font-semibold">Play with friends</h2>
              <p className="mt-1 text-sm text-accent-fg/80">Make a room and send the link. 1 to 4 a side.</p>
            </div>
            <button
              type="button"
              onClick={() => setModal({ name: 'CREATING_PRIVATE_GAME' })}
              className="h-11 rounded-xl bg-accent-fg px-5 text-sm font-semibold text-accent hover:bg-accent-fg/90"
            >
              Create a room
            </button>
          </div>

          <div className="flex flex-col gap-4 rounded-2xl border border-line bg-surface p-6">
            <div>
              <h2 className="text-xl font-semibold">Quick match</h2>
              <p className="mt-1 text-sm text-fg-muted">Join the queue for a 2v2 with anyone.</p>
            </div>
            <TimerSelection />
          </div>

          <div className="flex flex-col justify-between gap-4 rounded-2xl border border-line bg-surface p-6">
            <div>
              <h2 className="text-xl font-semibold">Bring a partner</h2>
              <p className="mt-1 text-sm text-fg-muted">Team up, then get matched against another pair.</p>
            </div>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => setModal({ name: 'INVITE_TEAMMATES' })}
                className="h-11 rounded-lg bg-fg px-4 text-sm font-semibold text-bg hover:bg-fg/85"
              >
                Start a team
              </button>
              <form
                className="flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (code.trim()) setModal({ name: 'INVITE_TEAMMATES', data: { inviteCode: code.trim() } });
                }}
              >
                <label htmlFor="home-team-code" className="sr-only">
                  Team code
                </label>
                <input
                  id="home-team-code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Have a code?"
                  className="h-11 min-w-0 flex-1 rounded-lg border border-line bg-bg px-3 text-sm placeholder:text-fg-subtle focus:border-accent focus:outline-none"
                />
                <button type="submit" disabled={!code.trim()} className="h-11 rounded-lg border border-line px-4 text-sm font-medium hover:bg-fg/5 disabled:opacity-50">
                  Join
                </button>
              </form>
            </div>
          </div>
        </section>

        {profile.data ? (
          <>
            <RecentGames profile={profile.data} title="Your recent games" />
            <Partners profile={profile.data} />
          </>
        ) : profile.isError ? (
          <section className="flex flex-col gap-2">
            <h2 className="text-lg font-semibold">Your recent games</h2>
            <p className="text-sm text-fg-muted">No finished games yet. They show up here as soon as one ends.</p>
          </section>
        ) : null}
      </main>
      <LiveGamesStrip />
      <Footer />
      <InviteTeammates open={modal.name === 'INVITE_TEAMMATES'} onClose={() => setModal({ name: '' })} />
      <CreatePrivateGame open={modal.name === 'CREATING_PRIVATE_GAME'} onClose={() => setModal({ name: '' })} />
    </>
  );
};

export default SignedInHome;
