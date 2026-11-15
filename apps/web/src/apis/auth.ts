import { api } from './http';
import { setPlayer, type Me } from '@/lib/auth';

/** Change your nickname. Fails with 409 if an account holds that name. */
export const renamePlayer = async (username: string) => {
  const res = await api.patch<{ user: Me; token: string }>('/me', { username });
  setPlayer(res.data.token, res.data.user);
  return res.data.user;
};

export const contactUs = (name: string, email: string, message: string) => api.post('/contact', { name, email, message });
