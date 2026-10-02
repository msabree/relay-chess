import React, { useContext } from 'react';
import dynamic from 'next/dynamic';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/router';
import { AppContext } from '@/contexts/App';
import LogoV1 from '@/icons/LogoV1';

const X = dynamic(() => import('lucide-react').then(mod => mod.X), { ssr: false });
const Home = dynamic(() => import('lucide-react').then(mod => mod.Home), { ssr: false });
const Trophy = dynamic(() => import('lucide-react').then(mod => mod.Trophy), { ssr: false });
const Eye = dynamic(() => import('lucide-react').then(mod => mod.Eye), { ssr: false });

const LeftDrawer = () => {
  const router = useRouter();
  const { leftDrawerOpen, setLeftDrawerOpen } = useContext(AppContext);

  if (!leftDrawerOpen || typeof window === 'undefined') return null;

  const drawerLinkClass = (path: string) =>
    `w-full flex items-center gap-3 px-5 py-3.5 rounded-xl transition-all duration-200 group ${
      router.pathname === path
        ? 'glass-effect border border-cyan-400/50 bg-cyan-400/10 text-cyan-400'
        : 'text-gray-300 hover:text-cyan-400 hover:bg-white/5'
    }`;

  const iconClass = (path: string) =>
    `h-5 w-5 ${router.pathname === path ? 'text-cyan-400' : 'text-gray-400 group-hover:text-cyan-400'} transition-colors`;

  return createPortal(
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[999] transition-opacity duration-300"
      onClick={() => setLeftDrawerOpen(false)}
    >
      <div
        className={`fixed left-0 top-0 h-full w-[280px] glass-effect border-r border-white/10 backdrop-blur-xl z-[1000] transform transition-transform duration-300 ease-in-out ${
          leftDrawerOpen ? 'translate-x-0' : '-translate-x-full'
        } shadow-2xl`}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-6 border-b border-white/10">
            <button
              onClick={() => setLeftDrawerOpen(false)}
              className="p-2.5 rounded-lg text-gray-400 hover:text-cyan-400 hover:bg-white/10 transition-all duration-200"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <nav className="flex-1 py-6 overflow-y-auto">
            <div className="px-6 mb-10">
              <button
                onClick={() => {
                  router.push('/home');
                  setLeftDrawerOpen(false);
                }}
                className="w-full hover:opacity-80 transition-opacity"
              >
                <LogoV1 width={200} height={45} />
              </button>
            </div>

            <div className="space-y-3 px-6">
              <button
                onClick={() => {
                  router.push('/home');
                  setLeftDrawerOpen(false);
                }}
                className={drawerLinkClass('/home')}
              >
                <Home className={iconClass('/home')} />
                <span className="font-medium">{"Home"}</span>
              </button>

              <button
                onClick={() => {
                  router.push('/live-games');
                  setLeftDrawerOpen(false);
                }}
                className={drawerLinkClass('/live-games')}
              >
                <Eye className={iconClass('/live-games')} />
                <span className="font-medium">{"Live Games"}</span>
              </button>

              <button
                onClick={() => {
                  router.push('/leaderboard');
                  setLeftDrawerOpen(false);
                }}
                className={drawerLinkClass('/leaderboard')}
              >
                <Trophy className={iconClass('/leaderboard')} />
                <span className="font-medium">{"Leaderboard"}</span>
              </button>
            </div>
          </nav>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default LeftDrawer;
