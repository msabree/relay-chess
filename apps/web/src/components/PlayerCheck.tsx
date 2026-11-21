import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import VerifiedMark from '@/components/VerifiedMark';

/**
 * The check next to a signed-in player in a game (blue for supporters). Hover it (or tap it on
 * a phone) for a small link to their profile, which opens in a new tab so
 * nobody leaves the game.
 */
const PlayerCheck = ({ id, name, size = 12, supporter = false }: { id: string; name: string; size?: number; supporter?: boolean }) => {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top?: number; bottom?: number; left: number } | null>(null);
  const btn = useRef<HTMLButtonElement>(null);
  const card = useRef<HTMLAnchorElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const show = () => {
    clearTimeout(closeTimer.current);
    const r = btn.current?.getBoundingClientRect();
    if (r) {
      const w = supporter ? 190 : 120;
      const left = Math.max(8, Math.min(r.left + r.width / 2 - w / 2, window.innerWidth - w - 8));
      // Below the check, or above it near the bottom of the screen.
      setPos(window.innerHeight - r.bottom < 60 ? { bottom: window.innerHeight - r.top + 6, left } : { top: r.bottom + 6, left });
    }
    setOpen(true);
  };
  const hide = () => {
    clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpen(false), 150);
  };

  useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => {
      const t = e.target as Node;
      if (!btn.current?.contains(t) && !card.current?.contains(t)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    const close = () => setOpen(false);
    document.addEventListener('pointerdown', away);
    document.addEventListener('keydown', esc);
    window.addEventListener('scroll', close, true);
    return () => {
      document.removeEventListener('pointerdown', away);
      document.removeEventListener('keydown', esc);
      window.removeEventListener('scroll', close, true);
    };
  }, [open]);

  return (
    <>
      <button
        ref={btn}
        type="button"
        aria-label={supporter ? `${name}, supporter. Profile` : `${name}'s profile`}
        aria-expanded={open}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
        onClick={(e) => {
          e.stopPropagation();
          if (open) setOpen(false);
          else show();
        }}
        className="inline-flex shrink-0 items-center rounded-full p-0.5 hover:bg-fg/10"
      >
        <VerifiedMark size={size} supporter={supporter} decorative />
      </button>
      {open &&
        pos &&
        createPortal(
          <a
            ref={card}
            href={`/players/${id}`}
            target="_blank"
            rel="noopener"
            onMouseEnter={show}
            onMouseLeave={hide}
            onFocus={show}
            onBlur={hide}
            style={pos}
            className="fixed z-50 inline-flex h-8 items-center gap-1 rounded-lg border border-line bg-surface px-3 text-xs font-semibold text-fg shadow-lg hover:bg-raised"
          >
            {supporter && (
              <span className="mr-1.5 flex items-center gap-1 border-r border-line pr-2 text-supporter">
                <VerifiedMark size={11} supporter decorative />
                Supporter
              </span>
            )}
            View profile
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
              <path d="M7 17 17 7M8 7h9v9" />
            </svg>
          </a>,
          document.body,
        )}
    </>
  );
};

export default PlayerCheck;
