import { useContext, useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import Head from 'next/head';
import { AppContext } from '@/contexts/App';
import { useUser } from '@/hooks/useUser';
import NavigationBar from '@/components/NavigationBar';
import Footer from '@/components/Footer';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';

const Trophy = dynamic(() => import('lucide-react').then(mod => mod.Trophy), { ssr: false });
const Zap = dynamic(() => import('lucide-react').then(mod => mod.Zap), { ssr: false });
const Shield = dynamic(() => import('lucide-react').then(mod => mod.Shield), { ssr: false });
const Sparkles = dynamic(() => import('lucide-react').then(mod => mod.Sparkles), { ssr: false });
const Play = dynamic(() => import('lucide-react').then(mod => mod.Play), { ssr: false });
import TimerSelection from '@/components/TimerSelection';
import InviteTeammates from '@/modals/InviteTeammates';
import CreatePrivateGame from '@/modals/CreatePrivateGame';
import GameHistory from '@/components/GameHistory';
import RightDrawer from '@/components/RightDrawer';
import Notifications from '@/components/Notifications';
import UpdateProfileInfo from '@/modals/UpdateProfileInfo';
import { useRouter } from 'next/router';
import TeamPlayExperience from '@/components/TeamPlayExperience';
import GameModeSelector from '@/components/GameModeSelector';
import ReactGA from 'react-ga4';
import { ANALYTICS_TEST_MODE, GOOGLE_ANALYTICS_ID, CREATED_PRIVATE_GAME, SITE_URL } from '@/constants';
import useOnlineStats from '@/hooks/useOnlineStats';

export default function Home() {
  const { testUserEmail, setModal, modal } = useContext(AppContext);
  const { data: session, status } = useSession();
  const userQuery = useUser();
  const [activeButton, setActiveButton] = useState<'solo' | 'team' | 'private'>('solo');
  const { totalOnline } = useOnlineStats();
  const router = useRouter();

  if (GOOGLE_ANALYTICS_ID) ReactGA.initialize(GOOGLE_ANALYTICS_ID, {
    testMode: ANALYTICS_TEST_MODE,
    gaOptions: {
      userId: userQuery.data?._id,
    },
  });

  useEffect(() => {
    if(!session && status === 'unauthenticated' && !testUserEmail){
      router.replace('/');
    }
  }, [router, session, status, testUserEmail]);

  const handleButtonClick = useCallback((buttonType: 'solo' | 'team' | 'private') => {
    setActiveButton(buttonType);
  }, []);

  const handleCreatePrivateGame = useCallback(() => {
    setModal({ name: 'CREATING_PRIVATE_GAME' });
    ReactGA.event({
      category: CREATED_PRIVATE_GAME,
      action: 'Created Private Game',
    });
  }, [setModal]);

  return (
    <>
      <Head>
        <title>{"Home - Relay Chess | Play 2v2 Team Chess"}</title>
        <meta name="title" content={"Home - Relay Chess | Play 2v2 Team Chess"} />
        <meta name="description" content={"Play 2v2 team chess on Relay Chess. Choose from Quick Match, Team Up, or Private Arena. Start playing and climb the leaderboard!"} />
        <meta name="robots" content="noindex, nofollow" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="canonical" href={`${SITE_URL}/home`} />
      </Head>
      <div className="relative min-h-screen overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        <NavigationBar />
        
        <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-12">
          {/* Hero Welcome Section */}
          <div className="text-center mb-16 mt-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-effect mb-6 animate-fade-in">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span className="text-sm text-cyan-300 font-medium">{"Welcome Back"}</span>
            </div>
          
            <h1 className="text-4xl md:text-6xl font-bold mb-4 leading-tight">
              <span className="text-gradient">{`Welcome back, ${userQuery.data?.username ?? 'Guest'}`}</span>
            </h1>
          
            <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto mb-4 leading-relaxed">
            {"Ready for another game of chess?"}
            </p>

            {totalOnline > 0 && (
              <div className="flex items-center justify-center gap-2 mt-4">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-400">
                  {totalOnline === 1 ? '1 player online now' : `${totalOnline} players online now`}
                </span>
              </div>
            )}
          </div>

          {/* Game Mode Selection */}
          <GameModeSelector 
            activeButton={activeButton}
            onButtonClick={handleButtonClick}
          />

          {/* Active Mode Content */}
          <div className="max-w-5xl mx-auto mt-8 p-8 rounded-2xl glass-effect mb-12">
            {activeButton === 'solo' && (
              <div className="text-white">
                <div className="flex items-center gap-3 mb-6">
                  <Zap className="w-6 h-6 text-cyan-400" />
                  <h3 className="text-2xl font-bold">{"Quick Match"}</h3>
                </div>
                <p className="text-gray-300 mb-8 text-lg leading-relaxed">
                {"Jump into a game instantly. Our matchmaking system will pair you with players of similar skill. No waiting, no hassle—just pure chess action."}
                </p>
                <div className="w-full">
                  <TimerSelection />
                </div>
              </div>
            )}
          
            {activeButton === 'team' && (
              <TeamPlayExperience />
            )}
          
            {activeButton === 'private' && (
              <div className="text-white">
                <div className="flex items-center gap-3 mb-6">
                  <Shield className="w-6 h-6 text-cyan-400" />
                  <h3 className="text-2xl font-bold">{"Private Arena"}</h3>
                </div>
                <p className="text-gray-300 mb-8 text-lg leading-relaxed">
                {"Create your own exclusive game room. Invite specific players, set custom rules, and play with complete control. Perfect for clubs, tournaments, or friendly matches."}
                </p>
                <Button 
                  className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold px-8 py-6 text-lg rounded-xl glow-effect transition-all duration-300 flex items-center gap-2"
                  onClick={handleCreatePrivateGame}
                >
                  <Play className="w-5 h-5" />
                {"Create Private Game"}
                </Button>
              </div>
            )}
          </div>

          {/* Game History Section */}
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-effect mb-4">
                <Trophy className="w-5 h-5 text-amber-400" />
                <span className="text-sm text-amber-300 font-medium">{"Your Journey"}</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              {"Game History"}
              </h2>
              <p className="text-gray-400 text-lg">
              {"Review your past games and learn from every move"}
              </p>
            </div>
          
            <div className="glass-effect border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
              <GameHistory />
            </div>
          </div>
        </main>

        <Footer />

        <InviteTeammates 
          open={modal.name === 'INVITE_TEAMMATES'}
          onClose={() => setModal({ name: '' })}
        />
        <CreatePrivateGame
          open={modal.name === 'CREATING_PRIVATE_GAME'}
          onClose={() => setModal({ name: '' })}
        />
        <UpdateProfileInfo />
        <RightDrawer />
        <Notifications />
      </div>
    </>
  );
}
