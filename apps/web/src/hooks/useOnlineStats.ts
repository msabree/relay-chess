import { useEffect, useState, useRef } from 'react';
import socketIOClient, { Socket } from 'socket.io-client';
import { CHESS_SERVER_SOCKETS, LOBBY_CONNECTION_TYPE, ONLINE_STATS_UPDATE } from '@/constants';

interface MatchmakingQueue {
  timer: string;
  count: number;
}

interface OnlineStats {
  totalOnline: number;
  matchmakingQueues: MatchmakingQueue[];
}

const useOnlineStats = () => {
  const socketRef = useRef<Socket | null>(null);
  const [stats, setStats] = useState<OnlineStats>({
    totalOnline: 0,
    matchmakingQueues: [
      { timer: '5,3', count: 0 },
      { timer: '10,0', count: 0 },
      { timer: '10,3', count: 0 },
      { timer: '0,0', count: 0 },
    ],
  });

  useEffect(() => {
    // Connect to lobby room to receive online stats
    socketRef.current = socketIOClient(CHESS_SERVER_SOCKETS, {
      query: {
        connectionType: LOBBY_CONNECTION_TYPE,
      },
    });

    // Listen for online stats updates
    socketRef.current.on(ONLINE_STATS_UPDATE, (data: OnlineStats) => {
      setStats(data);
    });

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.off(ONLINE_STATS_UPDATE);
        socketRef.current.disconnect();
      }
    };
  }, []);

  const getQueueCount = (timer: string): number => {
    const queue = stats.matchmakingQueues.find((q) => q.timer === timer);
    return queue?.count ?? 0;
  };

  return {
    totalOnline: stats.totalOnline,
    matchmakingQueues: stats.matchmakingQueues,
    getQueueCount,
  };
};

export default useOnlineStats;

