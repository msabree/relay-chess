import { fromServerTimer } from '@/lib/socket';
import { useLobby } from './useLobby';

const useOnlineStats = () => {
  const { stats } = useLobby();
  const matchmakingQueues = (stats?.queues ?? []).map((q) => ({ timer: fromServerTimer(q.timeControl), count: q.count, ready: q.ready }));
  return {
    totalOnline: stats?.online ?? 0,
    matchmakingQueues,
    getQueueCount: (timer: string) => matchmakingQueues.find((q) => q.timer === timer)?.count ?? 0,
    /** players in this queue ready to start a 1v1 now */
    getReadyCount: (timer: string) => matchmakingQueues.find((q) => q.timer === timer)?.ready ?? 0,
  };
};

export default useOnlineStats;
