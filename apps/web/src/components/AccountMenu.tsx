import { useContext, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { AppContext } from '@/contexts/App';
import VerifiedMark from '@/components/VerifiedMark';
import { initials } from '@/components/game/util';
import { signOut } from '@/lib/auth';

/** Signed-in players: your name, then Profile, Settings, Sign out. */
const AccountMenu = ({ id, name }: { id: string; name: string }) => {
  const { setRightDrawerOpen } = useContext(AppContext);
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent) => !box.current?.contains(e.target as Node) && setOpen(false);
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', away);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('mousedown', away);
      document.removeEventListener('keydown', esc);
    };
  }, [open]);

  const item = 'flex h-10 w-full items-center rounded-md px-3 text-left text-sm hover:bg-fg/5';

  return (
    <div ref={box} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`${name}, account menu`}
        onClick={() => setOpen((o) => !o)}
        className="ml-1 inline-flex h-10 items-center gap-2 rounded-lg pl-1.5 pr-2.5 hover:bg-fg/5"
      >
        <span className="flex h-7 min-w-7 items-center justify-center rounded-full bg-accent px-1 text-xs font-semibold text-accent-fg">{initials(name)}</span>
        <span className="hidden max-w-[160px] truncate text-sm font-medium sm:inline">{name}</span>
        <VerifiedMark size={13} className="hidden sm:inline-block" decorative />
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-fg-muted" aria-hidden="true">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-12 z-50 w-48 rounded-xl border border-line bg-surface p-1.5 shadow-lg">
          <Link role="menuitem" href={`/players/${id}`} className={item} onClick={() => setOpen(false)}>
            Profile
          </Link>
          <button role="menuitem" type="button" className={item} onClick={() => (setOpen(false), setRightDrawerOpen(true))}>
            Settings
          </button>
          <div className="my-1 border-t border-line" />
          <button
            role="menuitem"
            type="button"
            className={item}
            onClick={async () => {
              setOpen(false);
              await signOut();
              await router.push('/');
            }}
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
};

export default AccountMenu;
