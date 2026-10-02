import { useQuery } from 'react-query';
import { APIError, UserProfile } from '@/types';
import { useSession } from 'next-auth/react';
import { getChessComStats, getLiChessRating } from '@/apis/users';
import { api } from '@/apis/http';
import { ensureAuth, updateAuth, type Me } from '@/lib/auth';

/**
 * The current player. Signed-in users get their account; everyone else
 * gets a guest identity from the server (kept across reloads).
 */
export const useUser = () => {
  const { data: session, status } = useSession();
  const email = session?.user?.email ?? null;

  return useQuery<UserProfile, APIError>(
    ['user', email ?? 'guest'],
    async () => {
      const auth = await ensureAuth(email);
      let me: Me = auth.user;
      if (!me.guest) {
        // pick up profile changes made elsewhere
        const res = await api.get<{ user: Me }>('/me');
        me = res.data.user;
        updateAuth(auth.token, me);
      }
      return { _id: me.id, username: me.username, boardColor: me.boardColor ?? '', guest: me.guest };
    },
    { enabled: status !== 'loading', refetchOnWindowFocus: false, staleTime: Infinity },
  );
};

export const useLichessRating = (username: string) => {
  return useQuery<number, APIError>(['lichessRating', username], async () => {
    const res = await getLiChessRating(username);
    return res.data?.rating ?? 0;
  });
};

export const useChessComStats = (username: string) => {
  return useQuery<number, APIError>(['chessComStats', username], async () => {
    const res = await getChessComStats(username);
    return res.data?.stats ?? 0;
  });
};