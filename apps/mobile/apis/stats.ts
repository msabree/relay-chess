import { api } from './http';

export const getStats = () => api.get<{ gamesPlayed: number }>('/stats');

export const getLeaderboard = (page: number, pageSize: number, period: string) =>
  api.get('/leaderboard', { params: { page, pageSize, period } });

export const getUserPosition = (userId: string, period: string) =>
  api.get('/leaderboard/position', { params: { userId, period } });
