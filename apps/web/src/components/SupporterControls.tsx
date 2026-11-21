import { useState } from 'react';
import { useQueryClient } from 'react-query';
import { openPortal, setShowOnWall, type Membership } from '@/apis/support';

const date = (iso?: string) => (iso ? new Date(iso).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' }) : '');

/** For supporters: renewal date, the supporters-list toggle, and Stripe's billing portal. */
const SupporterControls = ({ membership: m }: { membership: Membership }) => {
  const qc = useQueryClient();
  const [busy, setBusy] = useState<'' | 'wall' | 'portal'>('');
  const [error, setError] = useState('');

  const toggleWall = async () => {
    setBusy('wall');
    setError('');
    try {
      await setShowOnWall(!m.showOnWall);
      await qc.invalidateQueries('support');
      await qc.invalidateQueries('supporters');
    } catch {
      setError("Couldn't save that. Try again.");
    } finally {
      setBusy('');
    }
  };

  const manage = async () => {
    setBusy('portal');
    setError('');
    try {
      window.location.assign(await openPortal());
    } catch {
      setError("Couldn't open billing. Try again.");
      setBusy('');
    }
  };

  return (
    <div className="space-y-3 text-sm">
      {m.active && (
        <p className="text-fg-muted">
          {m.pastDue
            ? "Your last payment didn't go through. Update your card to keep your perks."
            : m.renews
              ? `${m.plan === 'yearly' ? 'Yearly' : 'Monthly'}, renews ${date(m.until)}.`
              : `Cancelled. Your perks last until ${date(m.until)}.`}
        </p>
      )}
      {m.active && (
        <label className="flex cursor-pointer items-center justify-between gap-3">
          <span>Show me on the supporters list</span>
          <button
            type="button"
            role="switch"
            aria-checked={m.showOnWall}
            disabled={busy === 'wall'}
            onClick={toggleWall}
            className={`relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-60 ${m.showOnWall ? 'bg-supporter' : 'bg-fg/20'}`}
          >
            <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-[left] ${m.showOnWall ? 'left-[22px]' : 'left-0.5'}`} />
          </button>
        </label>
      )}
      {m.canManage && (
        <button
          type="button"
          onClick={manage}
          disabled={busy === 'portal'}
          className="h-10 w-full rounded-lg border border-line text-sm font-semibold hover:bg-fg/5 disabled:opacity-60"
        >
          {busy === 'portal' ? 'Opening…' : 'Manage membership'}
        </button>
      )}
      {error && (
        <p role="alert" className="text-danger">
          {error}
        </p>
      )}
    </div>
  );
};

export default SupporterControls;
