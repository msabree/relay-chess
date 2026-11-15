import { useQuery } from 'react-query';
import { getGame } from '../apis/games';
import { APIError, GameData } from '@/types';

export const useGame = (roomId: string) => {
  return useQuery<GameData | undefined, APIError>(['game', roomId], () => {
    if (!roomId) {
      return Promise.resolve(undefined);
    }
    return getGame(roomId).then((res) => {
      return (res.data?.game as GameData | undefined) ?? undefined;
    }).catch((err) => {
      console.log(err);
      return undefined;
    });
  }, {
    enabled: !!roomId, // Only run query if roomId exists
  });
};