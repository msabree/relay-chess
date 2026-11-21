import { SERVER_URL } from '@/constants';

/**
 * Your player identity. Everyone starts as a guest: the server hands out a
 * random id and nickname, and the browser keeps the token for 30 days.
 * Signing in with an email code adds an account session, which keeps your id
 * and reserves your name; the game itself still runs on the player token.
 */
export interface Me {
  id: string;
  username: string;
  /** set when signed in */
  email?: string;
  verified?: boolean;
  /** a new account that hasn't chosen its username yet */
  needsName?: boolean;
}
interface Stored {
  token: string;
  user: Me;
  /** account session (Better Auth), when signed in */
  session?: string;
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

/**
 * Mirror "signed in" onto <html data-signed-in>, so the page can hide the
 * landing page before React renders (see _document).
 */
const markSignedIn = (on: boolean) => {
  if (typeof document === 'undefined') return;
  if (on) document.documentElement.dataset.signedIn = '';
  else delete document.documentElement.dataset.signedIn;
};

const write = (s: Stored) => {
  const changed = s.token !== cache?.token;
  cache = s;
  markSignedIn(!!s.session);
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

const post = (path: string, body: unknown, bearer?: string) =>
  fetch(`${SERVER_URL}${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...(bearer ? { authorization: `Bearer ${bearer}` } : {}) },
    body: JSON.stringify(body),
  });

/** Swap an account session for a player token. Null if the session is gone. */
async function accountPlayer(session: string, guestToken?: string): Promise<Stored | null> {
  const res = await post('/account/session', { guestToken }, session);
  if (res.status === 401) return null;
  if (!res.ok) throw new Error(`could not load your account (${res.status})`);
  const { token, user } = (await res.json()) as Omit<Stored, 'session'>;
  return { token, user, session };
}

/** Make sure we hold a valid player token, asking the server for one if needed. */
export async function ensurePlayer(): Promise<Stored> {
  const current = read();
  if (current && !expired(current.token)) return current;
  if (inflight) return inflight;
  inflight = (async () => {
    // Signed in: renew from the account, so you stay the same player.
    const renewed = current?.session ? await accountPlayer(current.session) : null;
    if (renewed) return (write(renewed), renewed);
    const res = await fetch(`${SERVER_URL}/players`, { method: 'POST' });
    if (!res.ok) throw new Error(`could not start a player session (${res.status})`);
    const s = (await res.json()) as Stored;
    write(s);
    return s;
  })().finally(() => (inflight = null));
  return inflight;
}

/**
 * Email a sign-in code (the email also has a link to /signin).
 */
export async function sendSignInCode(email: string) {
  const res = await post('/api/auth/email-otp/send-verification-otp', { email, type: 'sign-in' });
  if (!res.ok) throw new Error(res.status === 429 ? 'rate-limited' : 'send-failed');
}

/**
 * Sign in with the emailed code. The first time, the account takes over the
 * guest you've been playing as (same id, name and scores).
 */
export async function signInWithCode(email: string, code: string): Promise<Me> {
  const res = await post('/api/auth/sign-in/email-otp', { email, otp: code });
  const session = res.headers.get('set-auth-token');
  if (!res.ok || !session) throw new Error(res.status === 429 ? 'rate-limited' : 'bad-code');
  const s = await accountPlayer(session, read()?.token);
  if (!s) throw new Error('bad-code');
  write(s);
  return s.user;
}

/** Forget this player and continue as a new guest. */
async function startOver() {
  cache = null;
  markSignedIn(false);
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* storage disabled */
  }
  await ensurePlayer();
}

/**
 * Sign out and continue as a new guest.
 */
export async function signOut() {
  const session = read()?.session;
  if (session) await post('/api/auth/sign-out', {}, session).catch(() => {});
  await startOver();
}

/**
 * Delete the account. The profile and name go away; past games stay in the
 * records but no longer belong to anyone. Continues as a new guest.
 */
export async function deleteAccount() {
  const session = read()?.session;
  if (!session) throw new Error('not-signed-in');
  const res = await fetch(`${SERVER_URL}/account`, { method: 'DELETE', headers: { authorization: `Bearer ${session}` } });
  if (!res.ok) throw new Error('delete-failed');
  await startOver();
}

/**
 * The server stopped accepting this token (its account was deleted on another
 * device, or the token is otherwise dead): start over as a new guest. Only
 * acts if the rejected token is still the one we hold.
 */
export async function tokenRejected(token: string | null) {
  if (token && read()?.token === token) await startOver();
}

export const getToken = () => read()?.token ?? null;

/** After a rename the server returns a fresh token with the new name. */
export const setPlayer = (token: string, user: Me) => {
  const cur = read();
  write({ ...cur, token, user: { ...cur?.user, ...user } });
};

/** Called when the token changes (new player, rename). */
export function onAuthChange(fn: () => void) {
  listeners.add(fn);
  return () => void listeners.delete(fn);
}
