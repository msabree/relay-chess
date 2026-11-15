import cors from 'cors';
import express, { type NextFunction, type Request, type RequestHandler, type Response } from 'express';
import { toNodeHandler } from 'better-auth/node';
import { contactSchema, type Announcement } from '@relay-chess/game';
import { createCaptcha } from './captcha';
import { z } from 'zod';
import { bearer, cleanNickname, newGuest, NICKNAME, signAccessToken, verifyAccessToken, type Identity } from './auth';
import type { Accounts } from './accounts';
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

/** Clean a hand-written banner document; drop it if it's unusable. */
function toAnnouncement(d: { id: string; text?: unknown; link?: unknown; linkText?: unknown; tone?: unknown }): Announcement | null {
  const text = typeof d.text === 'string' ? d.text.trim().slice(0, 200) : '';
  if (!text) return null;
  const link = typeof d.link === 'string' && /^https?:\/\//.test(d.link) ? d.link : undefined;
  const linkText = link && typeof d.linkText === 'string' && d.linkText.trim() ? d.linkText.trim().slice(0, 40) : undefined;
  return { id: d.id, text, ...(link ? { link, linkText: linkText ?? 'Learn more' } : {}), tone: d.tone === 'warning' ? 'warning' : 'info' };
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
  accounts: Accounts;
  liveGames: () => unknown[];
  /** games in progress, private ones included */
  playing: () => number;
}

export function createHttpApp({ config, store, accounts, liveGames, playing }: HttpDeps) {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 1);
  // set-auth-token carries the account session to the browser (bearer, no cookies)
  app.use(cors({ origin: config.CORS_ORIGINS, exposedHeaders: ['set-auth-token'] }));
  // Better Auth reads its own bodies: mount it before express.json
  app.all('/api/auth/*', toNodeHandler(accounts.auth));
  app.use(express.json({ limit: '1mb' }));

  // Identify the caller if a token is present. Routes decide whether it's required.
  app.use((req, _res, next) => {
    const token = bearer(req.headers.authorization);
    if (token) req.who = verifyAccessToken(config.AUTH_SECRET, token) ?? undefined;
    next();
  });
  const requireAuth: RequestHandler = (req, res, next) => (req.who ? next() : res.status(401).json({ error: 'unauthorized' }));

  const contactLimit = limiter(5, 60 * 60_000);
  // Per IP. Generous: a class or club on one Wi-Fi (or a mobile carrier) shares an IP.
  const playerLimit = limiter(300, 60_000);

  // `playing` counts every game in progress (private too): check it's 0 before a deploy.
  app.get('/health', (_req, res) => res.json({ ok: true, store: store.kind, playing: playing() }));

  // ---- players (no accounts: a token is your identity) ----

  /** A new player with a random nickname. */
  app.post('/players', (req, res) => {
    if (!playerLimit(req.ip ?? '')) return res.status(429).json({ error: 'rate-limited' });
    const who = newGuest();
    res.json({ token: signAccessToken(config.AUTH_SECRET, who), user: me(who) });
  });

  /**
   * Swap an account session (Authorization: Bearer <session token>) for a
   * player token. The first time, pass the guest token you were playing with
   * and the account takes over that player (id, name, scores).
   */
  app.post(
    '/account/session',
    wrap(async (req, res) => {
      const user = await accounts.sessionUser(req.headers);
      if (!user) return res.status(401).json({ error: 'unauthorized' });
      const body = z.object({ guestToken: z.string().max(2000).optional() }).safeParse(req.body ?? {});
      const guest = body.success && body.data.guestToken ? verifyAccessToken(config.AUTH_SECRET, body.data.guestToken) : null;
      const who = await accounts.playerFor(user, guest);
      res.json({ token: signAccessToken(config.AUTH_SECRET, who), user: { ...me(who), email: user.email } });
    }),
  );

  app.get('/me', requireAuth, (req, res) => res.json({ user: me(req.who!) }));

  /** Change your nickname; you get a fresh token. Names held by an account are off limits. */
  app.patch(
    '/me',
    requireAuth,
    wrap(async (req, res) => {
      const body = z.object({ username: z.string().max(40) }).strict().safeParse(req.body);
      const name = body.success ? cleanNickname(body.data.username) : '';
      if (!NICKNAME.test(name)) return res.status(400).json({ error: 'invalid-name' });
      if (await accounts.nameTaken(name, req.who!.id)) return res.status(409).json({ error: 'name-taken' });
      if (!req.who!.guest) await accounts.rename(req.who!.id, name);
      const who: Identity = { ...req.who!, name };
      res.json({ token: signAccessToken(config.AUTH_SECRET, who), user: me(who) });
    }),
  );

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
      // Whoever opens the review first runs the engine and saves it for everyone.
      // After that, only players can replace it.
      if (game.analysis && !game.userIds.includes(req.who!.id)) return res.status(403).json({ error: 'not-a-player' });
      if (body.data.analysis.length !== game.gameHistory.length) return res.status(400).json({ error: 'invalid-input' });
      await store.setAnalysis(game.roomId, body.data.analysis);
      res.json({ ok: true });
    }),
  );

  // Cached so homepage traffic doesn't hit the database.
  let gamesPlayed = { n: 0, at: 0 };
  app.get(
    '/stats',
    wrap(async (_req, res) => {
      if (Date.now() - gamesPlayed.at > 60_000) {
        gamesPlayed = { n: config.LEGACY_GAMES_PLAYED + (await store.countGames()), at: Date.now() };
      }
      res.json({ gamesPlayed: gamesPlayed.n });
    }),
  );

  app.get('/live-games', (_req, res) => res.json({ games: liveGames() }));

  /** Site-wide banners. Edited straight in the database; cached briefly here. */
  let banners: { at: number; list: Announcement[] } = { at: 0, list: [] };
  app.get(
    '/announcements',
    wrap(async (_req, res) => {
      if (Date.now() - banners.at > 15_000) {
        const docs = await store.liveAnnouncements(new Date());
        banners = { at: Date.now(), list: docs.map(toAnnouncement).filter((a): a is Announcement => !!a).slice(0, 3) };
      }
      res.set('Cache-Control', 'public, max-age=30');
      res.json({ announcements: banners.list });
    }),
  );

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

  const captcha = createCaptcha(config.AUTH_SECRET);
  app.get('/contact/challenge', (_req, res) => res.json(captcha.issue()));

  app.post(
    '/contact',
    wrap(async (req, res) => {
      if (!contactLimit(req.ip ?? '')) return res.status(429).json({ error: 'rate-limited' });
      // Hidden "website" field: people never see it, bots fill it in. Pretend it worked.
      if (req.body?.website) return res.json({ ok: true });
      const body = contactSchema.safeParse(req.body);
      if (!body.success) return res.status(400).json({ error: 'invalid-input' });
      if (!captcha.check(req.body?.captcha?.token, req.body?.captcha?.answer)) return res.status(400).json({ error: 'captcha' });
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
