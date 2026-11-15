import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

const TTL_MS = 10 * 60_000;

/**
 * A tiny self-hosted captcha: "What is 7 + 5?". The answer never leaves the
 * server; the token is signed with the server secret and works once (right or
 * wrong), so a solved token can't be replayed and a wrong guess gets a new
 * question. Enough to stop drive-by spam bots without a third party.
 */
export function createCaptcha(secret: string, now: () => number = Date.now) {
  const used = new Map<string, number>(); // nonce -> expiry
  const sign = (answer: number, exp: number, nonce: string) =>
    createHmac('sha256', `captcha:${secret}`).update(`${answer}|${exp}|${nonce}`).digest('base64url');
  const pick = () => 2 + Math.floor(Math.random() * 8); // 2..9

  return {
    issue(): { token: string; question: string } {
      const a = pick();
      const b = pick();
      const exp = now() + TTL_MS;
      const nonce = randomBytes(9).toString('base64url');
      return { token: `${exp}.${nonce}.${sign(a + b, exp, nonce)}`, question: `What is ${a} + ${b}?` };
    },

    check(token: unknown, answer: unknown): boolean {
      if (typeof token !== 'string' || (typeof answer !== 'string' && typeof answer !== 'number')) return false;
      const [expStr, nonce, mac] = token.split('.');
      const exp = Number(expStr);
      if (!nonce || !mac || !Number.isFinite(exp) || exp < now() || used.has(nonce)) return false;
      used.set(nonce, exp); // one attempt per question
      for (const [n, e] of used) if (e < now()) used.delete(n);
      const n = Number(String(answer).trim());
      if (!Number.isInteger(n)) return false;
      const want = Buffer.from(sign(n, exp, nonce));
      const got = Buffer.from(mac);
      return want.length === got.length && timingSafeEqual(want, got);
    },
  };
}
