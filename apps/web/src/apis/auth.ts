import { api } from './http';
import { setPlayer, type Me } from '@/lib/auth';

/** Change your nickname. Fails with 409 if an account holds that name. */
export const renamePlayer = async (username: string) => {
  const res = await api.patch<{ user: Me; token: string }>('/me', { username });
  setPlayer(res.data.token, res.data.user);
  return res.data.user;
};

export type ContactChallenge = { token: string; question: string };
export const getContactChallenge = () => api.get<ContactChallenge>('/contact/challenge').then((r) => r.data);

/** `website` is the hidden field only bots fill in; people always send ''. */
export const contactUs = (
  fields: { name: string; email: string; message: string },
  captcha: { token: string; answer: string },
  website: string,
) => api.post('/contact', { ...fields, captcha, website });
