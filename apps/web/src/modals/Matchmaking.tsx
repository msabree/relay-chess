import { useContext, useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import dynamic from 'next/dynamic';

const Loader2 = dynamic(() => import('lucide-react').then(mod => mod.Loader2), { ssr: false });
const Users = dynamic(() => import('lucide-react').then(mod => mod.Users), { ssr: false });
import { useRouter } from 'next/router';
import { AppContext } from '@/contexts/App';
import useMatchmaking from '@/hooks/useMatchmaking';
import useOnlineStats from '@/hooks/useOnlineStats';
import { getTimerLabel } from '@/components/TimerSelection';

/** How long to wait for a full 2v2 before offering a 1v1. */
const OFFER_1V1_AFTER_MS = 20_000;

interface SoloMatchmakingQueueProps {
  open: boolean;
  onClose: () => void;
  selectedTimer: string;
  isNewGame: boolean;
}

export default function Matchmaking({ open, onClose, selectedTimer, isNewGame }: SoloMatchmakingQueueProps) {
  const [matchFound, setMatchFound] = useState(false);
  const [waitedLong, setWaitedLong] = useState(false);
  const router = useRouter();
  const { setModal } = useContext(AppContext);
  const { newGameRoomId, ready, startNow } = useMatchmaking({ queueType: 'solo', selectedTimer, enabled: open });
  const { getQueueCount, getReadyCount } = useOnlineStats();
  const waiting = getQueueCount(selectedTimer);
  const othersReady = getReadyCount(selectedTimer) - (ready ? 1 : 0);
  const timerLabel = getTimerLabel(selectedTimer, 'No clock');
  const offer1v1 = !matchFound && !ready && (waitedLong || othersReady > 0);

  useEffect(() => {
    setWaitedLong(false);
    if (!open) return;
    const t = setTimeout(() => setWaitedLong(true), OFFER_1V1_AFTER_MS);
    return () => clearTimeout(t);
  }, [open, selectedTimer]);

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

  const openPrivateRoom = () => {
    onClose();
    setModal({ name: 'CREATING_PRIVATE_GAME' });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="glass-effect border border-line shadow-xl max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold text-fg">Quick match</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center py-4 space-y-5">
          <div className="animate-spin">
            <Loader2 className="w-10 h-10 text-accent-ink" />
          </div>

          <div className="text-center space-y-1">
            <div className="text-lg font-semibold text-fg">
              {matchFound ? 'Match found!' : ready ? 'Looking for a 1v1 opponent...' : 'Finding a 2v2...'}
            </div>
            <div className="text-sm text-fg-muted">{timerLabel}</div>
            {waiting > 0 && !matchFound && (
              <div className="flex items-center justify-center gap-2 text-sm text-accent-ink pt-1">
                <Users className="w-4 h-4" />
                <span>{waiting === 1 ? 'Just you in the queue so far' : `${waiting} players waiting`}</span>
              </div>
            )}
          </div>

          {matchFound ? (
            <p className="text-sm text-fg-muted">Taking you to the game...</p>
          ) : (
            <>
              <div className="w-full rounded-xl border border-accent/30 bg-accent/10 p-4 text-left">
                <p className="text-sm font-semibold text-fg">Relay Chess is new and still growing.</p>
                <p className="mt-1 text-sm text-fg-muted leading-relaxed">
                  A full 2v2 needs four players, so public games can take a minute to fill.
                </p>
                {offer1v1 && (
                  <div className="mt-3 space-y-2">
                    <p className="text-sm text-fg">
                      {othersReady > 0
                        ? `${othersReady === 1 ? 'Someone is' : `${othersReady} players are`} ready to play a 1v1 now.`
                        : 'Don\'t want to wait? Start a 1v1 with the next player who\'s up for it.'}
                    </p>
                    <button
                      type="button"
                      onClick={startNow}
                      className="h-10 w-full rounded-lg bg-accent px-4 text-sm font-semibold text-accent-fg hover:bg-accent/90 transition-colors"
                    >
                      Start a 1v1 now
                    </button>
                    <p className="text-xs text-fg-subtle">Or keep waiting for a full 2v2.</p>
                  </div>
                )}
                {ready && (
                  <p className="mt-3 text-sm text-fg">
                    You&apos;re in for a 1v1. It starts as soon as one more player says yes, and a full 2v2 still wins if
                    four of you show up first.
                  </p>
                )}
              </div>

              <div className="w-full text-center text-sm text-fg-muted">
                Fastest way to play:{' '}
                <button type="button" onClick={openPrivateRoom} className="font-semibold text-accent-ink hover:underline">
                  send a room link to a friend
                </button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
