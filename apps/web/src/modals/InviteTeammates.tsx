import { useContext, useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';

const UserPlus = dynamic(() => import('lucide-react').then(mod => mod.UserPlus), { ssr: false });
const Copy = dynamic(() => import('lucide-react').then(mod => mod.Copy), { ssr: false });
const Check = dynamic(() => import('lucide-react').then(mod => mod.Check), { ssr: false });
import CompactTimerSelection from '@/components/CompactTimerSelection';
import useInviteTeammates from '@/hooks/useInviteTeammates';
import { useUser } from '@/hooks/useUser';
import { useRouter } from 'next/router';
import useMatchmaking from '@/hooks/useMatchmaking';
import { AppContext } from '@/contexts/App';
import { formatAnonUsername } from '@/utils/strings';

interface InviteTeammatesProps {
  open: boolean;
  onClose: () => void;
}

export default function InviteTeammates({ open, onClose }: InviteTeammatesProps) {
  const { modal } = useContext(AppContext);
  const router = useRouter();
  const user = useUser();
  const userId = user?.data?._id;
  const [selectedTimer, setSelectedTimer] = useState('5,3');
  const [isCopied, setIsCopied] = useState(false);
  const {teammateLobby, roomId, startTeamMatchmaking, matchmakingStarted} = useInviteTeammates({
    selectedTimer,
    open,
    inviteCode: modal.data?.inviteCode ?? '',
  });

  const hasJoinedTeammates = teammateLobby.filter((teammate) => teammate.userId !== userId).length > 0;
  const isHost = teammateLobby.length === 0 || teammateLobby.find((teammate) => teammate.userId === userId)?.isHost;
  const { newGameRoomId } = useMatchmaking({ queueType: 'team', selectedTimer, enabled: hasJoinedTeammates && matchmakingStarted, team: teammateLobby });

  const handleCancel = () => {
    onClose();
    router.replace('/');
  };

  const handleFindGame = () => {
    startTeamMatchmaking();
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomId);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 5000);
  };

  useEffect(() => {
    if (newGameRoomId) {
      setTimeout(() => {
        router.push(`/games/${newGameRoomId}`);
      }, 3000);
    }
  }, [newGameRoomId, router]);

  return (
    <Dialog open={open} onOpenChange={handleCancel}>
      <DialogContent className='bg-surface border border-line shadow-xl max-w-sm'>
        <DialogHeader>
          <DialogTitle className='text-center text-2xl font-semibold text-fg-muted'>
            {"Teammate Lobby"}
          </DialogTitle>
        </DialogHeader>

        <div className='space-y-6 py-4'>
          <div className='text-center text-fg-muted'>
            {isHost ? "Share the link to invite friends to your team." : "You were invited to join a team. Host will start the game when all players are ready."}
          </div>

          {isHost && <div className='space-y-4'>
            <Button
              variant='outline'
              className='w-full flex items-center justify-center gap-2 text-fg-muted hover:text-gray-900 hover:bg-raised'
              onClick={handleCopyCode}
            >
              {isCopied ? (
                <>
                  <Check className='h-4 w-4 text-success' />
                  <span>{"Copied!"}</span>
                </>
              ) : (
                <>
                  <Copy className='h-4 w-4' />
                  <span>{"Copy Invite Code"}</span>
                </>
              )}
            </Button>

            <div className='mt-2 text-center'>
              <code className='text-sm text-fg-subtle bg-raised px-2 py-1 rounded font-mono'>
                {roomId}
              </code>
            </div>

            <CompactTimerSelection 
              selectedTimer={selectedTimer}
              onTimerChange={setSelectedTimer}
            />
          </div>}

          <div className='space-y-2'>
            {teammateLobby.map((teammate) => (
              <div 
                key={teammate.userId}
                className='flex items-center justify-between p-3 bg-raised rounded-lg border border-line'
              >
                <div className='flex items-center space-x-3'>
                  <div className='w-8 h-8 rounded-full bg-raised flex items-center justify-center'>
                    <UserPlus className='w-4 h-4 text-fg-muted' />
                  </div>
                  <div>
                    <div className='font-medium text-fg-muted'>
                      {formatAnonUsername(teammate.username)}
                      {teammate.userId === userId && (
                        <span className="ml-2 font-bold text-accent-ink bg-accent px-2 py-0.5 rounded">
                          {"(You)"}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {!hasJoinedTeammates && (
            <div className='text-center py-4'>
              <div className='text-fg-muted mb-2'>{"Waiting for teammates to join..."}</div>
              <div className='animate-pulse text-accent-ink'>• • •</div>
            </div>
          )}
          {matchmakingStarted && !newGameRoomId && (
            <div className='text-center py-4'>
              <div className='text-fg-muted mb-2'>{"Finding Game..."}</div>
              <div className='animate-pulse text-accent-ink'>• • •</div>
            </div>
          )}
          {newGameRoomId && (
            <div className='text-center py-4'>
              <div className='text-fg-muted mb-2'>{"Game match created! Redirecting to game..."}</div>
              <div className='animate-pulse text-accent-ink'>• • •</div>
            </div>
          )}
        </div>

        <DialogFooter className='flex justify-between'>
          <Button 
            variant='ghost'
            className='text-fg-muted hover:text-fg-muted hover:bg-raised'
            onClick={handleCancel}
          >
            {"Cancel"}
          </Button>
          {isHost && <Button 
            className='bg-orange-500 hover:bg-orange-600 text-fg font-medium px-6 py-2 rounded-lg transition-all duration-200'
            disabled={!hasJoinedTeammates || matchmakingStarted}
            onClick={handleFindGame}
          >
            {matchmakingStarted && hasJoinedTeammates ? "Finding Game..." : "Find Game"}
          </Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
