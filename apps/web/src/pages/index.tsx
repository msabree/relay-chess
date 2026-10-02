import { useContext, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import ReactGA from 'react-ga4';
import NavigationBar from '@/components/NavigationBar';
import Footer from '@/components/Footer';
import PlayOptions from '@/components/PlayOptions';
import InviteTeammates from '@/modals/InviteTeammates';
import CreatePrivateGame from '@/modals/CreatePrivateGame';
import { AppContext } from '@/contexts/App';
import { ANALYTICS_TEST_MODE, CREATED_PRIVATE_GAME, DEMO_VIDEO, GOOGLE_ANALYTICS_ID, SITE_URL } from '@/constants';
import useOnlineStats from '@/hooks/useOnlineStats';

const REPO_URL = 'https://github.com/msabree/relay-chess';

const STEPS = [
  {
    n: '1',
    title: 'Gather your people',
    body: 'Make a room and drop the link in the group chat. Two per side is the classic setup.',
  },
  {
    n: '2',
    title: 'Take turns, no huddles',
    body: "Teammates alternate your side's moves in seat order. You see every move your partner makes, never their plan.",
  },
  {
    n: '3',
    title: 'Win or lose together',
    body: 'Checkmate, resignation or the clock: the whole team shares the result, and the post-game banter.',
  },
];

const LandingPage = () => {
  const router = useRouter();
  const { setModal, modal } = useContext(AppContext);
  const { data: session } = useSession();
  const { totalOnline } = useOnlineStats();

  useEffect(() => {
    if (session) router.replace('/home');
  }, [session, router]);

  useEffect(() => {
    if (GOOGLE_ANALYTICS_ID) ReactGA.initialize(GOOGLE_ANALYTICS_ID, { testMode: ANALYTICS_TEST_MODE });
  }, []);

  return (
    <>
      <Head>
        <title>Relay Chess: 2v2 chess with your friends</title>
        <meta name="description" content="Two teams, one board. Teammates take turns making moves. Free, open source, and no account needed." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={SITE_URL} />
        <meta property="og:title" content="Relay Chess: 2v2 chess with your friends" />
        <meta property="og:description" content="Two teams, one board. Teammates take turns making moves." />
        <link rel="canonical" href={SITE_URL} />
      </Head>

      <NavigationBar />

      <main>
        {/* Hero */}
        <section className="mx-auto grid max-w-6xl items-start gap-12 px-4 pb-16 pt-12 md:grid-cols-[1fr_1.05fr] md:pt-20">
          <div>
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-line px-3 py-1 text-sm text-fg-muted">
              <span className="h-2 w-2 rounded-full bg-accent" />
              2v2 chess · free and open source
            </p>
            <h1 className="text-4xl font-semibold leading-[1.08] tracking-tight sm:text-5xl md:text-6xl">
              Chess is better
              <br />
              with friends.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-fg-muted">
              Two teams, one board. You and your partner take turns making your team&apos;s moves, with no huddles and
              no take-backs. It&apos;s part strategy, part trust, and a lot of laughing at moves you never would have made.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => {
                  setModal({ name: 'CREATING_PRIVATE_GAME' });
                  ReactGA.event({ category: CREATED_PRIVATE_GAME, action: 'Created Private Game' });
                }}
                className="h-12 rounded-xl bg-accent px-6 text-base font-semibold text-accent-fg hover:bg-accent/90 transition-colors"
              >
                Start a game with friends
              </button>
              <Link
                href="/live-games"
                className="inline-flex h-12 items-center justify-center rounded-xl border border-line px-6 text-base font-medium hover:bg-fg/5 transition-colors"
              >
                Watch a live game
              </Link>
            </div>
            <p className="mt-4 text-sm text-fg-subtle">
              No account needed. {totalOnline > 1 ? `${totalOnline} people are around right now.` : 'Share a link and you are playing.'}
            </p>
          </div>
          <figure className="overflow-hidden rounded-2xl border border-line bg-ink-950 shadow-[0_24px_60px_-30px_rgba(0,0,0,0.5)]">
            <video
              src={DEMO_VIDEO}
              autoPlay
              muted
              loop
              playsInline
              controls
              preload="metadata"
              className="block aspect-video w-full bg-ink-950"
              aria-label="A 2v2 Relay Chess game being played"
            />
          </figure>
        </section>

        {/* How it works */}
        <section className="border-y border-line bg-surface">
          <div className="mx-auto max-w-6xl px-4 py-16">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">How a relay game works</h2>
            <div className="mt-10 grid gap-8 md:grid-cols-3">
              {STEPS.map((s) => (
                <div key={s.n}>
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent font-mono text-sm font-semibold text-accent-fg">
                    {s.n}
                  </span>
                  <h3 className="mt-4 text-lg font-semibold">{s.title}</h3>
                  <p className="mt-2 leading-relaxed text-fg-muted">{s.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Play */}
        <section id="play" className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Pick how you want to play</h2>
          <p className="mt-2 mb-8 text-fg-muted">Every option is free, and nobody needs an account.</p>
          <PlayOptions />
        </section>

        {/* Story */}
        <section className="mx-auto max-w-6xl px-4 pb-20">
          <div className="grid gap-8 rounded-2xl bg-ink-900 p-8 text-ink-50 ring-1 ring-inset ring-transparent dark:bg-accent dark:text-accent-fg sm:p-12 md:grid-cols-[1.4fr_1fr] md:items-end">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Born at game night.</h2>
              <p className="mt-4 max-w-2xl leading-relaxed text-ink-300 dark:text-ink-800">
                Relay Chess started with four friends, one board, and a lot of groaning at a partner&apos;s &ldquo;creative&rdquo;
                moves. We built it so that game night works from anywhere. It&apos;s free, there are no ads, and the code
                is open, so it sticks around for as long as people want to play.
              </p>
            </div>
            <div className="flex flex-col gap-3 md:items-end">
              <a
                href={REPO_URL}
                className="inline-flex h-12 items-center justify-center rounded-xl bg-accent px-6 font-semibold text-accent-fg hover:bg-accent/90 dark:bg-ink-950 dark:text-yellow-500 dark:hover:bg-ink-800"
              >
                Help build it on GitHub
              </a>
              <Link href="/leaderboard" className="text-sm text-ink-300 underline-offset-4 hover:text-ink-50 hover:underline dark:text-ink-800 dark:hover:text-ink-950">
                Or see who&apos;s on top of the leaderboard
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
      <InviteTeammates open={modal.name === 'INVITE_TEAMMATES'} onClose={() => setModal({ name: '' })} />
      <CreatePrivateGame open={modal.name === 'CREATING_PRIVATE_GAME'} onClose={() => setModal({ name: '' })} />
    </>
  );
};

export default LandingPage;
