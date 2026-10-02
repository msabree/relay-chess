import { randomBytes } from 'node:crypto';
import jwt from 'jsonwebtoken';

/**
 * Who is making a request. There are no accounts: everyone gets a random id
 * and a nickname, remembered by their browser for 30 days.
 */
export interface Identity {
  id: string;
  name: string;
  /** always true today; kept so accounts can come back without a protocol change */
  guest: boolean;
}

const ISSUER = 'relay-chess-server';
const AUDIENCE = 'relay-chess';

/** Letters, numbers, spaces, _ and -. 2 to 20 characters. */
export const NICKNAME = /^[\p{L}\p{N}_ -]{2,20}$/u;
export const cleanNickname = (raw: string) => raw.trim().replace(/\s+/g, ' ');

export function signAccessToken(secret: string, who: Identity): string {
  return jwt.sign({ name: who.name, guest: who.guest }, secret, {
    subject: who.id,
    audience: AUDIENCE,
    issuer: ISSUER,
    expiresIn: '30d',
  });
}

export function verifyAccessToken(secret: string, token: string): Identity | null {
  try {
    const p = jwt.verify(token, secret, { audience: AUDIENCE, issuer: ISSUER }) as jwt.JwtPayload;
    if (typeof p.sub !== 'string' || typeof p.name !== 'string') return null;
    return { id: p.sub, name: p.name, guest: true };
  } catch {
    return null;
  }
}

const ADJECTIVES = ['Bold', 'Calm', 'Clever', 'Daring', 'Eager', 'Fuzzy', 'Gentle', 'Happy', 'Jolly', 'Keen', 'Lucky', 'Mellow', 'Nimble', 'Plucky', 'Quiet', 'Rapid', 'Sly', 'Sunny', 'Swift', 'Witty'];
const ANIMALS = ['Badger', 'Bison', 'Crane', 'Falcon', 'Ferret', 'Fox', 'Gecko', 'Heron', 'Ibex', 'Koala', 'Lynx', 'Marten', 'Moose', 'Newt', 'Otter', 'Owl', 'Panda', 'Raven', 'Seal', 'Yak'];
const pick = (xs: string[]) => xs[randomBytes(1)[0]! % xs.length]!;

/** A new player with a friendly random name like "Plucky Otter". */
export function newGuest(): Identity {
  const id = `p_${randomBytes(9).toString('base64url')}`;
  return { id, name: `${pick(ADJECTIVES)} ${pick(ANIMALS)}`, guest: true };
}

export function bearer(header: string | undefined): string | null {
  if (!header?.startsWith('Bearer ')) return null;
  return header.slice(7).trim() || null;
}
