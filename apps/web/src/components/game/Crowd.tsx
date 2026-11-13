import { useContext, useEffect, useRef, useState } from 'react';
import { ChessGameContext } from '@/contexts/ChessGame';

const Eye = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

/**
 * Who's watching. Pops when someone new arrives and gets louder as the crowd
 * grows, so playing in front of people feels like it.
 */
export default function Crowd() {
  const { room, userId } = useContext(ChessGameContext);
  const watchers = room?.spectators ?? [];
  const n = room?.spectatorCount ?? 0;
  const prev = useRef(n);
  const [pop, setPop] = useState(false);

  useEffect(() => {
    if (n > prev.current) {
      setPop(true);
      const t = setTimeout(() => setPop(false), 700);
      prev.current = n;
      return () => clearTimeout(t);
    }
    prev.current = n;
  }, [n]);

  if (n === 0) return null;
  const tone = n >= 10 ? 'bg-accent text-accent-fg' : n >= 3 ? 'bg-accent/25 text-fg' : 'bg-raised text-fg-muted';
  const label = n >= 10 ? `Big crowd · ${n} watching` : `${n} watching`;
  // Big crowds only send a sample of names.
  const more = n - watchers.length;
  const names = watchers.map((s) => (s.id === userId ? 'you' : s.name)).join(', ') + (more > 0 ? ` and ${more} more` : '');

  return (
    <span
      title={`Watching: ${names}`}
      aria-label={`${n} ${n === 1 ? 'person' : 'people'} watching: ${names}`}
      className={`inline-flex h-7 items-center gap-1.5 rounded-full px-2.5 text-xs font-semibold transition-colors ${tone} ${pop ? 'animate-crowd-pop' : ''}`}
    >
      <Eye />
      {label}
    </span>
  );
}

/** Players can stop spectators from chatting mid-game, e.g. if they start giving hints. */
export function MuteSpectators() {
  const { room, game, teamColor, setSpectatorsMuted } = useContext(ChessGameContext);
  if (!room || !teamColor || game?.status === 'over') return null;
  if (room.spectators.length === 0 && !room.spectatorsMuted) return null;
  const muted = room.spectatorsMuted;
  return (
    <button
      type="button"
      onClick={() => setSpectatorsMuted(!muted)}
      aria-pressed={muted}
      className={`rounded-md px-2 py-1 text-xs font-medium transition-colors ${muted ? 'bg-fg text-bg' : 'text-fg-muted hover:bg-fg/5 hover:text-fg'}`}
    >
      {muted ? 'Spectators muted' : 'Mute spectators'}
    </button>
  );
}
