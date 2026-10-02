import dynamic from 'next/dynamic';
import React, { useContext } from 'react';
import { ChessGameContext } from '@/contexts/ChessGame';

const Infinity = dynamic(() => import('lucide-react').then(mod => mod.Infinity), { ssr: false });

interface TimerProps {
  timer?: string;
  timeRemaining?: string;
}

const Timer = ({timer, timeRemaining} : TimerProps) => {
  const { selectedTimer = '0,0' } = useContext(ChessGameContext);
  const timeLabel = selectedTimer === '0,0' ? null : selectedTimer.replace(',', ':');

  if(timeRemaining){
    return (
      <div className="bg-[#2b3151] text-fg flex justify-center">
        <div className="text-xl">
          {timeRemaining}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#2b3151] text-fg flex justify-center items-center gap-2 py-2">
      <div className="text-3xl">
        {selectedTimer === '0,0' ? (
          <Infinity className="w-7 h-7 text-fg" />
        ) : (
          timer
        )}
      </div>
      {timeLabel && (
        <div className="text-sm text-fg/80">{timeLabel}</div>
      )}
    </div>
  );
};

export default Timer;