import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import dynamic from 'next/dynamic';

const Loader2 = dynamic(() => import('lucide-react').then(mod => mod.Loader2), { ssr: false });
const Info = dynamic(() => import('lucide-react').then(mod => mod.Info), { ssr: false });
const Users = dynamic(() => import('lucide-react').then(mod => mod.Users), { ssr: false });
import { useRouter } from 'next/router';
import useMatchmaking from '@/hooks/useMatchmaking';
import useOnlineStats from '@/hooks/useOnlineStats';
import { getTimerLabel } from '@/components/TimerSelection';

interface SoloMatchmakingQueueProps {
  open: boolean;
  onClose: () => void;
  selectedTimer: string;
  isNewGame: boolean;
}

export default function Matchmaking({ open, onClose, selectedTimer, isNewGame }: SoloMatchmakingQueueProps) {
  const [matchFound, setMatchFound] = useState(false);
  const router = useRouter();
  const { newGameRoomId } = useMatchmaking({ queueType: 'solo', selectedTimer, enabled: open });
  const { getQueueCount, totalOnline } = useOnlineStats();
  const queueCount = getQueueCount(selectedTimer);
  const timerLabel = getTimerLabel(selectedTimer, "No Timer");

  useEffect(() => {
    if (newGameRoomId) {
      setMatchFound(true);

      setTimeout(() => {
        if (isNewGame) {
          sessionStorage.setItem('contextDirty', 'true');
          window.location.replace(`/games/${newGameRoomId}`);
        } else {
          router.push(`/games/${newGameRoomId}`);
        }
        onClose();
      }, 3000);
    }
  }, [newGameRoomId, onClose, isNewGame, router]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className='glass-effect border border-white/10 shadow-xl max-w-md'>
        <DialogHeader>
          <DialogTitle className='text-center text-2xl font-bold text-white'>
            Matchmaking
          </DialogTitle>
        </DialogHeader>

        <div className='flex flex-col items-center justify-center py-6 space-y-6'>
          <div className='animate-spin'>
            <Loader2 className='w-12 h-12 text-cyan-400' />
          </div>
          
          <div className='text-center space-y-2'>
            <div className='text-lg font-semibold text-white'>
              {matchFound ? "Match found!" : "Searching for players..."}
            </div>
            <div className='text-sm text-gray-400'>
              {`Time Control: ${timerLabel}`}
            </div>
            {queueCount > 0 && (
              <div className='flex items-center justify-center gap-2 text-sm text-cyan-400 mt-2'>
                <Users className='w-4 h-4' />
                <span>{`${queueCount} in queue`}</span>
              </div>
            )}
            {totalOnline > 0 && (
              <div className='text-xs text-gray-500 mt-1'>
                {`${totalOnline} total online`}
              </div>
            )}
          </div>

          {/* New Site Notice */}
          <div className='w-full glass-effect rounded-xl p-4 border border-cyan-400/20'>
            <div className='flex items-start gap-3'>
              <Info className='w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0' />
              <div className='text-left space-y-2'>
                <p className='text-sm font-medium text-white'>Queue may be quiet</p>
                <p className='text-xs text-gray-300 leading-relaxed'>
                  Public matchmaking needs other players online. For a full game, cancel and start a private room or team
                  lobby with friends.
                </p>
              </div>
            </div>
          </div>

          <div className='text-sm text-gray-400 text-center'>
            {matchFound ? "Redirecting to game..." : "This may take a few moments. You can cancel at any time."}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
