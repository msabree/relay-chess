import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useRouter } from 'next/router';
import CompactTimerSelection from '@/components/CompactTimerSelection';
import { Button } from '@/components/ui/button';
import dynamic from 'next/dynamic';
import { TIMER_OPTIONS } from '@/constants';
import useCreatePrivateGame from '@/hooks/useCreatePrivateGame';

const Clock = dynamic(() => import('lucide-react').then(mod => mod.Clock), { ssr: false });
const Users = dynamic(() => import('lucide-react').then(mod => mod.Users), { ssr: false });
const Sparkles = dynamic(() => import('lucide-react').then(mod => mod.Sparkles), { ssr: false });

interface CreatePrivateGameProps {
  open: boolean;
  onClose: () => void;
}

export default function CreatePrivateGame({ open, onClose }: CreatePrivateGameProps) {
  const [selectedTimer, setSelectedTimer] = useState(TIMER_OPTIONS[0].time);
  const [createGameStarted, setCreateGameStarted] = useState(false);
  const router = useRouter();
  const { gameRoomId } = useCreatePrivateGame({ enabled: open && createGameStarted, selectedTimer });

  useEffect(() => {
    if (gameRoomId !== undefined) {
      setTimeout(() => {
        router.push(`/games/${gameRoomId}`);
      }, 300);
    }
  }, [gameRoomId, router, createGameStarted]);

  const handleCreateGame = () => {
    setCreateGameStarted(true);
  };

  return (
    <Dialog open={open} onOpenChange={() => {
      setCreateGameStarted(false);
      setSelectedTimer(TIMER_OPTIONS[0].time);
      onClose();
    }}>
      <DialogContent className='glass-effect border border-line backdrop-blur-xl max-w-md'>
        <DialogHeader>
          <DialogTitle className='text-center text-3xl font-bold text-gradient'>
            Create Private Game
          </DialogTitle>
        </DialogHeader>

        <div className='space-y-6 py-6'>
          {gameRoomId ? (
            <div className='text-center space-y-4'>
              <div className='flex justify-center'>
                <div className='w-16 h-16 rounded-full glass-effect border-2 border-accent/50 flex items-center justify-center'>
                  <Sparkles className='w-8 h-8 text-accent-ink animate-pulse' />
                </div>
              </div>
              <div className='text-lg font-semibold text-fg'>Game Created!</div>
              <div className='text-sm text-fg-muted'>Redirecting to your game...</div>
            </div>
          ) : (
            <>
              <div className='text-center space-y-2'>
                <p className='text-fg-muted text-sm leading-relaxed'>
                  Select your time control and create a private game. Once your game is ready, you will be redirected to the game.
                </p>
              </div>

              <div className='glass-effect border border-line rounded-xl p-4 space-y-3'>
                <div className='flex items-center gap-2 text-accent-ink mb-3'>
                  <Clock className='w-5 h-5' />
                  <span className='font-semibold text-sm'>Time Control</span>
                </div>
                <CompactTimerSelection 
                  selectedTimer={selectedTimer}
                  onTimerChange={setSelectedTimer}
                />
              </div>

              {!createGameStarted && (
                <Button 
                  className='w-full bg-accent hover:bg-accent/90 text-accent-fg font-semibold py-6 rounded-lg transition-all duration-300 flex items-center justify-center gap-2'
                  onClick={handleCreateGame}
                >
                  <Users className='w-5 h-5' />
                  Create Private Game
                </Button>
              )}

              {createGameStarted && !gameRoomId && (
                <div className='text-center py-6 space-y-3'>
                  <div className='flex justify-center gap-2'>
                    <div className='w-3 h-3 bg-accent rounded-full animate-bounce' style={{ animationDelay: '0ms' }}></div>
                    <div className='w-3 h-3 bg-accent rounded-full animate-bounce' style={{ animationDelay: '150ms' }}></div>
                    <div className='w-3 h-3 bg-accent rounded-full animate-bounce' style={{ animationDelay: '300ms' }}></div>
                  </div>
                  <div className='text-sm text-fg-muted'>Creating your game...</div>
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
} 