import { useContext, useState } from 'react';
import ReactGA from 'react-ga4';
import { AppContext } from '@/contexts/App';
import TimerSelection from '@/components/TimerSelection';
import { CREATED_PRIVATE_GAME } from '@/constants';

/** The three ways to start a game, shared by the landing page and home. */
const PlayOptions = () => {
  const { setModal } = useContext(AppContext);
  const [code, setCode] = useState('');

  const createRoom = () => {
    setModal({ name: 'CREATING_PRIVATE_GAME' });
    ReactGA.event({ category: CREATED_PRIVATE_GAME, action: 'Created Private Game' });
  };
  const joinTeam = () => code.trim() && setModal({ name: 'INVITE_TEAMMATES', data: { inviteCode: code.trim() } });

  return (
    <div className="grid gap-4 lg:grid-cols-[1.15fr_1fr]">
      {/* Private room: the recommended path */}
      <section className="relative flex flex-col rounded-2xl border border-line bg-surface p-6 sm:p-8">
        <span className="mb-5 inline-flex w-fit items-center gap-2 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-fg">
          Best way to play
        </span>
        <h3 className="text-2xl font-semibold tracking-tight">Private room</h3>
        <p className="mt-2 max-w-md text-fg-muted leading-relaxed">
          Make a room, send the link to your group chat, and everyone picks a side. Two a side is classic, but anywhere
          from 1 to 4 per team works.
        </p>
        <ul className="mt-5 space-y-2 text-sm text-fg-muted">
          <li className="flex gap-2"><Check />No account needed, friends join as guests</li>
          <li className="flex gap-2"><Check />Swap teams and pick the clock before the first move</li>
          <li className="flex gap-2"><Check />Rematch with colors switched in one click</li>
        </ul>
        <div className="mt-auto pt-8">
          <button
            type="button"
            onClick={createRoom}
            className="h-12 w-full sm:w-auto rounded-xl bg-accent px-6 text-base font-semibold text-accent-fg hover:bg-accent/90 transition-colors"
          >
            Create a private room
          </button>
        </div>
      </section>

      <div className="grid gap-4">
        {/* Team queue */}
        <section className="rounded-2xl border border-line bg-surface p-6">
          <h3 className="text-lg font-semibold tracking-tight">Bring a partner</h3>
          <p className="mt-1.5 text-sm text-fg-muted leading-relaxed">
            Team up with a friend, then get matched against another pair.
          </p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={() => setModal({ name: 'INVITE_TEAMMATES' })}
              className="h-11 rounded-lg bg-fg px-4 text-sm font-semibold text-bg hover:bg-fg/85 transition-colors"
            >
              Start a team
            </button>
            <form
              className="flex flex-1 gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                joinTeam();
              }}
            >
              <label htmlFor="team-code" className="sr-only">Team code</label>
              <input
                id="team-code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Have a code?"
                className="h-11 min-w-0 flex-1 rounded-lg border border-line bg-bg px-3 text-sm placeholder:text-fg-subtle focus:border-accent focus:outline-none"
              />
              <button
                type="submit"
                disabled={!code.trim()}
                className="h-11 rounded-lg border border-line px-4 text-sm font-medium hover:bg-fg/5 disabled:opacity-50"
              >
                Join
              </button>
            </form>
          </div>
        </section>

        {/* Public queue */}
        <section className="rounded-2xl border border-line bg-surface p-6">
          <h3 className="text-lg font-semibold tracking-tight">Quick match</h3>
          <p className="mt-1.5 mb-4 text-sm text-fg-muted leading-relaxed">
            Hop in the public queue and we&apos;ll seat you with three others. Some hours it&apos;s quiet, so a private
            room is the sure bet.
          </p>
          <TimerSelection />
        </section>
      </div>
    </div>
  );
};

const Check = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0 text-accent-ink" aria-hidden="true">
    <path d="M5 12l5 5L20 7" />
  </svg>
);

export default PlayOptions;
