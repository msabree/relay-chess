import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { bucket } from '../src/leaderboard';
import { startServer } from './helpers';

let t: Awaited<ReturnType<typeof startServer>>;
beforeEach(async () => (t = await startServer()));
afterEach(async () => t.stop());

describe('players', () => {
  it('hands out a player with a friendly random name', async () => {
    const p = await t.guest();
    expect(p.user.id).toMatch(/^p_/);
    expect(p.user.username).toMatch(/^[A-Z][a-z]+ [A-Z][a-z]+$/);
    expect((await t.api('/me', { token: p.token })).body.user).toEqual(p.user);
  });

  it('renames you and returns a fresh token', async () => {
    const p = await t.guest();
    const r = await t.api('/me', { method: 'PATCH', token: p.token, json: { username: '  Rook   Rookie ' } });
    expect(r.body.user).toEqual({ id: p.user.id, username: 'Rook Rookie' });
    expect((await t.api('/me', { token: r.body.token })).body.user.username).toBe('Rook Rookie');
  });

  it('rejects bad names and missing tokens', async () => {
    const p = await t.guest();
    for (const username of ['x', 'a'.repeat(21), '<script>', 'hi!']) {
      expect((await t.api('/me', { method: 'PATCH', token: p.token, json: { username } })).status).toBe(400);
    }
    expect((await t.api('/me')).status).toBe(401);
    expect((await t.api('/me', { token: 'forged' })).status).toBe(401);
  });

  it('allows names in any language', async () => {
    const p = await t.guest();
    expect((await t.api('/me', { method: 'PATCH', token: p.token, json: { username: 'Ajedrez Ñandú' } })).status).toBe(200);
  });
});

describe('analysis', () => {
  it('the first visitor saves it for everyone; after that only players can replace it', async () => {
    const [player, visitor, other] = await Promise.all([t.guest(), t.guest(), t.guest()]);
    const move = { move: 'e4', sanMove: 'e4', lanMove: 'e2e4', userId: player.user.id, username: 'P', fen: 'x' };
    await t.store.saveGame({
      roomId: 'room1', gameType: 'untimed', result: 'resign', reason: 'resign', winningColor: 'white', timeControl: null,
      whiteTeam: [{ id: player.user.id, name: 'P' }], blackTeam: [], whiteTeamUserIds: [player.user.id], blackTeamUserIds: [],
      userIds: [player.user.id], gameHistory: [move], timestamp: new Date(),
    });
    const post = (token: string, analysis: unknown[]) => t.api('/games/room1/analysis', { method: 'POST', token, json: { analysis } });
    expect((await post(visitor.token, [])).status).toBe(400); // must cover every move
    expect((await post(visitor.token, [{ a: 1 }])).status).toBe(200);
    expect((await post(other.token, [{ a: 2 }])).status).toBe(403);
    expect((await post(player.token, [{ a: 3 }])).status).toBe(200);
    expect((await t.api('/games/room1')).body.game.analysis).toEqual([{ a: 3 }]);
  });
});

describe('stats', () => {
  it('counts games played', async () => {
    expect((await t.api('/stats')).body).toEqual({ gamesPlayed: 0 });
  });
});

describe('leaderboard buckets', () => {
  it('days roll over at UTC midnight and weeks start on Monday', () => {
    const thu = new Date('2026-10-01T23:59:00Z');
    expect(bucket('daily', thu).key).toBe('2026-10-01');
    expect(bucket('daily', new Date('2026-10-02T00:00:00Z')).key).toBe('2026-10-02');
    expect(bucket('weekly', thu).key).toBe('week-of-2026-09-28');
    expect(bucket('weekly', new Date('2026-10-04T23:00:00Z')).key).toBe('week-of-2026-09-28');
    expect(bucket('weekly', new Date('2026-10-05T00:00:00Z')).key).toBe('week-of-2026-10-05');
    expect(bucket('weekly', thu).endsAt.toISOString()).toBe('2026-10-05T00:00:00.000Z');
  });
});

describe('misc', () => {
  it('health, contact, leaderboard', async () => {
    expect((await t.api('/health')).body).toEqual({ ok: true, store: 'memory', playing: 0 });
    expect((await t.api('/contact', { method: 'POST', json: { name: 'A', email: 'nope', message: 'hi' } })).status).toBe(400);
    expect((await t.api('/contact', { method: 'POST', json: { name: 'A', email: 'a@b.co', message: 'hi' } })).body).toEqual({ ok: true });
    expect(t.store.contacts).toHaveLength(1);
    expect((await t.api('/leaderboard?period=weekly')).body).toMatchObject({ rows: [], total: 0 });
    expect((await t.api('/leaderboard?period=all-time')).status).toBe(400);
    expect((await t.api('/auth/exchange', { method: 'POST' })).status).toBe(404);
  });
});
