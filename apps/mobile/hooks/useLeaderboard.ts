import { getLeaderboard, getUserPosition } from '@/apis/stats';
import type { Leaderboard, UserPosition } from '@/types/types';
import { useQuery } from '@tanstack/react-query';

export type Period = 'daily' | 'weekly';

const empty = (period: Period): Leaderboard => ({ rows: [], total: 0, page: 0, period, resetsAt: '' });

export const useLeaderboard = (page: number, pageSize: number, period: Period) =>
  useQuery({
    queryKey: ['leaderboard', page, pageSize, period],
    queryFn: () =>
      getLeaderboard(page, pageSize, period)
        .then((res) => (res.data as Leaderboard) ?? empty(period))
        .catch(() => empty(period)),
  });

/** Your rank, if you're on the board. */
export const useUserPosition = (userId: string | undefined, period: Period) =>
  useQuery({
    queryKey: ['userPosition', userId, period],
    queryFn: () => getUserPosition(userId!, period).then((res) => res.data as UserPosition),
    enabled: !!userId,
    retry: false,
  });
