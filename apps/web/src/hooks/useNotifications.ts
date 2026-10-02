import { useQuery } from 'react-query';
import { getNotifications } from '../apis/notifications';
import { APIError, Notification } from '@/types';

export const useNotifications = (userId: string) => {
  return useQuery<Notification[], APIError>(['notifications', userId], () => {
    return getNotifications(userId).then((res) => {
      return res.data?.notifications ?? [] as Notification[];
    }).catch((err) => {
      console.error(err);
      return [];
    });
  });
};