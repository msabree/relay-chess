import { ensurePlayer, onAuthChange } from '@/lib/auth';
import type { APIError, UserProfile } from '@/types/types';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

/** The current player (id + nickname). Created on first launch, kept for 30 days. */
export const useUser = () => {
  const queryClient = useQueryClient();
  useEffect(
    () => onAuthChange(() => queryClient.invalidateQueries({ queryKey: ['player'] })),
    [queryClient]
  );
  return useQuery<UserProfile, APIError>({
    queryKey: ['player'],
    queryFn: async () => {
      const { user } = await ensurePlayer();
      return { _id: user.id, username: user.username };
    },
    staleTime: Infinity,
  });
};
