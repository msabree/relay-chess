import axios from 'axios';
import { CHESS_SERVER_API } from '@/constants';
import { ErrorInfo } from 'react';

export const updateUser = (key: string, value: string, id: string) => {
  return axios.patch(`${CHESS_SERVER_API}/auth/user`, {
    key,
    value,
    id
  });
};

export const getUser = (email: string) => {
  return axios.get(`${CHESS_SERVER_API}/auth/user?email=${email}`);
};

export const contactUs = (name: string, email: string, message: string) => {
  return axios.post(`${CHESS_SERVER_API}/auth/contact`, {
    name,
    email,
    message
  });
};

export const logCrashError = (page: string, error: Error, info: ErrorInfo, userId: string) => {
  return axios.post(`${CHESS_SERVER_API}/auth/log-crash-error`, {
    page,
    error: error.message,
    stack: error.stack?.toString() ?? '',
    info,
    userId
  });
};