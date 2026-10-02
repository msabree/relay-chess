import { useContext, useEffect, useState } from 'react';
import { AppContext } from '@/contexts/App';
import { useUser } from '@/hooks/useUser';
import { renamePlayer } from '@/apis/auth';
import { BOARD_COLOR_SCHEMES } from '@/constants';
import { setBoardColor, useBoardColor } from '@/lib/settings';

const NICKNAME = /^[\p{L}\p{N}_ -]{2,20}$/u;
const LABELS: Record<string, string> = { slate: 'Slate', 'blue-white': 'Blue', 'green-white': 'Green', 'red-white': 'Red' };

/** Settings: your nickname and board colors. Everything lives on this device. */
const SettingsDrawer = () => {
  const { rightDrawerOpen: open, setRightDrawerOpen: setOpen } = useContext(AppContext);
  const user = useUser();
  const board = useBoardColor();
  const [name, setName] = useState('');
  const [state, setState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // Fill the field each time the drawer opens (not when a save updates the name).
  useEffect(() => {
    if (open) {
      setName(user.data?.username ?? '');
      setState('idle');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, setOpen]);

  if (!open) return null;
  const clean = name.trim().replace(/\s+/g, ' ');
  const valid = NICKNAME.test(clean);

  const save = async () => {
    if (!valid || clean === user.data?.username) return;
    setState('saving');
    try {
      await renamePlayer(clean);
      setState('saved');
    } catch {
      setState('error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40" onClick={() => setOpen(false)}>
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
        className="fixed right-0 top-0 flex h-full w-full max-w-sm flex-col border-l border-line bg-surface shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex h-14 items-center justify-between border-b border-line px-5">
          <h2 id="settings-title" className="text-base font-semibold">Settings</h2>
          <button type="button" onClick={() => setOpen(false)} aria-label="Close settings" className="flex h-10 w-10 items-center justify-center rounded-lg text-fg-muted hover:bg-fg/5 hover:text-fg">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <div className="flex-1 space-y-8 overflow-y-auto p-5">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              save();
            }}
          >
            <label htmlFor="nickname" className="text-sm font-semibold">Your name</label>
            <p className="mt-1 text-sm text-fg-muted">What other players see. No account needed; this browser remembers you.</p>
            <div className="mt-3 flex gap-2">
              <input
                id="nickname"
                value={name}
                maxLength={20}
                onChange={(e) => {
                  setName(e.target.value);
                  setState('idle');
                }}
                className="h-10 min-w-0 flex-1 rounded-lg border border-line bg-bg px-3 text-sm focus:border-accent focus:outline-none"
                aria-describedby="nickname-help"
              />
              <button
                type="submit"
                disabled={!valid || clean === user.data?.username || state === 'saving'}
                className="h-10 rounded-lg bg-accent px-4 text-sm font-semibold text-accent-fg hover:bg-accent/90 disabled:opacity-50"
              >
                {state === 'saving' ? 'Saving' : 'Save'}
              </button>
            </div>
            <p id="nickname-help" className={`mt-2 text-xs ${state === 'error' || (!valid && name) ? 'text-danger' : 'text-fg-subtle'}`} aria-live="polite">
              {state === 'saved'
                ? 'Saved. New games will use this name.'
                : state === 'error'
                  ? "Couldn't save that. Try again."
                  : !valid && name
                    ? '2 to 20 letters, numbers, spaces, _ or -.'
                    : '2 to 20 characters.'}
            </p>
          </form>

          <div>
            <h3 id="board-label" className="text-sm font-semibold">Board</h3>
            <div role="radiogroup" aria-labelledby="board-label" className="mt-3 grid grid-cols-4 gap-2">
              {BOARD_COLOR_SCHEMES.map((s) => {
                const on = board.value === s.value;
                return (
                  <button
                    key={s.value}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    onClick={() => setBoardColor(s.value)}
                    className={`flex flex-col items-center gap-1.5 rounded-lg border p-2 text-xs ${on ? 'border-accent ring-1 ring-accent' : 'border-line hover:border-fg/30'}`}
                  >
                    <span className="grid h-10 w-10 grid-cols-2 overflow-hidden rounded-md" aria-hidden="true">
                      <span style={{ background: s.light }} />
                      <span style={{ background: s.dark }} />
                      <span style={{ background: s.dark }} />
                      <span style={{ background: s.light }} />
                    </span>
                    {LABELS[s.value] ?? s.value}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
};

export default SettingsDrawer;
