import { useQuery } from 'react-query';
import { getLeaderboard, getUserPosition } from '../apis/games';
import { APIError, Leaderboard, UserPosition } from '@/types';

export const useLeaderboard = (page = 0, pageSize = 25, period: string = 'daily') => {
  return useQuery<Leaderboard, APIError>(['leaderboard', page, pageSize, period], () => {
    return getLeaderboard(page, pageSize, period).then((res) => {
      return res.data ?? ({ rows: [], total: 0, page: 0, period, resetsAt: '' }) as unknown as Leaderboard;
    }).catch((err) => {
      console.log(err);
      return ({ rows: [], total: 0, page: 0, period, resetsAt: '' }) as unknown as Leaderboard;
    });
  });
};

export const useUserPosition = (userId: string | undefined, period: string = 'daily') => {
  return useQuery<UserPosition, APIError>(
    ['userPosition', userId, period],
    () => {
      if (!userId) throw new Error('User ID required');
      return getUserPosition(userId, period).then((res) => res.data);
    },
    {
      enabled: !!userId,
    }
  );
};