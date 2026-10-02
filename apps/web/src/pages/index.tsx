import { useContext, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import NavigationBar from '@/components/NavigationBar';
import { AppContext } from '@/contexts/App';
import Footer from '@/components/Footer';
import TimerSelection from '@/components/TimerSelection';
import SocialLinks from '@/components/SocialLinks';
import SignInModal from '@/modals/SignIn';
import dynamic from 'next/dynamic';
import { ANALYTICS_TEST_MODE, CREATED_PRIVATE_GAME, DEMO_VIDEO, GOOGLE_ANALYTICS_ID, SELECTED_GAME_MODE, SITE_URL } from '@/constants';
import { Button } from '@/components/ui/button';
import InviteTeammates from '@/modals/InviteTeammates';
import CreatePrivateGame from '@/modals/CreatePrivateGame';
import TeamPlayExperience from '@/components/TeamPlayExperience';
import GameModeSelector from '@/components/GameModeSelector';
import ReactGA from 'react-ga4';

const Shield = dynamic(() => import('lucide-react').then(mod => mod.Shield), { ssr: false });
const Play = dynamic(() => import('lucide-react').then(mod => mod.Play), { ssr: false });
const Github = dynamic(() => import('lucide-react').then(mod => mod.Github), { ssr: false });

const LandingPage = () => {
  const router = useRouter();
  const { setModal, modal } = useContext(AppContext);
  const { data: session } = useSession();
  const [activeButton, setActiveButton] = useState<'solo' | 'team' | 'private'>('private');

  const handleButtonClick = useCallback((buttonType: 'solo' | 'team' | 'private') => {
    setActiveButton(buttonType);
    ReactGA.event({
      category: SELECTED_GAME_MODE,
      action: buttonType === 'solo' ? 'Solo Player' : buttonType === 'team' ? 'Team Player' : 'Private Arena',
    });
  }, []);

  const handleCreatePrivateGame = useCallback(() => {
    setModal({ name: 'CREATING_PRIVATE_GAME' });
    ReactGA.event({
      category: CREATED_PRIVATE_GAME,
      action: 'Created Private Game',
    });
  }, [setModal]);

  if (session) {
    router.replace('/home');
  }

  if (GOOGLE_ANALYTICS_ID) ReactGA.initialize(GOOGLE_ANALYTICS_ID, {
    testMode: ANALYTICS_TEST_MODE,
  });

  return (
    <>
      <Head>
        <title>2v2 Chess — Relay Chess</title>
        <meta
          name="description"
          content="Play 2v2 team chess with friends. Private and team games are the best way to play on Relay Chess."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={SITE_URL} />
        <meta property="og:title" content="2v2 Chess — Relay Chess" />
        <meta
          property="og:description"
          content="Team chess with friends. Open sourcing soon — help carry the project forward."
        />
        <meta property="og:locale" content="en_US" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="canonical" href={SITE_URL} />
      </Head>

      <NavigationBar />

      <main className="relative min-h-screen">
        {/* Notices */}
        <div className="border-b border-white/10 glass-effect">
          <div className="max-w-3xl mx-auto px-4 py-4 space-y-3 text-sm leading-relaxed">
            <p className="flex gap-2 text-gray-200">
              <Github className="w-4 h-4 mt-0.5 shrink-0 text-cyan-400" aria-hidden />
              <span>
                <strong className="font-medium text-white">Open sourcing soon.</strong> I do not have time to maintain
                Relay Chess on my own. The codebase will be published so others can run it, improve it, and keep it
                alive.
              </span>
            </p>
            <p className="text-gray-400 pl-6">
              <strong className="font-medium text-gray-200">Play with a group.</strong> Private rooms and team codes are
              the reliable way to get a game. Public matchmaking is available but usually quiet until more people are
              online.
            </p>
          </div>
        </div>

        {/* Hero */}
        <section className="relative pt-16 pb-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-5 leading-tight">
              <span className="text-white">2v2 chess </span>
              <span className="text-gradient">with your people</span>
            </h1>
            <p className="text-lg text-gray-300 leading-relaxed max-w-2xl mx-auto">
              Relay Chess is team chess: coordinate with a partner, pass the board, and play on one shared clock. Set up
              a private room or share a team code—that is how most games happen today.
            </p>
          </div>
        </section>

        {/* Modes */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <GameModeSelector activeButton={activeButton} onButtonClick={handleButtonClick} />

          <div className="mt-8 p-6 md:p-8 rounded-2xl glass-effect text-white">
            {activeButton === 'private' && (
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <Shield className="w-6 h-6 text-cyan-400" />
                  <h3 className="text-2xl font-bold">Private game</h3>
                </div>
                <p className="text-gray-300 mb-8 text-lg leading-relaxed">
                  Create a room and invite three friends. You control who joins—no waiting on strangers in the public
                  queue.
                </p>
                <Button
                  className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white px-8 py-6 text-lg font-semibold rounded-xl"
                  onClick={handleCreatePrivateGame}
                >
                  <Play className="w-5 h-5 mr-2" />
                  Create private game
                </Button>
              </div>
            )}

            {activeButton === 'team' && <TeamPlayExperience />}

            {activeButton === 'solo' && (
              <div>
                <h3 className="text-2xl font-bold mb-4">Quick match</h3>
                <p className="text-gray-300 mb-8 text-lg leading-relaxed">
                  Join the public queue if you want to test matchmaking. When few players are online, prefer private or
                  team play above.
                </p>
                <TimerSelection />
              </div>
            )}
          </div>
        </section>

        {/* Leaderboard teaser */}
        <section className="relative py-20 px-4 sm:px-6 lg:px-8 border-t border-white/5">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-white mb-4">Leaderboard</h2>
            <p className="text-gray-400 mb-8 text-lg">
              Ranked stats for signed-in players. Climb the board with your regular group.
            </p>
            <Button
              asChild
              className="bg-white/10 hover:bg-white/15 text-white border border-white/20"
            >
              <Link href="/leaderboard">View leaderboard</Link>
            </Button>
          </div>
        </section>

        {/* Demo */}
        <section className="relative py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-white mb-4">How it works</h2>
              <p className="text-gray-400 text-lg max-w-lg mx-auto">
                A short walkthrough of relay-style 2v2 play.
              </p>
            </div>
            <div className="rounded-2xl overflow-hidden glass-effect p-2">
              <video
                width="100%"
                src={DEMO_VIDEO}
                controls
                muted
                playsInline
                className="rounded-xl w-full"
                aria-label="Demo video showing 2v2 chess gameplay"
              />
            </div>
          </div>
        </section>

        <section className="relative py-12 px-4 sm:px-6 lg:px-8">
          <SocialLinks />
        </section>
      </main>

      <Footer />

      <SignInModal />
      <InviteTeammates open={modal.name === 'INVITE_TEAMMATES'} onClose={() => setModal({ name: '' })} />
      <CreatePrivateGame open={modal.name === 'CREATING_PRIVATE_GAME'} onClose={() => setModal({ name: '' })} />
    </>
  );
};

export default LandingPage;
