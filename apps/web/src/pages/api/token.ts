import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import jwt from 'jsonwebtoken';
import { authOptions } from './auth/[...nextauth]';

/**
 * Mints a short-lived identity token for the signed-in user. The browser
 * exchanges it with the Relay Chess server (POST /auth/exchange) for an
 * access token. AUTH_SECRET must match the server's.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  const email = session?.user?.email;
  if (!email) return res.status(401).json({ error: 'unauthorized' });
  const secret = process.env.AUTH_SECRET;
  if (!secret) return res.status(500).json({ error: 'AUTH_SECRET is not set' });
  const token = jwt.sign({ email, name: session.user?.name ?? undefined }, secret, {
    audience: 'relay-chess-identity',
    expiresIn: '5m',
  });
  res.setHeader('cache-control', 'no-store');
  res.json({ token });
}
