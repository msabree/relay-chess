import { randomBytes } from 'node:crypto';
import cors from 'cors';
import express, { type NextFunction, type Request, type RequestHandler, type Response } from 'express';
import { z } from 'zod';
import { bearer, newGuest, signAccessToken, verifyAccessToken, verifyIdentityToken, type Identity } from './auth';
import type { Config } from './config';
import { leaderboardPage, leaderboardPosition, PERIODS } from './leaderboard';
import type { Store, UserRecord } from './store/types';

export const USERNAME = /^[A-Za-z0-9_-]{3,20}$/;

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      who?: Identity;
    }
  }
}

/** What the client sees about a user. `email` only for yourself. */
export function publicUser(u: UserRecord, self = false) {
  return { id: u.id, username: u.username, boardColor: u.boardColor ?? null, guest: false, ...(self ? { email: u.email } : {}) };
}

const wrap =
  (fn: (req: Request, res: Response) => Promise<unknown>): RequestHandler =>
  (req, res, next) =>
    fn(req, res).catch(next);

/** Tiny fixed-window limiter, per key. Good enough for one process. */
function limiter(max: number, windowMs: number) {
  const hits = new Map<string, { n: number; reset: number }>();
  return (key: string) => {
    const now = Date.now();
    const h = hits.get(key);
    if (!h || h.reset < now) {
      hits.set(key, { n: 1, reset: now + windowMs });
      return true;
    }
    h.n++;
    return h.n <= max;
  };
}

export interface HttpDeps {
  config: Config;
  store: Store;
  liveGames: () => unknown[];
}

export function createHttpApp({ config, store, liveGames }: HttpDeps) {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 1);
  app.use(cors({ origin: config.CORS_ORIGINS }));
  app.use(express.json({ limit: '1mb' }));

  // Identify the caller if a token is present. Routes decide whether it's required.
  app.use((req, _res, next) => {
    const token = bearer(req.headers.authorization);
    if (token) req.who = verifyAccessToken(config.AUTH_SECRET, token) ?? undefined;
    next();
  });
  const requireAuth: RequestHandler = (req, res, next) => (req.who ? next() : res.status(401).json({ error: 'unauthorized' }));
  const requireAccount: RequestHandler = (req, res, next) =>
    !req.who ? res.status(401).json({ error: 'unauthorized' }) : req.who.guest ? res.status(403).json({ error: 'account-required' }) : next();

  const contactLimit = limiter(5, 60 * 60_000);
  const authLimit = limiter(30, 60_000);

  app.get('/health', (_req, res) => res.json({ ok: true, store: store.kind }));

  // ---- auth ----

  app.post('/auth/guest', (req, res) => {
    if (!config.GUEST_LOGIN) return res.status(403).json({ error: 'guest-login-disabled' });
    if (!authLimit(req.ip ?? '')) return res.status(429).json({ error: 'rate-limited' });
    const who = newGuest();
    res.json({ token: signAccessToken(config.AUTH_SECRET, who), user: { id: who.id, username: who.name, guest: true, boardColor: null } });
  });

  app.post(
    '/auth/exchange',
    wrap(async (req, res) => {
      if (!authLimit(req.ip ?? '')) return res.status(429).json({ error: 'rate-limited' });
      const body = z.object({ token: z.string() }).safeParse(req.body);
      const id = body.success ? verifyIdentityToken(config.AUTH_SECRET, body.data.token) : null;
      if (!id) return res.status(401).json({ error: 'invalid-identity' });

      let user = await store.findUserByEmail(id.email);
      if (!user) {
        let username = `player_${randomBytes(3).toString('hex')}`;
        while (await store.findUserByUsername(username)) username = `player_${randomBytes(3).toString('hex')}`;
        user = await store.createUser({ email: id.email, username, createdAt: new Date() });
      }
      const who: Identity = { id: user.id, name: user.username, guest: false };
      res.json({ token: signAccessToken(config.AUTH_SECRET, who), user: publicUser(user, true) });
    }),
  );

  app.get(
    '/me',
    requireAuth,
    wrap(async (req, res) => {
      const who = req.who!;
      if (who.guest) return res.json({ user: { id: who.id, username: who.name, guest: true, boardColor: null } });
      const user = await store.findUserById(who.id);
      if (!user) return res.status(404).json({ error: 'not-found' });
      res.json({ user: publicUser(user, true) });
    }),
  );

  app.patch(
    '/me',
    requireAccount,
    wrap(async (req, res) => {
      const body = z
        .object({ username: z.string().regex(USERNAME).optional(), boardColor: z.string().max(32).optional() })
        .strict()
        .safeParse(req.body);
      if (!body.success) return res.status(400).json({ error: 'invalid-input' });
      const who = req.who!;
      if (body.data.username) {
        const taken = await store.findUserByUsername(body.data.username);
        if (taken && taken.id !== who.id) return res.status(409).json({ error: 'username-taken' });
      }
      const user = await store.updateUser(who.id, body.data);
      if (!user) return res.status(404).json({ error: 'not-found' });
      const token = signAccessToken(config.AUTH_SECRET, { id: user.id, name: user.username, guest: false });
      res.json({ user: publicUser(user, true), token });
    }),
  );

  // ---- users & games ----

  app.get(
    '/users/search',
    wrap(async (req, res) => {
      const q = String(req.query.q ?? '').trim();
      if (q.length < 2 || q.length > 20) return res.json({ users: [] });
      res.json({ users: await store.searchUsers(q, 10) });
    }),
  );

  app.get(
    '/users/:id/games',
    wrap(async (req, res) => {
      res.json({ games: await store.listGames(String(req.params.id), 50) });
    }),
  );

  app.get(
    '/games/:roomId',
    wrap(async (req, res) => {
      const game = await store.getGame(String(req.params.roomId));
      if (!game) return res.status(404).json({ error: 'not-found' });
      res.json({ game });
    }),
  );

  app.post(
    '/games/:roomId/analysis',
    requireAuth,
    wrap(async (req, res) => {
      const body = z.object({ analysis: z.array(z.unknown()).max(1000) }).safeParse(req.body);
      if (!body.success) return res.status(400).json({ error: 'invalid-input' });
      const game = await store.getGame(String(req.params.roomId));
      if (!game) return res.status(404).json({ error: 'not-found' });
      if (!game.userIds.includes(req.who!.id)) return res.status(403).json({ error: 'not-a-player' });
      await store.setAnalysis(game.roomId, body.data.analysis);
      res.json({ ok: true });
    }),
  );

  app.get('/live-games', (_req, res) => res.json({ games: liveGames() }));

  // ---- leaderboard ----

  const period = z.enum(PERIODS as [string, ...string[]]).default('all-time');

  app.get(
    '/leaderboard',
    wrap(async (req, res) => {
      const q = z
        .object({
          period,
          page: z.coerce.number().int().min(0).default(0),
          pageSize: z.coerce.number().int().min(1).max(100).default(25),
        })
        .safeParse(req.query);
      if (!q.success) return res.status(400).json({ error: 'invalid-input' });
      res.json(await leaderboardPage(store, q.data.period as never, q.data.page, q.data.pageSize));
    }),
  );

  app.get(
    '/leaderboard/position',
    wrap(async (req, res) => {
      const q = z.object({ userId: z.string().min(1), period }).safeParse(req.query);
      if (!q.success) return res.status(400).json({ error: 'invalid-input' });
      const pos = await leaderboardPosition(store, q.data.userId, q.data.period as never);
      if (!pos) return res.status(404).json({ error: 'not-ranked' });
      res.json(pos);
    }),
  );

  // ---- contact ----

  app.post(
    '/contact',
    wrap(async (req, res) => {
      if (!contactLimit(req.ip ?? '')) return res.status(429).json({ error: 'rate-limited' });
      const body = z
        .object({
          name: z.string().trim().min(1).max(100),
          email: z.string().trim().email().max(200),
          message: z.string().trim().min(1).max(5000),
        })
        .safeParse(req.body);
      if (!body.success) return res.status(400).json({ error: 'invalid-input' });
      await store.saveContact({ ...body.data, userId: req.who?.id, sentAt: new Date() });
      res.json({ ok: true });
    }),
  );

  app.use((_req, res) => res.status(404).json({ error: 'not-found' }));
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    console.error(err);
    res.status(500).json({ error: 'server-error' });
  });

  return app;
}
