import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import { getProfile, updateSocials } from '@/apis/players';

/** Paste a handle or a profile URL; keep just the handle. */
const toHandle = (v: string) =>
  v
    .trim()
    .replace(/^https?:\/\/(www\.)?(x\.com|twitter\.com|instagram\.com)\//i, '')
    .replace(/^@/, '')
    .replace(/[/?#].*$/, '');

/** X and Instagram handles on your profile. Accounts only. */
const SocialsForm = ({ playerId }: { playerId: string }) => {
  const qc = useQueryClient();
  const profile = useQuery(['profile', playerId], () => getProfile(playerId), { retry: false });
  const [x, setX] = useState('');
  const [ig, setIg] = useState('');
  const [state, setState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  useEffect(() => {
    setX(profile.data?.player.x ?? '');
    setIg(profile.data?.player.instagram ?? '');
  }, [profile.data?.player.x, profile.data?.player.instagram]);

  const field = 'h-10 min-w-0 flex-1 rounded-r-lg border border-line bg-bg px-3 text-sm focus:border-accent focus:outline-none';
  const at = 'flex h-10 items-center rounded-l-lg border border-r-0 border-line bg-raised px-3 text-sm text-fg-muted';

  return (
    <form
      aria-labelledby="socials-title"
      onSubmit={async (e) => {
        e.preventDefault();
        setState('saving');
        try {
          await updateSocials({ x: toHandle(x), instagram: toHandle(ig) });
          await qc.invalidateQueries(['profile', playerId]);
          setState('saved');
        } catch {
          setState('error');
        }
      }}
    >
      <h3 id="socials-title" className="text-sm font-semibold">
        Socials <span className="font-normal text-fg-subtle">optional</span>
      </h3>
      <p className="mt-1 text-sm text-fg-muted">Shown on your profile.</p>
      <label htmlFor="social-x" className="mt-3 block text-xs text-fg-muted">
        X
      </label>
      <div className="mt-1 flex">
        <span className={at}>@</span>
        <input id="social-x" value={x} maxLength={60} placeholder="handle" onChange={(e) => (setX(e.target.value), setState('idle'))} className={field} />
      </div>
      <label htmlFor="social-ig" className="mt-3 block text-xs text-fg-muted">
        Instagram
      </label>
      <div className="mt-1 flex">
        <span className={at}>@</span>
        <input id="social-ig" value={ig} maxLength={60} placeholder="handle" onChange={(e) => (setIg(e.target.value), setState('idle'))} className={field} />
      </div>
      <div className="mt-3 flex items-center gap-3">
        <button type="submit" disabled={state === 'saving'} className="h-10 rounded-lg bg-accent px-4 text-sm font-semibold text-accent-fg hover:bg-accent/90 disabled:opacity-50">
          {state === 'saving' ? 'Saving' : 'Save'}
        </button>
        {state === 'saved' && <span className="text-xs text-success">Saved.</span>}
        {state === 'error' && (
          <span role="alert" className="text-xs text-danger">
            That doesn&apos;t look like a handle.
          </span>
        )}
      </div>
    </form>
  );
};

export default SocialsForm;
