import { betterAuth } from 'better-auth';
import { memoryAdapter } from 'better-auth/adapters/memory';
import { mongodbAdapter } from 'better-auth/adapters/mongodb';
import { fromNodeHeaders } from 'better-auth/node';
import { bearer, emailOTP } from 'better-auth/plugins';
import type { Db } from 'mongodb';
import { newGuest, type Identity } from './auth';
import type { Config } from './config';

/**
 * Optional accounts (Better Auth). Sign in with a code sent by email, no
 * passwords. An account keeps a player id and a reserved name; everything in
 * the game still runs on the player token from auth.ts, so signing in only
 * changes how you get that token.
 *
 * Clients send the Better Auth session token as a bearer token (no cookies:
 * the web app and this server are on different sites).
 */

/** Sends a sign-in code. Never awaited by Better Auth's route (timing). */
export type Mailer = (email: string, code: string) => Promise<void>;

export function resendMailer(config: Config): Mailer {
  return async (email, code) => {
    const link = `${config.WEB_URL}/signin?email=${encodeURIComponent(email)}&code=${code}`;
    if (!config.RESEND_API_KEY) {
      console.log(`[sign-in] code for ${email}: ${code}  (${link})`);
      return;
    }
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { authorization: `Bearer ${config.RESEND_API_KEY}`, 'content-type': 'application/json' },
      body: JSON.stringify({
        from: config.EMAIL_FROM,
        to: email,
        subject: `${code} is your Relay Chess code`,
        text: `Your Relay Chess sign-in code is ${code}.\n\nOr tap to sign in: ${link}\n\nIt expires in 10 minutes. If you didn't ask for it, ignore this email.`,
        html: `<p style="font:16px system-ui,sans-serif">Your Relay Chess sign-in code is</p><p style="font:700 32px ui-monospace,monospace;letter-spacing:6px">${code}</p><p style="font:16px system-ui,sans-serif"><a href="${link}">Or tap here to sign in</a></p><p style="font:13px system-ui,sans-serif;color:#666">It expires in 10 minutes. If you didn't ask for it, ignore this email.</p>`,
      }),
    });
    if (!res.ok) console.error(`[sign-in] email to ${email} failed: ${res.status} ${await res.text()}`);
  };
}

const MODELS = { user: 'auth_users', session: 'auth_sessions', account: 'auth_accounts', verification: 'auth_verifications' };

export function createAccounts(config: Config, db: Db | undefined, mail: Mailer) {
  const auth = betterAuth({
    secret: config.AUTH_SECRET,
    baseURL: config.SERVER_URL ?? `http://localhost:${config.PORT}`,
    basePath: '/api/auth',
    trustedOrigins: config.CORS_ORIGINS,
    database: db
      ? mongodbAdapter(db)
      : memoryAdapter(Object.fromEntries(Object.values(MODELS).map((m) => [m, []]))),
    user: {
      modelName: MODELS.user,
      additionalFields: {
        /** the player id used in games, leaderboards and records */
        playerId: { type: 'string', required: false, input: false },
        username: { type: 'string', required: false, input: false },
        /** lower case, for uniqueness */
        usernameKey: { type: 'string', required: false, input: false },
      },
    },
    session: { modelName: MODELS.session, expiresIn: 60 * 60 * 24 * 90 },
    account: { modelName: MODELS.account },
    verification: { modelName: MODELS.verification },
    plugins: [
      bearer(),
      emailOTP({
        expiresIn: 600,
        allowedAttempts: 5,
        storeOTP: 'hashed',
        sendVerificationOTP: async ({ email, otp }) => {
          void mail(email, otp).catch((e) => console.error('[sign-in] mailer error', e));
        },
      }),
    ],
  });

  type AccountUser = { id: string; email: string; playerId?: string | null; username?: string | null };
  const ctx = () => auth.$context;

  async function findByName(name: string): Promise<AccountUser | null> {
    const { adapter } = await ctx();
    return adapter.findOne<AccountUser>({ model: 'user', where: [{ field: 'usernameKey', value: name.toLowerCase() }] });
  }

  async function findByPlayer(playerId: string): Promise<AccountUser | null> {
    const { adapter } = await ctx();
    return adapter.findOne<AccountUser>({ model: 'user', where: [{ field: 'playerId', value: playerId }] });
  }

  async function update(userId: string, data: Partial<AccountUser> & { usernameKey?: string }) {
    const { internalAdapter } = await ctx();
    await internalAdapter.updateUser(userId, data);
  }

  /** A free name based on `base`: "Quiet Rook", else "Quiet Rook 2", "Quiet Rook 3"… */
  async function freeName(base: string): Promise<string> {
    if (!(await findByName(base))) return base;
    for (let n = 2; n < 1000; n++) {
      const name = `${base.slice(0, 20 - String(n).length - 1)} ${n}`;
      if (!(await findByName(name))) return name;
    }
    return newGuest().name;
  }

  return {
    auth,

    /** The signed-in account for these request headers, or null. */
    async sessionUser(headers: Record<string, string | string[] | undefined>): Promise<AccountUser | null> {
      const s = await auth.api.getSession({ headers: fromNodeHeaders(headers) });
      return (s?.user as AccountUser | undefined) ?? null;
    },

    /**
     * The player behind an account. The first time, the guest you were
     * playing as becomes the account's player, so you keep your id, name and
     * scores (the name gets a number if an account already has it).
     */
    async playerFor(user: AccountUser, guest: Identity | null): Promise<Identity> {
      if (user.playerId && user.username) return { id: user.playerId, name: user.username, guest: false };
      const base = guest?.guest ? guest : newGuest();
      // a guest token whose id already belongs to an account can't be claimed twice
      const id = guest?.guest && !(await findByPlayer(base.id)) ? base.id : newGuest().id;
      const name = await freeName(base.name);
      await update(user.id, { playerId: id, username: name, usernameKey: name.toLowerCase() });
      return { id, name, guest: false };
    },

    /** Is this name held by an account other than this player's? */
    async nameTaken(name: string, playerId: string): Promise<boolean> {
      const owner = await findByName(name);
      return !!owner && owner.playerId !== playerId;
    },

    /** Keep an account's reserved name in step with a rename. */
    async rename(playerId: string, name: string) {
      const owner = await findByPlayer(playerId);
      if (owner) await update(owner.id, { username: name, usernameKey: name.toLowerCase() });
    },
  };
}

export type Accounts = ReturnType<typeof createAccounts>;
