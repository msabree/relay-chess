import { randomBytes } from 'node:crypto';
import jwt from 'jsonwebtoken';

/** Who is making a request. Guests have a random id and are never on the leaderboard. */
export interface Identity {
  id: string;
  name: string;
  guest: boolean;
}

const ISSUER = 'relay-chess-server';
const ACCESS_AUDIENCE = 'relay-chess';
/** Tokens minted by apps/web after an OAuth sign-in, exchanged at POST /auth/exchange. */
export const IDENTITY_AUDIENCE = 'relay-chess-identity';

export function signAccessToken(secret: string, who: Identity): string {
  return jwt.sign({ name: who.name, guest: who.guest }, secret, {
    subject: who.id,
    audience: ACCESS_AUDIENCE,
    issuer: ISSUER,
    expiresIn: '30d',
  });
}

export function verifyAccessToken(secret: string, token: string): Identity | null {
  try {
    const p = jwt.verify(token, secret, { audience: ACCESS_AUDIENCE, issuer: ISSUER }) as jwt.JwtPayload;
    if (typeof p.sub !== 'string' || typeof p.name !== 'string') return null;
    return { id: p.sub, name: p.name, guest: p.guest === true };
  } catch {
    return null;
  }
}

/** Verify a short-lived identity token from apps/web. Returns the signed-in email. */
export function verifyIdentityToken(secret: string, token: string): { email: string; name?: string } | null {
  try {
    const p = jwt.verify(token, secret, { audience: IDENTITY_AUDIENCE, maxAge: '10m' }) as jwt.JwtPayload;
    if (typeof p.email !== 'string' || !p.email.includes('@')) return null;
    return { email: p.email.toLowerCase(), name: typeof p.name === 'string' ? p.name : undefined };
  } catch {
    return null;
  }
}

/** Used by apps/web (and tests) to mint identity tokens. */
export function signIdentityToken(secret: string, email: string, name?: string): string {
  return jwt.sign({ email, name }, secret, { audience: IDENTITY_AUDIENCE, expiresIn: '5m' });
}

export function newGuest(): Identity {
  const id = `guest_${randomBytes(9).toString('base64url')}`;
  const name = `Guest-${randomBytes(2).toString('hex')}`;
  return { id, name, guest: true };
}

export function bearer(header: string | undefined): string | null {
  if (!header?.startsWith('Bearer ')) return null;
  return header.slice(7).trim() || null;
}
