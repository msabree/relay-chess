import { useContext, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ChessGameContext } from '@/contexts/ChessGame';
import CompactTimerSelection from '@/components/CompactTimerSelection';
import { TIMER_OPTIONS } from '@/constants';

interface GameControlPanelProps {
  open: boolean;
  onClose: () => void;
}

export default function GameControlPanel({open, onClose}: GameControlPanelProps) {
  const { updateTimer } = useContext(ChessGameContext);
  const [selectedTimer, setSelectedTimer] = useState(TIMER_OPTIONS[0].time);

  const handleSave = () => {
    updateTimer(selectedTimer);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className='bg-[#1E2547] border border-[#2A3356] text-white'>
        <DialogHeader>
          <DialogTitle className='text-center text-2xl font-semibold'>
            Timer Settings
          </DialogTitle>
        </DialogHeader>

        <div className='space-y-6 py-4'>
          <div className='[&_*]:text-white [&_*]:border-[#2A3356] [&_*]:bg-[#1E2547]'>
            <CompactTimerSelection 
              selectedTimer={selectedTimer}
              onTimerChange={setSelectedTimer}
            />
          </div>

          <Button 
            className='w-full bg-orange-500 hover:bg-orange-600 text-white'
            onClick={handleSave}
          >
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
