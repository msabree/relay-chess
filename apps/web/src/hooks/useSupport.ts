import { useQuery } from 'react-query';
import { getSupport } from '@/apis/support';
import { useUser } from '@/hooks/useUser';

/** Supporter status for the current player. Live from the server, not the cached token. */
export const useSupport = () => {
  const user = useUser();
  const id = user.data?._id;
  return useQuery(['support', id ?? ''], getSupport, { enabled: !!id, staleTime: 5 * 60_000, refetchOnWindowFocus: false });
};

/** Are you an active supporter right now? */
export const useIsSupporter = () => !!useSupport().data?.membership?.active;
