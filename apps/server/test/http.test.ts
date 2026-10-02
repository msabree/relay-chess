import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { signIdentityToken } from '../src/auth';
import { SECRET, startServer } from './helpers';

let t: Awaited<ReturnType<typeof startServer>>;
beforeEach(async () => (t = await startServer()));
afterEach(async () => t.stop());

describe('auth', () => {
  it('issues guest tokens', async () => {
    const g = await t.guest();
    expect(g.user.id).toMatch(/^guest_/);
    const me = await t.api('/me', { token: g.token });
    expect(me.body.user).toMatchObject({ id: g.user.id, guest: true });
  });

  it('exchanges an identity token for an account, idempotently', async () => {
    const a = await t.account('Ana@Example.com');
    const b = await t.account('ana@example.com');
    expect(a.user.id).toBe(b.user.id);
    expect((await t.api('/me', { token: a.token })).body.user.email).toBe('ana@example.com');
  });

  it('rejects forged and wrong-audience tokens', async () => {
    const forged = signIdentityToken('some-other-secret-123', 'x@y.com');
    expect((await t.api('/auth/exchange', { method: 'POST', json: { token: forged } })).status).toBe(401);
    // an identity token is not an access token
    const id = signIdentityToken(SECRET, 'x@y.com');
    expect((await t.api('/me', { token: id })).status).toBe(401);
    expect((await t.api('/me')).status).toBe(401);
  });
});

describe('profile', () => {
  it('updates username with validation and uniqueness', async () => {
    const a = await t.account('a@x.com');
    const b = await t.account('b@x.com');
    const ok = await t.api('/me', { method: 'PATCH', token: a.token, json: { username: 'Knight_Rider' } });
    expect(ok.body.user.username).toBe('Knight_Rider');
    expect(ok.body.token).toBeTruthy();
    expect((await t.api('/me', { method: 'PATCH', token: b.token, json: { username: 'knight_rider' } })).status).toBe(409);
    expect((await t.api('/me', { method: 'PATCH', token: b.token, json: { username: 'no spaces!' } })).status).toBe(400);
    expect((await t.api('/me', { method: 'PATCH', token: b.token, json: { email: 'evil@x.com' } })).status).toBe(400);
  });

  it('guests cannot edit a profile', async () => {
    const g = await t.guest();
    expect((await t.api('/me', { method: 'PATCH', token: g.token, json: { username: 'hello' } })).status).toBe(403);
  });

  it('user search is a safe prefix match', async () => {
    const a = await t.account('a@x.com');
    await t.api('/me', { method: 'PATCH', token: a.token, json: { username: 'magnus' } });
    expect((await t.api('/users/search?q=mag')).body.users).toEqual([{ id: a.user.id, username: 'magnus' }]);
    expect((await t.api('/users/search?q=.*')).body.users).toEqual([]);
  });
});

describe('misc', () => {
  it('health, contact, leaderboard', async () => {
    expect((await t.api('/health')).body).toEqual({ ok: true, store: 'memory' });
    expect((await t.api('/contact', { method: 'POST', json: { name: 'A', email: 'nope', message: 'hi' } })).status).toBe(400);
    expect((await t.api('/contact', { method: 'POST', json: { name: 'A', email: 'a@b.co', message: 'hi' } })).body).toEqual({ ok: true });
    expect(t.store.contacts).toHaveLength(1);
    expect((await t.api('/leaderboard?period=weekly')).body).toMatchObject({ rows: [], total: 0 });
    expect((await t.api('/leaderboard?period=yearly')).status).toBe(400);
  });
});
