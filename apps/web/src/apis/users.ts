import axios from 'axios';
import { CHESS_SERVER_API } from '@/constants';

export const searchUsernames = (query: string) => {
  return axios.get(`${CHESS_SERVER_API}/users/search?q=${query}`);
};

export const getLiChessRating = (username: string) => {
  return axios.get(`https://lichess.org/api/user/${username}`);
};

export const getChessComStats= (username: string) => {
  return axios.get(`https://api.chess.com/pub/player/${username}/stats`);
};