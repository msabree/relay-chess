import axios from 'axios';
import { api } from './http';

export const searchUsernames = (query: string) => api.get('/users/search', { params: { q: query } });

export const getLiChessRating = (username: string) => {
  return axios.get(`https://lichess.org/api/user/${username}`);
};

export const getChessComStats= (username: string) => {
  return axios.get(`https://api.chess.com/pub/player/${username}/stats`);
};