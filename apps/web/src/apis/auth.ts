import { api } from './http';
import { updateAuth, type Me } from '@/lib/auth';

/** Update your own profile. `key` is 'username' or 'boardColor'. */
export const updateUser = async (key: 'username' | 'boardColor', value: string) => {
  const res = await api.patch<{ user: Me; token: string }>('/me', { [key]: value });
  updateAuth(res.data.token, res.data.user);
  return res;
};

export const contactUs = (name: string, email: string, message: string) => api.post('/contact', { name, email, message });
