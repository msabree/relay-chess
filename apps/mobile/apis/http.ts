import { SERVER_URL } from '@/constants/URLs';
import { getToken } from '@/lib/auth';
import axios from 'axios';

/** Axios instance for the Relay Chess server; attaches the player token. */
export const api = axios.create({ baseURL: SERVER_URL });
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
