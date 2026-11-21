import cors from 'cors';
import express, { type NextFunction, type Request, type RequestHandler, type Response } from 'express';
import { toNodeHandler } from 'better-auth/node';
import { contactSchema, USERNAME, type Announcement } from '@relay-chess/game';
import { createCaptcha } from './captcha';
import { z } from 'zod';
import { bearer, cleanNickname, newGuest, NICKNAME, signAccessToken, verifyAccessToken, type Identity } from './auth';
import type { Accounts } from './accounts';
import type { Config } from './config';
import { leaderboardPage, leaderboardPosition, PERIODS } from './leaderboard';
import type { GameRecord, Store } from './store/types';
import type { Supporters } from './supporters';

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

const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';


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
  /** player ids of deleted accounts */
  retired: ReadonlySet<string>;
  /** retire a deleted account's player ids, and its username for good */
  retire: (ids: string[], username?: string | null) => Promise<void>;
  supporters: Supporters;
}

export function createHttpApp({ config, store, accounts, liveGames, playing, retired, retire, supporters }: HttpDeps) {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 1);
  // set-auth-token carries the account session to the browser (bearer, no cookies)
  app.use(cors({ origin: config.CORS_ORIGINS, exposedHeaders: ['set-auth-token'] }));
  // Better Auth reads its own bodies: mount it before express.json
  app.all('/api/auth/*', toNodeHandler(accounts.auth));

  /**
   * Stripe webhook. Needs the raw body for the signature, so it's mounted
   * before express.json. Each event makes us re-read the subscription from
   * Stripe, so repeats and out-of-order events are harmless.
   */
  app.post(
    '/stripe/webhook',
    express.raw({ type: 'application/json', limit: '1mb' }),
    wrap(async (req, res) => {
      if (!supporters.enabled) return res.status(404).json({ error: 'not-found' });
      let event;
      try {
        event = supporters.verify(req.body as Buffer, String(req.headers['stripe-signature'] ?? ''));
      } catch {
        return res.status(400).json({ error: 'bad-signature' });
      }
      await supporters.handle(event); // a throw is a 500, and Stripe retries
      res.json({ received: true });
    }),
  );
  app.use(express.json({ limit: '1mb' }));

  // Identify the caller if a token is present. Routes decide whether it's required.
  app.use((req, _res, next) => {
    const token = bearer(req.headers.authorization);
    const who = token ? verifyAccessToken(config.AUTH_SECRET, token) : null;
    // A deleted account's players can't come back on an old token.
    if (who && !retired.has(who.id)) req.who = who;
    next();
  });
  /** Your player as the web app sees it. Supporter status is live, not in the token. */
  const me = (who: Identity) => ({
    id: who.id,
    username: who.name,
    ...(who.guest ? {} : { verified: true }),
    ...(!who.guest && supporters.isSupporter(who.id) ? { supporter: true } : {}),
  });
  /** check marks for a player id that has an account */
  const badges = (id: string) => (supporters.isSupporter(id) ? { verified: true, supporter: true } : { verified: true });
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
      const fresh = await accounts.sessionUser(req.headers);
      res.json({
        token: signAccessToken(config.AUTH_SECRET, who),
        user: { ...me(who), email: user.email, ...(fresh && accounts.needsName(fresh) ? { needsName: true } : {}) },
      });
    }),
  );

  app.get('/me', requireAuth, (req, res) => res.json({ user: me(req.who!) }));

  /**
   * Delete your account (Authorization: Bearer <session token>). The profile
   * disappears and the username is frozen: nobody can take it again, so old
   * games that show it stay unambiguous. Games stay in the records, but the player
   * ids behind the account are retired: their tokens stop working everywhere and
   * their profile is a 404 for good. Signing up again starts a new player.
   */
  app.delete(
    '/account',
    wrap(async (req, res) => {
      const user = await accounts.sessionUser(req.headers);
      if (!user) return res.status(401).json({ error: 'unauthorized' });
      const ids = [user.playerId, ...(user.linkedPlayerIds ?? [])].filter((id): id is string => !!id);
      await retire(ids, user.username); // first, so a failure below never leaves the profile public
      await accounts.remove(user);
      res.json({ ok: true });
    }),
  );

  /** Change your nickname; you get a fresh token. Names held by an account are off limits. */
  app.patch(
    '/me',
    requireAuth,
    wrap(async (req, res) => {
      const body = z.object({ username: z.string().max(40) }).strict().safeParse(req.body);
      const name = body.success ? cleanNickname(body.data.username) : '';
      // guests keep friendly nicknames; account usernames follow the stricter rule
      if (!(req.who!.guest ? NICKNAME : USERNAME).test(name)) return res.status(400).json({ error: 'invalid-name' });
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

  // ---- profiles ----

  /**
   * Profile: name, check mark, record and recent games are public.
   * Partners are only for the player themselves (who you team up with is yours).
   */
  app.get(
    '/players/:id',
    wrap(async (req, res) => {
      const id = String(req.params.id).slice(0, 64);
      if (retired.has(id)) return res.status(404).json({ error: 'not-found' });
      const { ids, account } = await accounts.playerIds(id);
      const games = await store.gamesFor(ids, 100);
      const offset = Math.max(0, Math.min(90, Number(req.query.offset) || 0));
      const pageSize = Math.max(1, Math.min(30, Number(req.query.limit) || 12));
      const mine = (g: GameRecord) => (g.whiteTeamUserIds.some((u) => ids.includes(u)) ? 'white' : 'black');
      const lastName = games.flatMap((g) => [...g.whiteTeam, ...g.blackTeam]).find((p) => ids.includes(p.id))?.name;
      const name = account?.username ?? lastName;
      if (!name) return res.status(404).json({ error: 'not-found' });

      let wins = 0, losses = 0, draws = 0;
      const partners = new Map<string, { id: string; name: string; games: number; wins: number }>();
      for (const g of games) {
        const side = mine(g);
        const won = g.winningColor === side;
        if (!g.winningColor) draws++;
        else if (won) wins++;
        else losses++;
        for (const p of side === 'white' ? g.whiteTeam : g.blackTeam) {
          if (ids.includes(p.id) || retired.has(p.id)) continue;
          const cur = partners.get(p.id) ?? { id: p.id, name: p.name, games: 0, wins: 0 };
          cur.games++;
          if (won) cur.wins++;
          partners.set(p.id, cur);
        }
      }
      const owner = !!req.who && ids.includes(req.who.id);
      const info = owner ? await accounts.publicInfo([...partners.keys()]) : new Map();
      res.json({
        player: {
          id: account?.playerId ?? id,
          username: name,
          ...(account ? badges(account.playerId ?? id) : {}),
        },
        // "100+" when we stopped counting: the list is capped
        record: { wins, losses, draws, games: games.length, capped: games.length === 100 },
        ...(owner
          ? {
              partners: [...partners.values()]
                .sort((a, b) => b.games - a.games)
                .slice(0, 6)
                .map((p) => (info.has(p.id) ? { ...p, ...badges(p.id) } : p)),
            }
          : {}),
        games: games.slice(offset, offset + pageSize).map((g) => ({
          roomId: g.roomId,
          at: g.timestamp,
          gameType: g.gameType,
          reason: g.reason,
          side: mine(g),
          outcome: !g.winningColor ? 'draw' : g.winningColor === mine(g) ? 'win' : 'loss',
          team: (mine(g) === 'white' ? g.whiteTeam : g.blackTeam).filter((p) => !ids.includes(p.id)).map((p) => p.name),
          fen: g.gameHistory.at(-1)?.fen ?? START_FEN,
          lastMove: g.gameHistory.at(-1)?.lanMove?.slice(0, 4),
          opponents: (mine(g) === 'white' ? g.blackTeam : g.whiteTeam).map((p) => p.name),
        })),
      });
    }),
  );

  /** Can I take this username? Accounts hold names; guests don't. */
  app.get(
    '/names/available',
    wrap(async (req, res) => {
      const name = String(req.query.name ?? '').trim().slice(0, 40);
      if (!USERNAME.test(name)) return res.json({ available: false, reason: 'invalid' });
      const taken = await accounts.nameTaken(name, req.who?.id ?? '');
      res.json(taken ? { available: false, reason: 'taken' } : { available: true });
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
      const page = await leaderboardPage(store, q.data.period as never, q.data.page, q.data.pageSize);
      const info = await accounts.publicInfo(page.rows.map((r) => r.userId));
      // signed-in players show their current name, not the one from their last game
      res.json({
        ...page,
        rows: page.rows.map((r) => {
          const a = info.get(r.userId);
          return a ? { ...r, username: a.username ?? r.username, ...badges(r.userId) } : r;
        }),
      });
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

  // ---- supporters (Stripe memberships; every feature stays free) ----

  const supportUrl = `${config.WEB_URL}/support`;
  /** Signed-in players only: memberships belong to accounts, not guests. */
  const requireAccount: RequestHandler = (req, res, next) =>
    req.who && !req.who.guest ? next() : res.status(401).json({ error: req.who ? 'sign-in-required' : 'unauthorized' });
  const billingLimit = limiter(20, 60 * 60_000);

  /** Is supporting switched on, and your membership if you're signed in. */
  app.get(
    '/support',
    wrap(async (req, res) => {
      const mine = req.who && !req.who.guest ? await supporters.status(req.who.id) : null;
      res.json({ enabled: supporters.enabled, ...(req.who && !req.who.guest ? { membership: mine } : {}) });
    }),
  );

  /** Start Stripe Checkout for a plan. Already a supporter: manage it in the portal instead. */
  app.post(
    '/support/checkout',
    requireAccount,
    wrap(async (req, res) => {
      if (!supporters.enabled) return res.status(503).json({ error: 'support-off' });
      if (!billingLimit(req.who!.id)) return res.status(429).json({ error: 'rate-limited' });
      const body = z.object({ plan: z.enum(['monthly', 'yearly']) }).safeParse(req.body);
      if (!body.success) return res.status(400).json({ error: 'invalid-input' });
      const { account } = await accounts.playerIds(req.who!.id);
      const out = await supporters.checkout(req.who!.id, body.data.plan, account?.email, supportUrl);
      if ('already' in out) return res.status(409).json({ error: 'already-supporter' });
      res.json({ url: out.url });
    }),
  );

  /** Stripe's Customer Portal: change plan, update the card, cancel, see receipts. */
  app.post(
    '/support/portal',
    requireAccount,
    wrap(async (req, res) => {
      if (!billingLimit(req.who!.id)) return res.status(429).json({ error: 'rate-limited' });
      const url = await supporters.portal(req.who!.id, supportUrl);
      if (!url) return res.status(404).json({ error: 'no-membership' });
      res.json({ url });
    }),
  );

  let wall: { at: number; list: { id: string; username: string }[] } = { at: 0, list: [] };

  /** Show or hide yourself on the supporters list. */
  app.patch(
    '/support/me',
    requireAccount,
    wrap(async (req, res) => {
      const body = z.object({ showOnWall: z.boolean() }).strict().safeParse(req.body);
      if (!body.success) return res.status(400).json({ error: 'invalid-input' });
      if (!(await supporters.setShowOnWall(req.who!.id, body.data.showOnWall))) return res.status(404).json({ error: 'no-membership' });
      wall.at = 0;
      res.json({ ok: true });
    }),
  );

  /** The supporters list: active supporters who opted in, by current name. Cached briefly. */
  app.get(
    '/supporters',
    wrap(async (_req, res) => {
      if (Date.now() - wall.at > 60_000) {
        const ids = supporters.wall().filter((id) => !retired.has(id));
        const info = await accounts.publicInfo(ids);
        const list = ids.flatMap((id) => (info.get(id)?.username ? [{ id, username: info.get(id)!.username! }] : []));
        wall = { at: Date.now(), list: list.sort((a, b) => a.username.localeCompare(b.username)) };
      }
      res.json({ supporters: wall.list.filter((s) => supporters.isSupporter(s.id)) });
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
