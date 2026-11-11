import { useState } from 'react';
import type { Color } from '@relay-chess/game';
import { shareText } from '@/lib/result';

const small =
  'flex h-10 flex-1 items-center justify-center rounded-lg border border-line text-sm font-medium hover:bg-fg/5 transition-colors';

/**
 * Share a finished game. Phones get the native share sheet; desktop gets
 * copy link, X and WhatsApp. Links go to the permanent review page.
 */
export default function ShareResult({
  winner,
  reason,
  plies,
  roomId,
  me,
}: {
  winner: Color | null | undefined;
  reason: string;
  plies: number;
  roomId: string;
  me: Color | null;
}) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const url = `${window.location.origin}/analysis/${roomId}`;
  const text = shareText({ winner, reason, plies, me });

  const share = async () => {
    if (navigator.share && window.matchMedia('(pointer: coarse)').matches) {
      try {
        await navigator.share({ title: 'Relay Chess', text, url });
        return;
      } catch (e) {
        if ((e as Error).name === 'AbortError') return;
      }
    }
    setOpen((o) => !o);
  };

  const copy = () =>
    navigator.clipboard?.writeText(`${text} ${url}`).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });

  const enc = encodeURIComponent;
  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={share}
        className="h-11 w-full rounded-lg border border-line text-sm font-medium hover:bg-fg/5 transition-colors"
      >
        Share result
      </button>
      {open && (
        <div className="flex gap-2">
          <button type="button" onClick={copy} className={small}>
            {copied ? 'Copied' : 'Copy link'}
          </button>
          <a className={small} target="_blank" rel="noreferrer" href={`https://x.com/intent/post?text=${enc(text)}&url=${enc(url)}`}>
            X
          </a>
          <a className={small} target="_blank" rel="noreferrer" href={`https://wa.me/?text=${enc(`${text} ${url}`)}`}>
            WhatsApp
          </a>
        </div>
      )}
    </div>
  );
}
