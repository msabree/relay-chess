import { useContext, useState } from 'react';
import { type Color } from '@relay-chess/game';
import { ChessGameContext } from '@/contexts/ChessGame';
import { TIMER_OPTIONS } from '@/constants';
import { getTimerLabel } from '@/components/TimerSelection';
import { colorName } from './util';

const MAX_PER_TEAM = 4;
const TIMERS = ['1,0', '3,2', ...TIMER_OPTIONS.map((t) => t.time)];

/** Before the first move of a private game: invite, pick sides, pick the clock. */
const RoomSetup = () => {
  const { game, room, userId, teamColor, changeTeam, updateTimer, selectedTimer } = useContext(ChessGameContext);
  const [copied, setCopied] = useState(false);
  if (!game || !room) return null;
  const url = typeof window === 'undefined' ? '' : window.location.href;
  const seated = !!teamColor;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked: the field is selectable */
    }
  };

  const team = (c: Color) => (
    <div className="rounded-xl border border-line p-3">
      <div className="mb-2 flex items-center gap-2">
        <span aria-hidden="true" className={`h-3 w-3 rounded-[3px] ${c === 'w' ? 'bg-white ring-1 ring-ink-300' : 'bg-ink-950 ring-1 ring-ink-500'}`} />
        <h3 className="text-sm font-semibold">{colorName(c)}</h3>
        <span className="text-xs text-fg-subtle">{c === 'w' ? 'moves first' : ''}</span>
      </div>
      <ol className="space-y-1">
        {game.teams[c].map((p, i) => (
          <li key={p.id} className="flex h-8 items-center gap-2 text-sm">
            <span className="w-4 font-mono text-xs text-fg-subtle">{i + 1}</span>
            <span className={`truncate ${p.id === userId ? 'font-semibold' : ''}`}>{p.name}</span>
            {p.id === userId && <span className="shrink-0 rounded bg-accent px-1.5 text-[10px] font-semibold uppercase text-accent-fg">you</span>}
            {!p.connected && <span className="text-xs text-fg-subtle">away</span>}
          </li>
        ))}
        {game.teams[c].length === 0 && <li className="flex h-8 items-center text-sm text-fg-subtle">Open seat</li>}
      </ol>
      {teamColor !== c && game.teams[c].length < MAX_PER_TEAM && (
        <button
          type="button"
          onClick={() => changeTeam(c)}
          className="mt-2 h-9 w-full rounded-lg border border-line text-sm font-medium hover:bg-fg/5"
        >
          {seated ? `Switch to ${colorName(c)}` : `Join ${colorName(c)}`}
        </button>
      )}
    </div>
  );

  return (
    <div className="space-y-5 p-4">
      <div>
        <h2 className="text-base font-semibold">Room setup</h2>
        <p className="mt-1 text-sm leading-relaxed text-fg-muted">
          Share the link and pick sides. Teams can be 1 to 4 players and take turns in the order shown. White&apos;s first move starts the game.
        </p>
      </div>

      <div className="flex gap-2">
        <label htmlFor="invite-link" className="sr-only">Invite link</label>
        <input
          id="invite-link"
          readOnly
          value={url}
          onFocus={(e) => e.currentTarget.select()}
          className="h-10 min-w-0 flex-1 rounded-lg border border-line bg-bg px-3 font-mono text-xs text-fg-muted"
        />
        <button type="button" onClick={copy} className="h-10 shrink-0 rounded-lg bg-accent px-4 text-sm font-semibold text-accent-fg hover:bg-accent/90">
          {copied ? 'Copied' : 'Copy link'}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {team('w')}
        {team('b')}
      </div>
      {seated && (
        <button type="button" onClick={() => changeTeam('spectator')} className="text-sm text-fg-muted underline-offset-4 hover:text-fg hover:underline">
          Just watch instead
        </button>
      )}

      <div>
        <h3 id="tc-label" className="mb-2 text-sm font-semibold">Clock</h3>
        <div role="group" aria-labelledby="tc-label" className="flex flex-wrap gap-1.5">
          {TIMERS.map((t) => {
            const on = selectedTimer === t;
            return (
              <button
                key={t}
                type="button"
                aria-pressed={on}
                disabled={!seated}
                onClick={() => updateTimer(t)}
                className={`h-9 rounded-lg px-3 font-mono text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                  on ? 'bg-fg text-bg' : 'border border-line hover:bg-fg/5'
                }`}
              >
                {getTimerLabel(t, 'None')}
              </button>
            );
          })}
        </div>
        {!seated && <p className="mt-2 text-xs text-fg-subtle">Players pick the clock.</p>}
      </div>

      {room.spectators.length > 0 && (
        <p className="text-xs text-fg-subtle">Watching: {room.spectators.map((s) => (s.id === userId ? 'you' : s.name)).join(', ')}</p>
      )}
    </div>
  );
};

export default RoomSetup;
