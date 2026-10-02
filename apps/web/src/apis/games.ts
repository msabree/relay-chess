import axios from 'axios';
import { CHESS_SERVER_API } from '@/constants';
import { Analysis } from '@/types';

export const getGames = (userId: string) => {
  return axios.get(`${CHESS_SERVER_API}/games?userId=${userId}`);
};

export const getGame = (roomId: string) => {
  return axios.get(`${CHESS_SERVER_API}/games/game/${roomId}`);
};

export const saveAnalysis = (roomId: string, analysis: Analysis[]) => {
  return axios.post(`${CHESS_SERVER_API}/games/analysis`, {
    roomId,
    analysis
  });
};

export const getLeaderboard = (page: number, pageSize: number, period: string = 'all-time') => {
  return axios.get(`${CHESS_SERVER_API}/games/stats/leaderboard?page=${page}&pageSize=${pageSize}&period=${period}`);
};

export const getUserPosition = (userId: string, period: string = 'all-time') => {
  return axios.get(`${CHESS_SERVER_API}/games/stats/leaderboard/position?userId=${userId}&period=${period}`);
};