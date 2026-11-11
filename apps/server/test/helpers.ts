import type { AddressInfo } from 'node:net';
import { applyPatch, type ClientToServerEvents, type RoomSnapshot, type ServerToClientEvents } from '@relay-chess/game';
import { io as connect, type Socket } from 'socket.io-client';
import { createServer } from '../src/app';
import { loadConfig } from '../src/config';
import { createMemoryStore } from '../src/store/memory';

export type Client = Socket<ServerToClientEvents, ClientToServerEvents>;

/**
 * Each test client keeps its rooms the way the web app does: the full room
 * from room:join (or room:state), then room:patch applied on top. `gaps`
 * counts patches that didn't follow the version the client had.
 */
interface Tracker {
  rooms: Map<string, RoomSnapshot>;
  listeners: Set<(r: RoomSnapshot) => void>;
  gaps: number;
}
const trackers = new WeakMap<Client, Tracker>();

function track(s: Client) {
  const t: Tracker = { rooms: new Map(), listeners: new Set(), gaps: 0 };
  trackers.set(s, t);
  const set = (r: RoomSnapshot) => {
    t.rooms.set(r.id, r);
    for (const l of [...t.listeners]) l(r);
  };
  s.on('room:state', set);
  s.on('room:patch', (p) => {
    const cur = t.rooms.get(p.id);
    if (!cur) return;
    const next = applyPatch(cur, p);
    if (next === null) t.gaps++;
    else if (next !== cur) set(next);
  });
  s.on('chat:message', ({ roomId, message }) => {
    const cur = t.rooms.get(roomId);
    if (cur) set({ ...cur, chat: [...cur.chat, message].slice(-200) });
  });
  const emitWithAck = s.emitWithAck.bind(s) as (...a: unknown[]) => Promise<any>;
  (s as unknown as { emitWithAck: unknown }).emitWithAck = async (event: string, ...args: unknown[]) => {
    const res = await emitWithAck(event, ...args);
    if (event === 'room:join' && res?.ok) t.rooms.set(res.room.id, res.room);
    return res;
  };
}

/** The room as this client sees it now, built from joins and patches. */
export const roomOf = (s: Client, roomId: string) => trackers.get(s)!.rooms.get(roomId);
export const gapsOf = (s: Client) => trackers.get(s)!.gaps;
export const SECRET = 'test-secret-0123456789';

export async function startServer(opts: { abandonMs?: number; lobbyMs?: number } = {}) {
  const config = loadConfig({ AUTH_SECRET: SECRET, CORS_ORIGINS: 'http://localhost:3000' });
  const store = createMemoryStore();
  const server = createServer(config, store, { flushMs: 10, liveFlushMs: 10, ...opts });
  await new Promise<void>((r) => server.http.listen(0, r));
  const url = `http://localhost:${(server.http.address() as AddressInfo).port}`;
  const sockets: Client[] = [];

  const api = async (path: string, init: RequestInit & { token?: string; json?: unknown } = {}) => {
    const headers: Record<string, string> = { 'content-type': 'application/json' };
    if (init.token) headers.authorization = `Bearer ${init.token}`;
    const res = await fetch(url + path, { ...init, headers, body: init.json === undefined ? init.body : JSON.stringify(init.json) });
    return { status: res.status, body: (await res.json()) as any };
  };

  const guest = async () => (await api('/players', { method: 'POST' })).body as { token: string; user: { id: string; username: string } };

  const client = async (token: string): Promise<Client> => {
    const s: Client = connect(url, { auth: { token }, transports: ['websocket'], forceNew: true });
    sockets.push(s);
    track(s);
    await new Promise<void>((resolve, reject) => {
      s.once('connect', () => resolve());
      s.once('connect_error', reject);
    });
    return s;
  };

  /** A connected player: token, user and socket. */
  const player = async () => {
    const auth = await guest();
    return { ...auth, socket: await client(auth.token) };
  };

  return {
    server,
    store,
    url,
    api,
    guest,
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

/** The next room update this client sees (full or patched) that matches. */
export const nextState = (s: Client, match: (r: RoomSnapshot) => boolean = () => true, ms = 2000) =>
  new Promise<RoomSnapshot>((resolve, reject) => {
    const t = trackers.get(s)!;
    const timer = setTimeout(() => (t.listeners.delete(l), reject(new Error('timeout waiting for room update'))), ms);
    const l = (r: RoomSnapshot) => {
      if (!match(r)) return;
      clearTimeout(timer);
      t.listeners.delete(l);
      resolve(r);
    };
    t.listeners.add(l);
  });

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
