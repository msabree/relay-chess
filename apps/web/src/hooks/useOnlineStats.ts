import { fromServerTimer } from '@/lib/socket';
import { useLobby } from './useLobby';

const useOnlineStats = () => {
  const { stats } = useLobby();
  const matchmakingQueues = (stats?.queues ?? []).map((q) => ({ timer: fromServerTimer(q.timeControl), count: q.count }));
  return {
    totalOnline: stats?.online ?? 0,
    /** games in progress, private ones included */
    playingNow: stats?.playing ?? 0,
    matchmakingQueues,
    getQueueCount: (timer: string) => matchmakingQueues.find((q) => q.timer === timer)?.count ?? 0,
  };
};

export default useOnlineStats;
