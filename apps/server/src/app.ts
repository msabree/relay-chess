import { createServer as createHttpServer } from 'node:http';
import { Server } from 'socket.io';
import { createAccounts, resendMailer, type Mailer } from './accounts';
import { stripeBilling, type Billing } from './billing';
import type { Config } from './config';
import { createHttpApp } from './http';
import { attachRealtime, type IO } from './realtime/socket';
import type { Store } from './store/types';
import { createSupporters } from './supporters';

/** HTTP API and socket.io on one port. */
export function createServer(config: Config, store: Store, opts: { abandonMs?: number; lobbyMs?: number; flushMs?: number; liveFlushMs?: number; mail?: Mailer; billing?: Billing | null; now?: () => number } = {}) {
  const { mail, billing, now, ...timing } = opts;
  // Deleted accounts: their player ids and usernames are retired for good.
  // Loaded once, then kept in step on delete.
  const retired = new Set<string>();
  const retiredNames = new Set<string>();
  store.retiredPlayers().then(
    (ids) => ids.forEach((id) => retired.add(id)),
    (e) => console.error('could not load retired players', e),
  );
  store.retiredNames().then(
    (keys) => keys.forEach((k) => retiredNames.add(k)),
    (e) => console.error('could not load retired names', e),
  );
  const accounts = createAccounts(config, store.db, mail ?? resendMailer(config), (key) => retiredNames.has(key));
  // Supporter memberships (Stripe). Off when the Stripe env vars aren't set.
  const supporters = createSupporters(store, billing === undefined ? stripeBilling(config) : billing, retired, now);
  let realtime: ReturnType<typeof attachRealtime> | undefined;

  const retire = async (ids: string[], username?: string | null) => {
    if (username) {
      await store.retireName(username.toLowerCase());
      retiredNames.add(username.toLowerCase());
    }
    await store.retirePlayers(ids);
    await store.deleteScores(ids);
    for (const id of ids) {
      retired.add(id);
      io.in(`user:${id}`).disconnectSockets(true); // other devices still connected
    }
    await supporters.remove(ids); // ends the membership in Stripe too
  };

  const app = createHttpApp({
    config,
    store,
    accounts,
    retired,
    retire,
    supporters,
    liveGames: () => realtime?.rooms.liveGames() ?? [],
    playing: () => realtime?.rooms.playingCount() ?? 0,
  });
  const http = createHttpServer(app);
  const io: IO = new Server(http, { cors: { origin: config.CORS_ORIGINS } });
  realtime = attachRealtime(io, { config, store, retired, isSupporter: supporters.isSupporter, ...timing });

  return {
    http,
    io,
    accounts,
    supporters,
    ...realtime,
    async close() {
      realtime?.close();
      await new Promise<void>((resolve) => io.close(() => resolve()));
      await store.close();
    },
  };
}
