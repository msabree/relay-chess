import { api } from './http';
import { setPlayer, type Me } from '@/lib/auth';
import { queryClient } from '@/lib/queryClient';

/** Change your nickname. Fails with 409 if an account holds that name. Also settles a new account's name. */
export const renamePlayer = async (username: string) => {
  const res = await api.patch<{ user: Me; token: string }>('/me', { username });
  setPlayer(res.data.token, { ...res.data.user, needsName: false });
  // profiles and the leaderboard show the old name until refetched
  void queryClient.invalidateQueries('profile');
  void queryClient.invalidateQueries('leaderboard');
  return res.data.user;
};

/** Is this username free? Your own name counts as free. */
export const checkName = (name: string) =>
  api.get<{ available: boolean; reason?: 'taken' | 'invalid' }>('/names/available', { params: { name } }).then((r) => r.data);

export type ContactChallenge = { token: string; question: string };
export const getContactChallenge = () => api.get<ContactChallenge>('/contact/challenge').then((r) => r.data);

/** `website` is the hidden field only bots fill in; people always send ''. */
export const contactUs = (
  fields: { name: string; email: string; message: string },
  captcha: { token: string; answer: string },
  website: string,
) => api.post('/contact', { ...fields, captcha, website });
