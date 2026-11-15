import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { verifyAccessToken } from '../src/auth';
import { SECRET, startServer } from './helpers';

let t: Awaited<ReturnType<typeof startServer>>;
beforeEach(async () => (t = await startServer()));
afterEach(async () => t.stop());

describe('accounts', () => {
  it('signing in keeps the guest you were playing as', async () => {
    const g = await t.guest();
    const a = await t.signIn('rook@example.com', g.token);
    expect(a.user).toEqual({ id: g.user.id, username: g.user.username, email: 'rook@example.com' });
    expect(verifyAccessToken(SECRET, a.token)).toEqual({ id: g.user.id, name: g.user.username, guest: false });
    expect((await t.api('/me', { token: a.token })).body.user).toEqual({ id: g.user.id, username: g.user.username });
  });

  it('signing in on another device gets the same player back', async () => {
    const g = await t.guest();
    await t.signIn('rook@example.com', g.token);
    const other = await t.guest();
    const again = await t.signIn('rook@example.com', other.token);
    expect(again.user.id).toBe(g.user.id);
    expect(again.user.username).toBe(g.user.username);
  });

  it('a new account without a guest gets a fresh player', async () => {
    const a = await t.signIn('new@example.com');
    expect(a.user.id).toMatch(/^p_/);
    expect(a.user.username).toMatch(/^[A-Z][a-z]+ [A-Z][a-z]+/);
  });

  it('account names are reserved, case-insensitively', async () => {
    const a = await t.signIn('rook@example.com');
    const ren = await t.api('/me', { method: 'PATCH', token: a.token, json: { username: 'Quiet Rook' } });
    expect(ren.status).toBe(200);
    const g = await t.guest();
    expect((await t.api('/me', { method: 'PATCH', token: g.token, json: { username: 'quiet rook' } })).status).toBe(409);
    // the owner can keep using it
    expect((await t.api('/me', { method: 'PATCH', token: ren.body.token, json: { username: 'Quiet ROOK' } })).status).toBe(200);
  });

  it('renaming an account frees its old name', async () => {
    const a = await t.signIn('rook@example.com');
    const one = await t.api('/me', { method: 'PATCH', token: a.token, json: { username: 'Quiet Rook' } });
    await t.api('/me', { method: 'PATCH', token: one.body.token, json: { username: 'Loud Rook' } });
    const g = await t.guest();
    expect((await t.api('/me', { method: 'PATCH', token: g.token, json: { username: 'Quiet Rook' } })).status).toBe(200);
  });

  it('claiming a name an account already holds adds a number', async () => {
    // a guest takes the name while it's free...
    const g = await t.guest();
    const named = await t.api('/me', { method: 'PATCH', token: g.token, json: { username: 'Quiet Rook' } });
    // ...then someone else reserves it with an account
    const a = await t.signIn('first@example.com');
    expect((await t.api('/me', { method: 'PATCH', token: a.token, json: { username: 'Quiet Rook' } })).status).toBe(200);
    const b = await t.signIn('second@example.com', named.body.token);
    expect(b.user).toMatchObject({ id: g.user.id, username: 'Quiet Rook 2' });
  });

  it('a guest id can only be claimed once', async () => {
    const g = await t.guest();
    const a = await t.signIn('a@example.com', g.token);
    const b = await t.signIn('b@example.com', g.token);
    expect(b.user.id).not.toBe(a.user.id);
  });

  it('needs a real session', async () => {
    expect((await t.api('/account/session', { method: 'POST', json: {} })).status).toBe(401);
    expect((await t.api('/account/session', { method: 'POST', token: 'nope', json: {} })).status).toBe(401);
  });

  it('a wrong code does not sign you in', async () => {
    await t.api('/api/auth/email-otp/send-verification-otp', { method: 'POST', json: { email: 'x@example.com', type: 'sign-in' } });
    const r = await t.api('/api/auth/sign-in/email-otp', { method: 'POST', json: { email: 'x@example.com', otp: '000000' } });
    expect(r.status).toBeGreaterThanOrEqual(400);
  });
});
