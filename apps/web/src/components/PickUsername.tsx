import { useEffect, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { isAxiosError } from 'axios';
import { checkName, renamePlayer } from '@/apis/auth';
import { useUser } from '@/hooks/useUser';

const NICKNAME = /^[\p{L}\p{N}_ -]{2,20}$/u;
const clean = (v: string) => v.trim().replace(/\s+/g, ' ');

type Check = 'idle' | 'checking' | 'available' | 'taken' | 'invalid';

/**
 * New accounts choose their username before anything else. It can't be
 * dismissed: keeping the suggested name still counts as choosing it.
 */
const PickUsername = () => {
  const user = useUser();
  const open = !!user.data?.needsName;
  const [name, setName] = useState('');
  const [check, setCheck] = useState<Check>('idle');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) setName(user.data?.username ?? '');
  }, [open, user.data?.username]);

  // Check availability as they type.
  useEffect(() => {
    if (!open) return;
    const n = clean(name);
    if (!NICKNAME.test(n)) return setCheck(n ? 'invalid' : 'idle');
    setCheck('checking');
    const t = setTimeout(() => {
      checkName(n).then(
        (r) => setCheck(r.available ? 'available' : r.reason === 'invalid' ? 'invalid' : 'taken'),
        () => setCheck('idle'),
      );
    }, 300);
    return () => clearTimeout(t);
  }, [name, open]);

  const n = clean(name);
  const ready = check === 'available';

  const hint: Record<Check, { text: string; tone: string }> = {
    idle: { text: '2 to 20 letters, numbers, spaces, _ or -.', tone: 'text-fg-subtle' },
    checking: { text: 'Checking…', tone: 'text-fg-subtle' },
    available: { text: `${n} is yours if you want it.`, tone: 'text-success' },
    taken: { text: 'Someone already has that name. Try another.', tone: 'text-danger' },
    invalid: { text: '2 to 20 letters, numbers, spaces, _ or -.', tone: 'text-danger' },
  };

  return (
    <Dialog.Root open={open}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60" />
        <Dialog.Content
          onEscapeKeyDown={(e) => e.preventDefault()}
          onPointerDownOutside={(e) => e.preventDefault()}
          className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-line bg-surface p-6 shadow-xl"
        >
          <Dialog.Title className="text-xl font-semibold">Pick your username</Dialog.Title>
          <Dialog.Description className="mt-1 text-sm text-fg-muted">
            It&apos;s reserved for you and shows on the leaderboard and in every game.
          </Dialog.Description>
          <form
            className="mt-5"
            onSubmit={async (e) => {
              e.preventDefault();
              if (!ready) return;
              setBusy(true);
              setError('');
              try {
                await renamePlayer(n);
              } catch (err) {
                if (isAxiosError(err) && err.response?.status === 409) setCheck('taken');
                else setError("Couldn't save that. Try again.");
              } finally {
                setBusy(false);
              }
            }}
          >
            <label htmlFor="pick-username" className="sr-only">
              Username
            </label>
            <input
              id="pick-username"
              value={name}
              maxLength={20}
              autoFocus
              autoComplete="off"
              onChange={(e) => (setName(e.target.value), setError(''))}
              className="h-11 w-full rounded-lg border border-line bg-bg px-3 text-base focus:border-accent focus:outline-none"
            />
            <p role="status" className={`mt-2 text-xs ${hint[check].tone}`}>
              {hint[check].text}
            </p>
            {error && (
              <p role="alert" className="mt-1 text-xs text-danger">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={!ready || busy}
              className="mt-5 h-11 w-full rounded-lg bg-accent text-sm font-semibold text-accent-fg hover:bg-accent/90 disabled:opacity-50"
            >
              {busy ? 'Saving' : 'Continue'}
            </button>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default PickUsername;
