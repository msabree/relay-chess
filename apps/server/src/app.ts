import { createServer as createHttpServer } from 'node:http';
import { Server } from 'socket.io';
import type { Config } from './config';
import { createHttpApp } from './http';
import { attachRealtime, type IO } from './realtime/socket';
import type { Store } from './store/types';

/** HTTP API and socket.io on one port. */
export function createServer(config: Config, store: Store, opts: { abandonMs?: number; flushMs?: number } = {}) {
  let realtime: ReturnType<typeof attachRealtime> | undefined;
  const app = createHttpApp({ config, store, liveGames: () => realtime?.rooms.liveGames() ?? [] });
  const http = createHttpServer(app);
  const io: IO = new Server(http, { cors: { origin: config.CORS_ORIGINS } });
  realtime = attachRealtime(io, { config, store, ...opts });

  return {
    http,
    io,
    ...realtime,
    async close() {
      realtime?.close();
      await new Promise<void>((resolve) => io.close(() => resolve()));
      await store.close();
    },
  };
}
