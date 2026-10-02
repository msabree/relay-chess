import { SERVER_URL } from '@/constants';

/**
 * Your player identity. There are no accounts: the server hands out a random
 * id and nickname, and the browser keeps the token for 30 days.
 */
export interface Me {
  id: string;
  username: string;
}
interface Stored {
  token: string;
  user: Me;
}

const KEY = 'relaychess.player';
let cache: Stored | null = null;
let inflight: Promise<Stored> | null = null;
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

const write = (s: Stored) => {
  const changed = s.token !== cache?.token;
  cache = s;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(s));
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

/** Make sure we hold a valid player token, asking the server for one if needed. */
export async function ensurePlayer(): Promise<Stored> {
  const current = read();
  if (current && !expired(current.token)) return current;
  if (inflight) return inflight;
  inflight = fetch(`${SERVER_URL}/players`, { method: 'POST' })
    .then(async (res) => {
      if (!res.ok) throw new Error(`could not start a player session (${res.status})`);
      const s = (await res.json()) as Stored;
      write(s);
      return s;
    })
    .finally(() => (inflight = null));
  return inflight;
}

export const getToken = () => read()?.token ?? null;

/** After a rename the server returns a fresh token with the new name. */
export const setPlayer = (token: string, user: Me) => write({ token, user });

/** Called when the token changes (new player, rename). */
export function onAuthChange(fn: () => void) {
  listeners.add(fn);
  return () => void listeners.delete(fn);
}
