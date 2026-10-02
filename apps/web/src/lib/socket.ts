import { useEffect, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import type { Ack, ClientToServerEvents, ServerToClientEvents } from '@relay-chess/game';
import { SERVER_URL } from '@/constants';
import { useUser } from '@/hooks/useUser';
import { getToken, onAuthChange } from './auth';

export type RelaySocket = Socket<ServerToClientEvents, ClientToServerEvents>;

let socket: RelaySocket | null = null;

/** One socket for the whole app, authenticated with the current access token. */
function getSocket(): RelaySocket {
  if (!socket) {
    const s: RelaySocket = io(SERVER_URL, {
      autoConnect: false,
      transports: ['websocket'],
      auth: (cb) => cb({ token: getToken() }),
    });
    // New identity (sign in/out, rename): reconnect so the server sees it.
    onAuthChange(() => {
      if (s.active) s.disconnect().connect();
    });
    socket = s;
  }
  if (!socket.active && getToken()) socket.connect();
  return socket;
}

/** The shared socket once the user (or guest) is authenticated, plus connection state. */
export function useSocket() {
  const user = useUser();
  const sock = user.data ? getSocket() : null;
  const [connected, setConnected] = useState(sock?.connected ?? false);

  useEffect(() => {
    if (!sock) return;
    const up = () => setConnected(true);
    const down = () => setConnected(false);
    sock.on('connect', up);
    sock.on('disconnect', down);
    setConnected(sock.connected);
    return () => {
      sock.off('connect', up);
      sock.off('disconnect', down);
    };
  }, [sock]);

  return { socket: sock, connected, user: user.data };
}

/** Emit and wait for the server's ack. */
export function request<T extends object = object>(
  s: RelaySocket | null,
  event: keyof ClientToServerEvents,
  ...args: unknown[]
): Promise<Ack<T>> {
  if (!s?.connected) return Promise.resolve({ ok: false, error: 'offline' });
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve({ ok: false, error: 'timeout' }), 10_000);
    (s.emit as (...a: unknown[]) => void)(event, ...args, (res: Ack<T>) => {
      clearTimeout(timer);
      resolve(res);
    });
  });
}

/** "5,3" (web) <-> "5+3" (server). "0,0" is untimed. */
export const toServerTimer = (t: string) => (!t || t === '0,0' ? 'untimed' : t.replace(',', '+'));
export const fromServerTimer = (t: string) => (t === 'untimed' ? '0,0' : t.replace('+', ','));
