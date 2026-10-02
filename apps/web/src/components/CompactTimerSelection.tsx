import React from 'react';
import { TIMER_OPTIONS } from '@/constants';
import dynamic from 'next/dynamic';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getTimerLabel } from '@/components/TimerSelection';
import useOnlineStats from '@/hooks/useOnlineStats';

const Users = dynamic(() => import('lucide-react').then(mod => mod.Users), { ssr: false });

interface CompactTimerSelectionProps {
  selectedTimer: string;
  onTimerChange: (_timer: string) => void;
}

const CompactTimerSelection = ({ selectedTimer, onTimerChange }: CompactTimerSelectionProps) => {
  const { getQueueCount } = useOnlineStats();
  return (
    <div className='space-y-2'>
      <Select value={selectedTimer} onValueChange={onTimerChange}>
        <SelectTrigger className='w-full glass-effect border border-white/10 text-white focus:border-cyan-400/50 focus:ring-cyan-400/50 hover:border-cyan-400/30 transition-colors'>
          <SelectValue placeholder={"Select time control"} />
        </SelectTrigger>
        <SelectContent className='glass-effect border border-white/10 backdrop-blur-xl'>
          {TIMER_OPTIONS.map((option) => {
            const queueCount = getQueueCount(option.time);
            const label = getTimerLabel(option.time, "No Timer");
            return (
              <SelectItem 
                key={option.time} 
                value={option.time}
                className='text-white hover:bg-white/10 focus:bg-white/10'
              >
                <div className='flex items-center justify-between w-full'>
                  <span>{label} - {(option.typeKey === 'blitz' ? 'Blitz' : option.typeKey === 'rapid' ? 'Rapid' : 'Untimed')}</span>
                  {queueCount > 0 && (
                    <span className='flex items-center gap-1 text-xs text-cyan-400 ml-2'>
                      <Users className='w-3 h-3' />
                      {queueCount}
                    </span>
                  )}
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );
};

export default CompactTimerSelection;
