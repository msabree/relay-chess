import type { AddressInfo } from 'node:net';
import type { ClientToServerEvents, RoomSnapshot, ServerToClientEvents } from '@relay-chess/game';
import { io as connect, type Socket } from 'socket.io-client';
import { createServer } from '../src/app';
import { signIdentityToken } from '../src/auth';
import { loadConfig } from '../src/config';
import { createMemoryStore } from '../src/store/memory';

export type Client = Socket<ServerToClientEvents, ClientToServerEvents>;
export const SECRET = 'test-secret-0123456789';

export async function startServer(opts: { abandonMs?: number } = {}) {
  const config = loadConfig({ AUTH_SECRET: SECRET, CORS_ORIGINS: 'http://localhost:3000' });
  const store = createMemoryStore();
  const server = createServer(config, store, { flushMs: 10, ...opts });
  await new Promise<void>((r) => server.http.listen(0, r));
  const url = `http://localhost:${(server.http.address() as AddressInfo).port}`;
  const sockets: Client[] = [];

  const api = async (path: string, init: RequestInit & { token?: string; json?: unknown } = {}) => {
    const headers: Record<string, string> = { 'content-type': 'application/json' };
    if (init.token) headers.authorization = `Bearer ${init.token}`;
    const res = await fetch(url + path, { ...init, headers, body: init.json === undefined ? init.body : JSON.stringify(init.json) });
    return { status: res.status, body: (await res.json()) as any };
  };

  const guest = async () => (await api('/auth/guest', { method: 'POST' })).body as { token: string; user: { id: string; username: string } };
  const account = async (email: string) =>
    (await api('/auth/exchange', { method: 'POST', json: { token: signIdentityToken(SECRET, email) } })).body as {
      token: string;
      user: { id: string; username: string };
    };

  const client = async (token: string): Promise<Client> => {
    const s: Client = connect(url, { auth: { token }, transports: ['websocket'], forceNew: true });
    sockets.push(s);
    await new Promise<void>((resolve, reject) => {
      s.once('connect', () => resolve());
      s.once('connect_error', reject);
    });
    return s;
  };

  /** A connected player: token, user and socket. */
  const player = async (kind: 'guest' | string = 'guest') => {
    const auth = kind === 'guest' ? await guest() : await account(kind);
    return { ...auth, socket: await client(auth.token) };
  };

  return {
    server,
    store,
    url,
    api,
    guest,
    account,
    client,
    player,
    async stop() {
      for (const s of sockets) s.disconnect();
      await server.close();
    },
  };
}

export type Player = Awaited<ReturnType<Awaited<ReturnType<typeof startServer>>['player']>>;

export function next<E extends keyof ServerToClientEvents>(
  s: Client,
  event: E,
  match: (...args: Parameters<ServerToClientEvents[E]>) => boolean = () => true,
  ms = 2000,
): Promise<Parameters<ServerToClientEvents[E]>> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => (s.off(event, h as never), reject(new Error(`timeout waiting for ${event}`))), ms);
    const h = (...args: Parameters<ServerToClientEvents[E]>) => {
      if (!match(...args)) return;
      clearTimeout(t);
      s.off(event, h as never);
      resolve(args);
    };
    s.on(event, h as never);
  });
}

export const nextState = (s: Client, match: (r: RoomSnapshot) => boolean = () => true, ms?: number) =>
  next(s, 'room:state', match, ms).then(([r]) => r);

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
