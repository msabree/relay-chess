import { useEffect, useState } from 'react';
import { request, toServerTimer, useSocket } from '@/lib/socket';

interface UseMatchmakingProps {
  /** solo: join the public queue. team: the party host queues (see useInviteTeammates); just wait for a match. */
  queueType: 'solo' | 'team';
  selectedTimer: string;
  enabled: boolean;
  team?: unknown;
}

const useMatchmaking = ({ queueType, selectedTimer, enabled }: UseMatchmakingProps) => {
  const [newGameRoomId, setNewGameRoomId] = useState<string | undefined>(undefined);
  const { socket, connected } = useSocket();

  useEffect(() => {
    if (!socket || !connected || !enabled) return;
    const onMatch = (p: { roomId: string }) => setNewGameRoomId(p.roomId);
    socket.on('match:found', onMatch);
    if (queueType === 'solo') request(socket, 'queue:join', { timeControl: toServerTimer(selectedTimer) });
    return () => {
      socket.off('match:found', onMatch);
      if (queueType === 'solo') request(socket, 'queue:leave');
    };
  }, [socket, connected, enabled, queueType, selectedTimer]);

  return { newGameRoomId };
};

export default useMatchmaking;
