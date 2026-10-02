import React, { useState } from 'react';
import ReactGA from 'react-ga4';
import { STARTED_SOLO_GAME, TIMER_OPTIONS } from '@/constants';
import Matchmaking from '@/modals/Matchmaking';
import useOnlineStats from '@/hooks/useOnlineStats';

export const getTimerLabel = (time: string, noTimerLabel: string) => {
  if (time === '0,0') return noTimerLabel;
  return `${time.split(',')[0]} + ${time.split(',')[1]}`;
};

/** Time control buttons that put you in the public queue. */
const TimerSelection = (_props: { variant?: 'dark' | 'light' }) => {
  const [selectedTimer, setSelectedTimer] = useState<string | null>(null);
  const { getQueueCount } = useOnlineStats();

  return (
    <>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {TIMER_OPTIONS.map((item) => {
          const waiting = getQueueCount(item.time);
          const label = getTimerLabel(item.time, 'No clock');
          const kind = item.typeKey === 'blitz' ? 'Blitz' : item.typeKey === 'rapid' ? 'Rapid' : 'Casual';
          return (
            <button
              key={item.time}
              type="button"
              onClick={() => {
                setSelectedTimer(item.time);
                ReactGA.event({ category: STARTED_SOLO_GAME, action: `Chose Time Control ${label}` });
              }}
              className="flex h-[76px] flex-col items-center justify-center rounded-lg border border-line bg-bg hover:border-fg/40 transition-colors"
            >
              <span className="font-mono text-base font-semibold">{label}</span>
              <span className="text-xs text-fg-muted">{waiting > 0 ? `${waiting} waiting` : kind}</span>
            </button>
          );
        })}
      </div>
      <Matchmaking open={selectedTimer !== null} onClose={() => setSelectedTimer(null)} selectedTimer={selectedTimer ?? ''} isNewGame />
    </>
  );
};

export default TimerSelection;
