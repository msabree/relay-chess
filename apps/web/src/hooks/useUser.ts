import { useEffect } from 'react';
import { useQuery } from 'react-query';
import { APIError, UserProfile } from '@/types';
import { ensurePlayer, onAuthChange } from '@/lib/auth';
import { queryClient } from '@/lib/queryClient';

/** The current player (id + nickname). Created on first visit, kept for 30 days. */
export const useUser = () => {
  useEffect(() => onAuthChange(() => queryClient.invalidateQueries('player')), []);
  return useQuery<UserProfile, APIError>(
    'player',
    async () => {
      const { user } = await ensurePlayer();
      return { _id: user.id, username: user.username };
    },
    { refetchOnWindowFocus: false, staleTime: Infinity },
  );
};
