import { SERVER_URL } from '@/constants';

/**
 * Session with the Relay Chess server.
 * - Signed in with Google/Apple: /api/token mints a short-lived identity token,
 *   the server exchanges it for an access token tied to the account.
 * - Not signed in: the server hands out a guest token.
 * The access token is kept in localStorage so guests keep their id across reloads.
 */
export interface Me {
  id: string;
  username: string;
  boardColor: string | null;
  guest: boolean;
  email?: string;
}
interface Stored {
  token: string;
  user: Me;
  /** email the token belongs to; null for guests */
  email: string | null;
}

const KEY = 'relaychess.auth';
let cache: Stored | null = null;
let inflight: { email: string | null; promise: Promise<Stored> } | null = null;
const listeners = new Set<() => void>();

const read = (): Stored | null => {
  if (cache) return cache;
  try {
    const raw = typeof window === 'undefined' ? null : window.localStorage.getItem(KEY);
    cache = raw ? (JSON.parse(raw) as Stored) : null;
  } catch {
    cache = null;
  }
  return cache;
};

const write = (s: Stored | null) => {
  const changed = s?.token !== cache?.token;
  cache = s;
  try {
    if (s) window.localStorage.setItem(KEY, JSON.stringify(s));
    else window.localStorage.removeItem(KEY);
  } catch {
    /* storage disabled: memory only */
  }
  if (changed) listeners.forEach((l) => l());
};

const expired = (token: string) => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]!.replace(/-/g, '+').replace(/_/g, '/')));
    return typeof payload.exp !== 'number' || payload.exp * 1000 < Date.now() + 60_000;
  } catch {
    return true;
  }
};

async function post<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${SERVER_URL}${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${path} failed: ${res.status}`);
  return res.json() as Promise<T>;
}

async function login(email: string | null): Promise<Stored> {
  if (email) {
    const idRes = await fetch('/api/token');
    if (!idRes.ok) throw new Error('could not get identity token');
    const { token: identity } = (await idRes.json()) as { token: string };
    const { token, user } = await post<{ token: string; user: Me }>('/auth/exchange', { token: identity });
    return { token, user, email };
  }
  const { token, user } = await post<{ token: string; user: Me }>('/auth/guest');
  return { token, user, email: null };
}

/** Make sure we hold a token for this email (or a guest token when null). */
export async function ensureAuth(email: string | null): Promise<Stored> {
  const current = read();
  if (current && current.email === email && !expired(current.token)) return current;
  if (inflight?.email === email) return inflight.promise;
  const promise = login(email)
    .then((s) => (write(s), s))
    .finally(() => (inflight = null));
  inflight = { email, promise };
  return promise;
}

export const getToken = () => read()?.token ?? null;
export const getMe = () => read()?.user ?? null;

/** After a profile change the server returns a fresh token with the new name. */
export function updateAuth(token: string, user: Me) {
  const current = read();
  write({ token, user, email: current?.email ?? null });
}

export const clearAuth = () => write(null);

/** Called when the token changes (sign in, sign out, rename). */
export function onAuthChange(fn: () => void) {
  listeners.add(fn);
  return () => void listeners.delete(fn);
}
