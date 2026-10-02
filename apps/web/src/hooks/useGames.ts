import { useQuery } from 'react-query';
import { getGames } from '../apis/games';
import { APIError, GameData } from '@/types';

export const useGames = (userId: string) => {
  return useQuery<GameData[], APIError>(['games', userId], () => {
    return getGames(userId).then((res) => {
      return res.data?.games ?? undefined as any;
    }).catch((err) => {
      console.log(err);
      return undefined;
    });
  });
};