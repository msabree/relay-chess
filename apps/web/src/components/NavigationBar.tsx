import { useContext } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { AppContext } from '@/contexts/App';
import { useNotifications } from '@/hooks/useNotifications';
import { useUser } from '@/hooks/useUser';
import LeftDrawer from './LeftDrawer';
import LogoV1 from '@/icons/LogoV1';
import LogoSmallV1 from '@/icons/LogoSmallV1';
import dynamic from 'next/dynamic';

const Menu = dynamic(() => import('lucide-react').then(mod => mod.Menu), { ssr: false });
const Bell = dynamic(() => import('lucide-react').then(mod => mod.Bell), { ssr: false });
const Settings = dynamic(() => import('lucide-react').then(mod => mod.Settings), { ssr: false });
import { Button } from '@/components/ui/button';
import ReactGA from 'react-ga4';
import { CLICKED_SIGN_IN } from '@/constants';

const NavigationBar = ({
  hideSignIn,
  appearance = 'dark',
}: {
  hideSignIn?: boolean;
  appearance?: 'dark' | 'light';
}) => {
  const isLight = appearance === 'light';
  const {
    testUserEmail,
    modal,
    setLeftDrawerOpen,
    setRightDrawerOpen,
    setModal
  } = useContext(AppContext);
  const { data: session, status } = useSession();
  const userQuery = useUser();
  const userId = userQuery.data?._id ?? '';
  const notificationsQuery = useNotifications(userId);
  const router = useRouter();
  const unreadCount = notificationsQuery.data?.filter((notification) => !notification.seen).length ?? 0;

  const navLinkClass = (path: string) =>
    `px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
      router.pathname === path
        ? 'text-cyan-400 bg-cyan-400/10'
        : 'text-gray-300 hover:text-cyan-400 hover:bg-white/5'
    }`;

  if ((!session || status !== 'authenticated') && !testUserEmail) {
    return (
      <nav
        className={
          isLight
            ? 'sticky top-0 z-50 border-b border-stone-200 bg-white/95 backdrop-blur-sm'
            : 'glass-effect border-b border-white/10 backdrop-blur-xl sticky top-0 z-50'
        }
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center transition-opacity hover:opacity-80">
              <LogoV1 width={200} height={45}/>
            </Link>
            {!hideSignIn && (
              <div className="flex items-center">
                <Button
                  onClick={() => {
                    setModal({ name: 'SIGN_IN' });
                    ReactGA.event({
                      category: CLICKED_SIGN_IN,
                      action: 'Clicked Sign In',
                    });
                  }}
                  className={
                    isLight
                      ? 'bg-stone-900 hover:bg-stone-800 text-white px-5 py-2 rounded-lg font-medium'
                      : 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white px-6 py-2 rounded-lg font-semibold transition-all duration-300 glow-effect'
                  }
                >
                  Sign In
                </Button>
              </div>
            )}
          </div>
        </div>
      </nav>
    );
  }

  if ((session && status === 'authenticated') || testUserEmail) {
    return (
      <nav className="glass-effect border-b border-white/10 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setLeftDrawerOpen(true)}
                className="md:hidden p-2 rounded-lg text-gray-300 hover:text-cyan-400 hover:bg-white/10 focus:outline-none transition-all duration-200"
              >
                <Menu className="h-6 w-6" />
              </button>
              <Link href="/" className="flex items-center transition-opacity hover:opacity-80">
                <LogoV1 width={200} height={45} className="hidden md:block"/>
                <LogoSmallV1 width={30} height={40} fill={'#2dd4bf'} className="md:hidden" />
              </Link>
              <div className="hidden md:flex items-center gap-1 ml-6">
                <Link href="/home" className={navLinkClass('/home')}>
                  {"Home"}
                </Link>
                <Link href="/live-games" className={navLinkClass('/live-games')}>
                  {"Live Games"}
                </Link>
                <Link href="/leaderboard" className={navLinkClass('/leaderboard')}>
                  {"Leaderboard"}
                </Link>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={(evt) => {
                  const notificationsOpen = modal.name === 'NOTIFICATIONS';
                  setModal({
                    name: notificationsOpen ? '' : 'NOTIFICATIONS',
                    data: {
                      notificationsAnchor: evt.currentTarget
                    }
                  });
                }}
                className="p-2 rounded-lg text-gray-300 hover:text-cyan-400 hover:bg-white/10 focus:outline-none relative transition-all duration-200"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-gradient-to-r from-red-500 to-red-600 ring-2 ring-gray-900"></span>
                )}
              </button>
              <button
                onClick={() => setRightDrawerOpen(true)}
                className="p-2 rounded-lg text-gray-300 hover:text-cyan-400 hover:bg-white/10 focus:outline-none transition-all duration-200"
                aria-label={"Settings"}
              >
                <Settings className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
        <LeftDrawer />
      </nav>
    );
  }

  return null;
};

export default NavigationBar;
