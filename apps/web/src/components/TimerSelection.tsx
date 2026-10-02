import React, { useState } from 'react';
import { STARTED_SOLO_GAME, TIMER_OPTIONS } from '@/constants';
import dynamic from 'next/dynamic';
import Matchmaking from '@/modals/Matchmaking';
import ReactGA from 'react-ga4';
import useOnlineStats from '@/hooks/useOnlineStats';

const Play = dynamic(() => import('lucide-react').then(mod => mod.Play), { ssr: false });
const Users = dynamic(() => import('lucide-react').then(mod => mod.Users), { ssr: false });

export const getTimerLabel = (time: string, noTimerLabel: string) => {
  if (time === '0,0') {
    return noTimerLabel;
  }
  return `${time.split(',')[0]} + ${time.split(',')[1]}`;
};

type TimerSelectionProps = {
  variant?: 'dark' | 'light';
};

const TimerSelection = ({ variant = 'dark' }: TimerSelectionProps) => {
  const [selectedTimer, setSelectedTimer] = useState<string | null>(null);
  const { getQueueCount } = useOnlineStats();
  const isLight = variant === 'light';

  return (
    <>
      {isLight && (
        <p className="text-sm text-amber-950 mb-4 border border-amber-200 bg-amber-50 rounded-lg px-4 py-3">
          Public matchmaking depends on other players being online. If the queue is empty, use a private or team game
          instead.
        </p>
      )}
      <div className="grid grid-cols-2 gap-3">
        {TIMER_OPTIONS.map((item) => {
          const queueCount = getQueueCount(item.time);
          const label = getTimerLabel(item.time, 'No Timer');
          const typeLabel = item.typeKey === 'blitz' ? 'Blitz' : item.typeKey === 'rapid' ? 'Rapid' : 'Untimed';
          return (
            <div key={item.time}>
              <button
                type="button"
                onClick={() => {
                  setSelectedTimer(item.time);
                  ReactGA.event({
                    category: STARTED_SOLO_GAME,
                    action: `Chose Time Control ${label}`,
                  });
                }}
                className={
                  isLight
                    ? 'w-full flex flex-col justify-center items-center text-stone-900 h-[130px] cursor-pointer rounded-xl border border-stone-200 bg-white hover:border-stone-400 transition-colors relative'
                    : 'w-full flex flex-col justify-center items-center text-white h-[140px] cursor-pointer glass-effect rounded-xl hover:ring-2 hover:ring-cyan-400/50 transition-all duration-300 relative group hover:scale-105'
                }
              >
                <div className={`text-xl font-semibold mb-1 ${isLight ? '' : 'group-hover:text-cyan-400 transition-colors'}`}>
                  {label}
                </div>
                <div className={`text-sm mb-2 ${isLight ? 'text-stone-600' : 'text-gray-400'}`}>{typeLabel}</div>
                {queueCount > 0 && (
                  <div className={`flex items-center gap-1 text-xs mb-2 ${isLight ? 'text-stone-700' : 'text-cyan-400'}`}>
                    <Users className="w-3 h-3" />
                    <span>{`${queueCount} in queue`}</span>
                  </div>
                )}
                <div className={`absolute bottom-3 flex items-center gap-1 text-xs font-medium ${isLight ? 'text-stone-600' : 'text-gray-500 group-hover:text-cyan-400'}`}>
                  <Play className="w-3 h-3" />
                  Play
                </div>
              </button>
            </div>
          );
        })}
      </div>
      <Matchmaking
        open={selectedTimer !== null}
        onClose={() => setSelectedTimer(null)}
        selectedTimer={selectedTimer ?? ''}
        isNewGame
      />
    </>
  );
};

export default TimerSelection;
