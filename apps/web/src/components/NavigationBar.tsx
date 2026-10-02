import { useContext, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import ReactGA from 'react-ga4';
import { AppContext } from '@/contexts/App';
import { useUser } from '@/hooks/useUser';
import Logo from '@/icons/Logo';
import ThemeToggle from '@/components/ThemeToggle';
import RightDrawer from '@/components/RightDrawer';
import SignInModal from '@/modals/SignIn';
import UpdateProfileInfo from '@/modals/UpdateProfileInfo';
import { CLICKED_SIGN_IN } from '@/constants';

// Sign-in is hidden until Google/Apple are set up again. Set NEXT_PUBLIC_ENABLE_SIGN_IN=true to show it.
const SIGN_IN_ENABLED = process.env.NEXT_PUBLIC_ENABLE_SIGN_IN === 'true';

/** One header for every page: brand, a few links, theme toggle, account. */
const NavigationBar = ({ compact = false }: { compact?: boolean; hideSignIn?: boolean }) => {
  const { setModal, setRightDrawerOpen } = useContext(AppContext);
  const { data: session, status } = useSession();
  const user = useUser();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const signedIn = status === 'authenticated' && !!session;
  const home = signedIn ? '/home' : '/';

  const links = [
    { href: home, label: 'Play' },
    { href: '/live-games', label: 'Watch' },
    { href: '/leaderboard', label: 'Leaderboard' },
  ];
  const linkClass = (href: string) =>
    `px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
      router.pathname === href ? 'text-fg bg-fg/[0.06]' : 'text-fg-muted hover:text-fg hover:bg-fg/5'
    }`;

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-line bg-bg/90 backdrop-blur supports-[backdrop-filter]:bg-bg/75">
        <div className={`mx-auto flex h-14 items-center justify-between gap-4 px-4 ${compact ? 'max-w-[1400px]' : 'max-w-6xl'}`}>
          <div className="flex items-center gap-10">
            <Link href={home} className="rounded-md" aria-label="Relay Chess home">
              <Logo />
            </Link>
            <nav aria-label="Main" className="hidden md:flex items-center gap-1">
              {links.map((l) => (
                <Link key={l.label} href={l.href} className={linkClass(l.href)} aria-current={router.pathname === l.href ? "page" : undefined}>
                  {l.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-1">
            <ThemeToggle />
            {signedIn ? (
              <button
                type="button"
                onClick={() => setRightDrawerOpen(true)}
                className="ml-1 inline-flex h-10 items-center gap-2 rounded-lg pl-1.5 pr-3 hover:bg-fg/5"
                aria-label="Account and settings"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent text-accent-fg text-xs font-semibold">
                  {(user.data?.username ?? '?').charAt(0).toUpperCase()}
                </span>
                <span className="hidden sm:inline max-w-[140px] truncate text-sm font-medium">{user.data?.username}</span>
              </button>
            ) : SIGN_IN_ENABLED ? (
              <button
                type="button"
                onClick={() => {
                  setModal({ name: 'SIGN_IN' });
                  ReactGA.event({ category: CLICKED_SIGN_IN, action: 'Clicked Sign In' });
                }}
                className="ml-1 h-10 rounded-lg px-4 text-sm font-semibold bg-fg text-bg hover:bg-fg/85 transition-colors"
              >
                Sign in
              </button>
            ) : null}
            <button
              type="button"
              className="md:hidden inline-flex h-10 w-10 items-center justify-center rounded-lg text-fg-muted hover:text-fg hover:bg-fg/5"
              aria-label="Menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((o) => !o)}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                {menuOpen ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
              </svg>
            </button>
          </div>
        </div>
        {menuOpen && (
          <nav aria-label="Main" className="md:hidden border-t border-line px-4 py-2 flex flex-col">
            {links.map((l) => (
              <Link key={l.label} href={l.href} className={`${linkClass(l.href)} py-3`} onClick={() => setMenuOpen(false)}>
                {l.label}
              </Link>
            ))}
          </nav>
        )}
      </header>
      <SignInModal />
      {signedIn && (
        <>
          <RightDrawer />
          <UpdateProfileInfo />
        </>
      )}
    </>
  );
};

export default NavigationBar;
