import { useEffect, useState } from 'react';
import { request, toServerTimer, useSocket } from '@/lib/socket';

interface UseCreatePrivateGameProps {
  enabled: boolean;
  selectedTimer: string;
}

/** Creates a private room once `enabled` turns on. */
const useCreatePrivateGame = ({ enabled, selectedTimer }: UseCreatePrivateGameProps) => {
  const [gameRoomId, setGameRoomId] = useState<string>();
  const { socket, connected } = useSocket();

  useEffect(() => {
    if (!enabled || !connected) return;
    let cancelled = false;
    request<{ roomId: string }>(socket, 'room:create', { timeControl: toServerTimer(selectedTimer) }).then((res) => {
      if (!cancelled && res.ok) setGameRoomId(res.roomId);
    });
    return () => {
      cancelled = true;
    };
  }, [enabled, connected, socket, selectedTimer]);

  return { gameRoomId };
};

export default useCreatePrivateGame;
