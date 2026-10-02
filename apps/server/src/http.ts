import cors from 'cors';
import express, { type NextFunction, type Request, type RequestHandler, type Response } from 'express';
import { z } from 'zod';
import { bearer, cleanNickname, newGuest, NICKNAME, signAccessToken, verifyAccessToken, type Identity } from './auth';
import type { Config } from './config';
import { leaderboardPage, leaderboardPosition, PERIODS } from './leaderboard';
import type { Store } from './store/types';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      who?: Identity;
    }
  }
}

const me = (who: Identity) => ({ id: who.id, username: who.name });

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

  const contactLimit = limiter(5, 60 * 60_000);
  const playerLimit = limiter(30, 60_000);

  app.get('/health', (_req, res) => res.json({ ok: true, store: store.kind }));

  // ---- players (no accounts: a token is your identity) ----

  /** A new player with a random nickname. */
  app.post('/players', (req, res) => {
    if (!playerLimit(req.ip ?? '')) return res.status(429).json({ error: 'rate-limited' });
    const who = newGuest();
    res.json({ token: signAccessToken(config.AUTH_SECRET, who), user: me(who) });
  });

  app.get('/me', requireAuth, (req, res) => res.json({ user: me(req.who!) }));

  /** Change your nickname. Names aren't reserved; you get a fresh token with the new name. */
  app.patch('/me', requireAuth, (req, res) => {
    const body = z.object({ username: z.string().max(40) }).strict().safeParse(req.body);
    const name = body.success ? cleanNickname(body.data.username) : '';
    if (!NICKNAME.test(name)) return res.status(400).json({ error: 'invalid-name' });
    const who: Identity = { ...req.who!, name };
    res.json({ token: signAccessToken(config.AUTH_SECRET, who), user: me(who) });
  });

  // ---- games ----

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

  // ---- leaderboard (today / this week) ----

  const period = z.enum(PERIODS as [string, ...string[]]).default('daily');

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
