import { createServer as createHttpServer } from 'node:http';
import { Server } from 'socket.io';
import { createAccounts, resendMailer, type Mailer } from './accounts';
import type { Config } from './config';
import { createHttpApp } from './http';
import { attachRealtime, type IO } from './realtime/socket';
import type { Store } from './store/types';

/** HTTP API and socket.io on one port. */
export function createServer(config: Config, store: Store, opts: { abandonMs?: number; lobbyMs?: number; flushMs?: number; liveFlushMs?: number; mail?: Mailer } = {}) {
  const { mail, ...timing } = opts;
  const accounts = createAccounts(config, store.db, mail ?? resendMailer(config));
  let realtime: ReturnType<typeof attachRealtime> | undefined;
  const app = createHttpApp({
    config,
    store,
    accounts,
    liveGames: () => realtime?.rooms.liveGames() ?? [],
    playing: () => realtime?.rooms.playingCount() ?? 0,
  });
  const http = createHttpServer(app);
  const io: IO = new Server(http, { cors: { origin: config.CORS_ORIGINS } });
  realtime = attachRealtime(io, { config, store, ...timing });

  return {
    http,
    io,
    accounts,
    ...realtime,
    async close() {
      realtime?.close();
      await new Promise<void>((resolve) => io.close(() => resolve()));
      await store.close();
    },
  };
}
