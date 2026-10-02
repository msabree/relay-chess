import { api } from './http';
import { Analysis } from '@/types';

export const getGame = (roomId: string) => api.get(`/games/${encodeURIComponent(roomId)}`);

export const saveAnalysis = (roomId: string, analysis: Analysis[]) =>
  api.post(`/games/${encodeURIComponent(roomId)}/analysis`, { analysis });

export const getLeaderboard = (page: number, pageSize: number, period: string = 'all-time') =>
  api.get('/leaderboard', { params: { page, pageSize, period } });

export const getUserPosition = (userId: string, period: string = 'all-time') =>
  api.get('/leaderboard/position', { params: { userId, period } });
