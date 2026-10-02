import axios from 'axios';
import { SERVER_URL } from '@/constants';
import { getToken } from '@/lib/auth';

/** Axios instance for the Relay Chess server; attaches the access token. */
export const api = axios.create({ baseURL: SERVER_URL });
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
