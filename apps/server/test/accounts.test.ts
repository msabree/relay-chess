import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { toUsername } from '@relay-chess/game';
import { verifyAccessToken } from '../src/auth';
import { bucket } from '../src/leaderboard';
import { SECRET, startServer } from './helpers';

let t: Awaited<ReturnType<typeof startServer>>;
beforeEach(async () => (t = await startServer()));
afterEach(async () => t.stop());

describe('accounts', () => {
  it('signing in keeps the guest you were playing as', async () => {
    const g = await t.guest();
    const a = await t.signIn('rook@example.com', g.token);
    const name = toUsername(g.user.username);
    expect(a.user).toEqual({ id: g.user.id, username: name, email: 'rook@example.com', verified: true, needsName: true });
    expect(verifyAccessToken(SECRET, a.token)).toEqual({ id: g.user.id, name, guest: false });
    expect((await t.api('/me', { token: a.token })).body.user).toEqual({ id: g.user.id, username: name, verified: true });
  });

  it('signing in on another device gets the same player back', async () => {
    const g = await t.guest();
    await t.signIn('rook@example.com', g.token);
    const other = await t.guest();
    const again = await t.signIn('rook@example.com', other.token);
    expect(again.user.id).toBe(g.user.id);
    expect(again.user.username).toBe(toUsername(g.user.username));
  });

  it('a new account without a guest gets a fresh player', async () => {
    const a = await t.signIn('new@example.com');
    expect(a.user.id).toMatch(/^p_/);
    expect(a.user.username).toMatch(/^[A-Z][a-z]+[A-Z][a-z]+$/);
  });

  it('account names are reserved, case-insensitively', async () => {
    const a = await t.signIn('rook@example.com');
    const ren = await t.api('/me', { method: 'PATCH', token: a.token, json: { username: 'QuietRook' } });
    expect(ren.status).toBe(200);
    const g = await t.guest();
    expect((await t.api('/me', { method: 'PATCH', token: g.token, json: { username: 'quietrook' } })).status).toBe(409);
    // the owner can keep using it
    expect((await t.api('/me', { method: 'PATCH', token: ren.body.token, json: { username: 'QuietROOK' } })).status).toBe(200);
  });

  it('renaming an account frees its old name', async () => {
    const a = await t.signIn('rook@example.com');
    const one = await t.api('/me', { method: 'PATCH', token: a.token, json: { username: 'QuietRook' } });
    await t.api('/me', { method: 'PATCH', token: one.body.token, json: { username: 'LoudRook' } });
    const g = await t.guest();
    expect((await t.api('/me', { method: 'PATCH', token: g.token, json: { username: 'QuietRook' } })).status).toBe(200);
  });

  it('claiming a name an account already holds adds a number', async () => {
    // a guest takes the name while it's free...
    const g = await t.guest();
    const named = await t.api('/me', { method: 'PATCH', token: g.token, json: { username: 'QuietRook' } });
    // ...then someone else reserves it with an account
    const a = await t.signIn('first@example.com');
    expect((await t.api('/me', { method: 'PATCH', token: a.token, json: { username: 'QuietRook' } })).status).toBe(200);
    const b = await t.signIn('second@example.com', named.body.token);
    expect(b.user).toMatchObject({ id: g.user.id, username: 'QuietRook2' });
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

describe('profiles', () => {
  const game = (roomId: string, white: { id: string; name: string }[], black: { id: string; name: string }[], winner: 'white' | 'black' | null, at = Date.now()) =>
    t.store.saveGame({
      roomId,
      gameType: 'blitz',
      result: winner ? 'checkmate' : 'draw',
      reason: winner ? 'checkmate' : 'stalemate',
      winningColor: winner,
      timeControl: null,
      whiteTeam: white,
      blackTeam: black,
      whiteTeamUserIds: white.map((p) => p.id),
      blackTeamUserIds: black.map((p) => p.id),
      userIds: [...white, ...black].map((p) => p.id),
      gameHistory: [],
      timestamp: new Date(at),
    });

  it("shows a guest's record, games and partners, no check mark", async () => {
    const g = await t.guest();
    const me = { id: g.user.id, name: g.user.username };
    const pal = { id: 'p_pal', name: 'Sleepy Rook' };
    await game('r1', [me, pal], [{ id: 'p_x', name: 'X' }], 'white', 1000);
    await game('r2', [{ id: 'p_y', name: 'Y' }], [me, pal], 'white', 2000);
    const r = await t.api(`/players/${g.user.id}`);
    expect(r.status).toBe(200);
    expect(r.body.player).toEqual({ id: g.user.id, username: g.user.username });
    expect(r.body.record).toMatchObject({ wins: 1, losses: 1, draws: 0, games: 2 });
    expect(r.body.partners).toEqual([{ id: 'p_pal', name: 'Sleepy Rook', games: 2, wins: 1 }]);
    expect(r.body.games.map((x: { roomId: string; outcome: string }) => [x.roomId, x.outcome])).toEqual([['r2', 'loss'], ['r1', 'win']]);
    expect(r.body.games[0]).toMatchObject({ side: 'black', team: ['Sleepy Rook'], opponents: ['Y'] });
  });

  it('unknown players are a 404', async () => {
    expect((await t.api('/players/p_nobody')).status).toBe(404);
  });

  it('signing in on a second device links that guest\'s past games', async () => {
    const phone = await t.guest();
    const laptop = await t.guest();
    await game('r-phone', [{ id: phone.user.id, name: phone.user.username }], [{ id: 'p_o', name: 'O' }], 'white');
    await game('r-laptop', [{ id: laptop.user.id, name: laptop.user.username }], [{ id: 'p_o', name: 'O' }], 'black');
    const a = await t.signIn('rook@example.com', phone.token);
    await t.signIn('rook@example.com', laptop.token);
    const r = await t.api(`/players/${a.user.id}`);
    expect(r.body.player).toMatchObject({ username: toUsername(phone.user.username), verified: true });
    expect(r.body.games.map((x: { roomId: string }) => x.roomId).sort()).toEqual(['r-laptop', 'r-phone']);
    expect(r.body.record).toMatchObject({ wins: 1, losses: 1 });
    // the laptop guest's old page and leaderboard row are the account now
    const old = await t.api(`/players/${laptop.user.id}`);
    expect(old.body.player).toMatchObject({ id: a.user.id, username: toUsername(phone.user.username), verified: true });
    expect(old.body.record).toMatchObject({ wins: 1, losses: 1 });
    await t.store.addScore({ period: 'daily', key: bucket('daily', new Date()).key, userId: laptop.user.id, name: laptop.user.username, outcome: 'win', expiresAt: new Date(Date.now() + 86_400_000) });
    expect((await t.api('/leaderboard?period=daily')).body.rows[0]).toMatchObject({ userId: laptop.user.id, username: toUsername(phone.user.username), verified: true });
  });

  it('accounts can add X and Instagram handles; guests cannot', async () => {
    const g = await t.guest();
    expect((await t.api('/me/socials', { method: 'PATCH', token: g.token, json: { x: 'rook', instagram: '' } })).status).toBe(403);
    const a = await t.signIn('rook@example.com', g.token);
    await game('r1', [{ id: a.user.id, name: a.user.username }], [{ id: 'p_o', name: 'O' }], 'white');
    expect((await t.api('/me/socials', { method: 'PATCH', token: a.token, json: { x: 'not a handle', instagram: '' } })).status).toBe(400);
    expect((await t.api('/me/socials', { method: 'PATCH', token: a.token, json: { x: 'https://x.com/rook', instagram: '' } })).status).toBe(400);
    const ok = await t.api('/me/socials', { method: 'PATCH', token: a.token, json: { x: '@quiet_rook', instagram: 'quiet.rook' } });
    expect(ok.body).toEqual({ x: 'quiet_rook', instagram: 'quiet.rook' });
    expect((await t.api(`/players/${a.user.id}`)).body.player).toMatchObject({ verified: true, x: 'quiet_rook', instagram: 'quiet.rook' });
    // the leaderboard only carries the check mark
    await t.store.addScore({ period: 'daily', key: bucket('daily', new Date()).key, userId: a.user.id, name: a.user.username, outcome: 'win', expiresAt: new Date(Date.now() + 86_400_000) });
    const lb = await t.api('/leaderboard?period=daily');
    expect(lb.body.rows[0]).toMatchObject({ userId: a.user.id, verified: true });
    // a rename shows on the board right away for accounts
    await t.api('/me', { method: 'PATCH', token: a.token, json: { username: 'LoudRook' } });
    expect((await t.api('/leaderboard?period=daily')).body.rows[0].username).toBe('LoudRook');
    expect(lb.body.rows[0].x).toBeUndefined();
    await t.api('/me/socials', { method: 'PATCH', token: a.token, json: { x: '', instagram: '' } });
    expect((await t.api(`/players/${a.user.id}`)).body.player.x).toBeUndefined();
  });

  it('new accounts must pick a username; picking one clears that', async () => {
    const g = await t.guest();
    const a = await t.signIn('rook@example.com', g.token);
    expect(a.user).toMatchObject({ needsName: true });
    const picked = await t.api('/me', { method: 'PATCH', token: a.token, json: { username: 'QuietRook' } });
    expect(picked.status).toBe(200);
    const again = await t.signIn('rook@example.com');
    expect(again.user).toMatchObject({ username: 'QuietRook' });
    expect(again.user.needsName).toBeUndefined();
  });

  it('checks whether a username is free', async () => {
    const a = await t.signIn('rook@example.com');
    await t.api('/me', { method: 'PATCH', token: a.token, json: { username: 'QuietRook' } });
    expect((await t.api('/names/available?name=quietrook')).body).toEqual({ available: false, reason: 'taken' });
    expect((await t.api('/names/available?name=LoudRook')).body).toEqual({ available: true });
    expect((await t.api('/names/available?name=x')).body).toEqual({ available: false, reason: 'invalid' });
    // your own name counts as available to you
    expect((await t.api('/names/available?name=QuietRook', { token: (await t.signIn('rook@example.com')).token })).body).toEqual({ available: true });
  });

  it('profile games carry the final position', async () => {
    const g = await t.guest();
    await t.store.saveGame({
      roomId: 'r9', gameType: 'blitz', result: 'checkmate', reason: 'checkmate', winningColor: 'white', timeControl: null,
      whiteTeam: [{ id: g.user.id, name: 'me' }], blackTeam: [{ id: 'p_o', name: 'O' }], whiteTeamUserIds: [g.user.id], blackTeamUserIds: ['p_o'], userIds: [g.user.id, 'p_o'],
      gameHistory: [{ move: 'e4', sanMove: 'e4', lanMove: 'e2e4', userId: g.user.id, username: 'me', fen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1' }],
      timestamp: new Date(),
    });
    const r = await t.api(`/players/${g.user.id}`);
    expect(r.body.games[0]).toMatchObject({ fen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1', lastMove: 'e2e4' });
  });

  it('the player token says when you are signed in', async () => {
    const a = await t.signIn('rook@example.com');
    expect((await t.api('/me', { token: a.token })).body.user).toMatchObject({ verified: true });
    const g = await t.guest();
    expect((await t.api('/me', { token: g.token })).body.user.verified).toBeUndefined();
  });
});

describe('grey check in rooms', () => {
  it('signed-in players carry it on their seat, in the crowd and in chat; guests do not', async () => {
    const a = await t.signIn('rook@example.com');
    const rook = await t.client(a.token);
    const guest = await t.player();
    const created = await rook.emitWithAck('room:create', { timeControl: 'untimed' });
    if (!created.ok) throw new Error(created.error);
    await rook.emitWithAck('room:join', { roomId: created.roomId });
    const joined = await guest.socket.emitWithAck('room:join', { roomId: created.roomId });
    if (!joined.ok) throw new Error(joined.error);
    const seats = [...joined.room.game.teams.w, ...joined.room.game.teams.b];
    expect(seats.find((p) => p.id === a.user.id)?.verified).toBe(true);
    expect(seats.find((p) => p.id === guest.user.id)?.verified).toBeUndefined();
    await rook.emitWithAck('chat:send', { roomId: created.roomId, text: 'gl hf' });
    const room = t.server.rooms.get(created.roomId)!;
    expect(room.chat.at(-1)).toMatchObject({ userId: a.user.id, verified: true });
  });
});
