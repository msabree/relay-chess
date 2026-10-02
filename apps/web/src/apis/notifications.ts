import axios from 'axios';
import { CHESS_SERVER_API } from '@/constants';

export const getNotifications = (userId: string) => {
  return axios.get(`${CHESS_SERVER_API}/notifications?userId=${userId}`);
};

export const markSeen = (userId?: string) => {
  // should be put with body
  return axios.post(`${CHESS_SERVER_API}/notifications`, {
    userId: userId ?? '',
    seen: true
  });
};

export const deleteNotification = (userId: string, notificationId: string) => {
  return axios.delete(`${CHESS_SERVER_API}/notifications?id=${notificationId}&userId=${userId}`);
};