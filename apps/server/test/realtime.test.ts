import { nextMover, type RoomSnapshot } from '@relay-chess/game';
import { io as connect } from 'socket.io-client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { next, nextState, sleep, startServer, type Player } from './helpers';

let t: Awaited<ReturnType<typeof startServer>>;
beforeEach(async () => (t = await startServer({ abandonMs: 100 })));
afterEach(async () => t.stop());

/** Create a private room as players[0] and have everyone join. */
async function privateRoom(players: Player[], timeControl = 'untimed') {
  const created = await players[0]!.socket.emitWithAck('room:create', { timeControl });
  if (!created.ok) throw new Error(created.error);
  let room!: RoomSnapshot;
  for (const p of players) {
    const r = await p.socket.emitWithAck('room:join', { roomId: created.roomId });
    if (!r.ok) throw new Error(r.error);
    room = r.room;
  }
  return room;
}

/** Play a sequence of moves, each by whoever the relay says is next. */
async function play(players: Player[], roomId: string, moves: [string, string][]) {
  let state = (await players[0]!.socket.emitWithAck('room:join', { roomId })) as { ok: true; room: RoomSnapshot };
  let room = state.room;
  for (const [from, to] of moves) {
    const mover = nextMover(room.game)!;
    const p = players.find((x) => x.user.id === mover.id)!;
    const update = nextState(p.socket, (r) => r.game.moves.length > room.game.moves.length);
    const r = await p.socket.emitWithAck('game:move', { roomId, from, to });
    expect(r).toEqual({ ok: true });
    room = await update;
  }
  return room;
}

const FOOLS_MATE: [string, string][] = [['f2', 'f3'], ['e7', 'e5'], ['g2', 'g4'], ['d8', 'h4']];

describe('socket auth', () => {
  it('rejects connections without a valid token', async () => {
    const s = connect(t.url, { auth: { token: 'nope' }, transports: ['websocket'], forceNew: true });
    const err = await new Promise<Error>((r) => s.once('connect_error', r));
    expect(err.message).toBe('unauthorized');
    s.disconnect();
  });
});

describe('private rooms', () => {
  it('auto-seats joiners into balanced teams', async () => {
    const ps = await Promise.all([1, 2, 3, 4].map(() => t.player()));
    const room = await privateRoom(ps);
    expect(room.game.teams.w).toHaveLength(2);
    expect(room.game.teams.b).toHaveLength(2);
    expect(room.isPrivate).toBe(true);
  });

  it('enforces the relay and legality on the server, then records the result', async () => {
    const ps = await Promise.all([1, 2, 3, 4].map(() => t.player()));
    const room = await privateRoom(ps);

    const first = nextMover(room.game)!;
    const notFirst = ps.find((p) => p.user.id !== first.id)!;
    expect(await notFirst.socket.emitWithAck('game:move', { roomId: room.id, from: 'e2', to: 'e4' })).toEqual({
      ok: false,
      error: 'not-your-turn',
    });
    const mover = ps.find((p) => p.user.id === first.id)!;
    expect(await mover.socket.emitWithAck('game:move', { roomId: room.id, from: 'e2', to: 'e5' })).toEqual({
      ok: false,
      error: 'illegal-move',
    });
    expect(await mover.socket.emitWithAck('game:move', { roomId: room.id, from: 'zz', to: 'e5' })).toEqual({
      ok: false,
      error: 'invalid-input',
    });

    const end = await play(ps, room.id, FOOLS_MATE);
    expect(end.game.status).toBe('over');
    expect(end.game.result).toEqual({ winner: 'b', reason: 'checkmate' });

    await t.server.rooms.get(room.id)!.saved;
    const saved = await t.store.getGame(room.id);
    expect(saved).toMatchObject({ result: 'checkmate', winningColor: 'black', reason: 'checkmate' });
    expect(saved!.gameHistory.map((m) => m.sanMove)).toEqual(['f3', 'e5', 'g4', 'Qh4#']);

    const winners = new Set(end.game.teams.b.map((p) => p.id));
    for (const period of ['daily', 'weekly']) {
      const board = (await t.api(`/leaderboard?period=${period}`)).body;
      expect(board.total).toBe(4);
      expect(board.resetsAt).toBeTruthy();
      for (const row of board.rows) expect(row.wins).toBe(winners.has(row.userId) ? 1 : 0);
      expect(board.rows[0].username).toBeTruthy();
    }
    const pos = (await t.api(`/leaderboard/position?userId=${[...winners][0]}`)).body;
    expect(pos.rank).toBeLessThanOrEqual(2);
  });

  it('uses your current nickname on the leaderboard', async () => {
    const ps = await Promise.all([1, 2].map(() => t.player()));
    const renamed = await t.api('/me', { method: 'PATCH', token: ps[0]!.token, json: { username: 'Queen Bee' } });
    const s = await t.client(renamed.body.token);
    const players = [{ ...ps[0]!, socket: s }, ps[1]!];
    const room = await privateRoom(players);
    const end = await play(players, room.id, FOOLS_MATE);
    await t.server.rooms.get(end.id)!.saved;
    const names = (await t.api('/leaderboard')).body.rows.map((r: { username: string }) => r.username);
    expect(names).toContain('Queen Bee');
  });

  it('late joiners spectate; spectators can chat but not move', async () => {
    const ps = await Promise.all([1, 2].map(() => t.player()));
    const room = await privateRoom(ps);
    await play(ps, room.id, [['e2', 'e4']]);

    const spec = await t.player();
    const joined = await spec.socket.emitWithAck('room:join', { roomId: room.id });
    if (!joined.ok) throw new Error(joined.error);
    expect(joined.room.spectators.map((s) => s.id)).toContain(spec.user.id);
    expect(await spec.socket.emitWithAck('game:move', { roomId: room.id, from: 'e7', to: 'e5' })).toMatchObject({ ok: false });

    const heard = next(ps[0]!.socket, 'chat:message');
    expect(await spec.socket.emitWithAck('chat:send', { roomId: room.id, text: '  nice opening  ' })).toEqual({ ok: true });
    const [{ message }] = await heard;
    expect(message).toMatchObject({ userId: spec.user.id, name: spec.user.username, text: 'nice opening' });
  });

  it('cannot act in a room you have not joined', async () => {
    const ps = await Promise.all([1, 2].map(() => t.player()));
    const room = await privateRoom(ps);
    const outsider = await t.player();
    expect(await outsider.socket.emitWithAck('chat:send', { roomId: room.id, text: 'hi' })).toEqual({ ok: false, error: 'not-in-room' });
  });

  it('seats and time control can change only before the first move', async () => {
    const ps = await Promise.all([1, 2, 3].map(() => t.player()));
    const room = await privateRoom(ps);
    const p = ps[2]!;
    const target = room.game.teams.w.some((x) => x.id === p.user.id) ? 'b' : 'w';
    expect(await p.socket.emitWithAck('room:seat', { roomId: room.id, team: target })).toEqual({ ok: true });
    expect(await p.socket.emitWithAck('room:time', { roomId: room.id, timeControl: '3+2' })).toEqual({ ok: true });
    expect(await p.socket.emitWithAck('room:time', { roomId: room.id, timeControl: '99+0' })).toEqual({ ok: false, error: 'invalid-input' });
    const after = await play(ps, room.id, [['e2', 'e4']]);
    expect(after.game.timeControl).toEqual({ initialMs: 180_000, incrementMs: 2000 });
    expect(await p.socket.emitWithAck('room:seat', { roomId: room.id, team: 'spectator' })).toEqual({ ok: false, error: 'not-waiting' });
  });

  it('rematch swaps colors and is shared by everyone', async () => {
    const ps = await Promise.all([1, 2].map(() => t.player()));
    const room = await privateRoom(ps);
    const end = await play(ps, room.id, FOOLS_MATE);
    const announced = next(ps[1]!.socket, 'room:rematch');
    const a = await ps[0]!.socket.emitWithAck('game:rematch', { roomId: room.id });
    const b = await ps[1]!.socket.emitWithAck('game:rematch', { roomId: room.id });
    if (!a.ok || !b.ok) throw new Error('rematch failed');
    expect(a.roomId).toBe(b.roomId);
    expect((await announced)[0].rematchRoomId).toBe(a.roomId);
    const rematch = t.server.rooms.get(a.roomId)!;
    expect(rematch.game.teams.w.map((p) => p.id)).toEqual(end.game.teams.b.map((p) => p.id));
  });

  it('a team that leaves mid-game forfeits', async () => {
    const ps = await Promise.all([1, 2].map(() => t.player()));
    const room = await privateRoom(ps);
    const after = await play(ps, room.id, [['e2', 'e4'], ['e7', 'e5']]);
    const black = ps.find((p) => p.user.id === after.game.teams.b[0]!.id)!;
    const white = ps.find((p) => p !== black)!;
    const over = nextState(white.socket, (r) => r.game.status === 'over', 1000);
    black.socket.disconnect();
    expect((await over).game.result).toEqual({ winner: 'w', reason: 'abandoned' });
  });

  it('flags on time, enforced by the server', async () => {
    const [a, b] = await Promise.all([1, 2].map(() => t.player()));
    const room = t.server.rooms.create({
      isPrivate: true,
      timeControl: { initialMs: 150, incrementMs: 0 },
      teams: { w: [{ id: a!.user.id, name: 'a', guest: true }], b: [{ id: b!.user.id, name: 'b', guest: true }] },
    });
    await a!.socket.emitWithAck('room:join', { roomId: room.id });
    await b!.socket.emitWithAck('room:join', { roomId: room.id });
    await a!.socket.emitWithAck('game:move', { roomId: room.id, from: 'e2', to: 'e4' });
    await b!.socket.emitWithAck('game:move', { roomId: room.id, from: 'e7', to: 'e5' });
    const over = await nextState(a!.socket, (r) => r.game.status === 'over', 1000);
    expect(over.game.result).toEqual({ winner: 'b', reason: 'timeout' });
  });
});

describe('matchmaking', () => {
  it('four solo players with the same time control get a public 2v2', async () => {
    const ps = await Promise.all([1, 2, 3, 4].map(() => t.player()));
    const found = ps.map((p) => next(p.socket, 'match:found'));
    for (const p of ps) expect(await p.socket.emitWithAck('queue:join', { timeControl: '5+3' })).toEqual({ ok: true });
    const ids = (await Promise.all(found)).map(([m]) => m.roomId);
    expect(new Set(ids).size).toBe(1);
    const room = t.server.rooms.get(ids[0]!)!;
    expect(room.isPrivate).toBe(false);
    expect(room.game.teams.w).toHaveLength(2);
    expect(room.game.teams.b).toHaveLength(2);
    expect(room.game.timeControl).toEqual({ initialMs: 300_000, incrementMs: 3000 });
  });

  it('does not mix time controls and only offers the listed ones', async () => {
    const ps = await Promise.all([1, 2, 3, 4].map(() => t.player()));
    for (const [i, p] of ps.entries()) await p.socket.emitWithAck('queue:join', { timeControl: i < 3 ? '5+3' : '10+0' });
    expect(t.server.rooms.size).toBe(0);
    expect(await ps[0]!.socket.emitWithAck('queue:join', { timeControl: '7+7' })).toEqual({ ok: false, error: 'invalid-input' });
  });

  it('a party queues as a team against solo players', async () => {
    const [host, friend, s1, s2] = await Promise.all([1, 2, 3, 4].map(() => t.player()));
    const partyId = 'party-abc123';
    expect(await host!.socket.emitWithAck('party:join', { partyId })).toMatchObject({ ok: true });
    const joined = await friend!.socket.emitWithAck('party:join', { partyId });
    if (!joined.ok) throw new Error(joined.error);
    expect(joined.party.members.map((m) => m.isHost)).toEqual([true, false]);

    expect(await friend!.socket.emitWithAck('party:queue', { partyId, timeControl: '10+0' })).toEqual({ ok: false, error: 'not-host' });
    const found = [host, friend, s1, s2].map((p) => next(p!.socket, 'match:found'));
    expect(await host!.socket.emitWithAck('party:queue', { partyId, timeControl: '10+0' })).toEqual({ ok: true });
    await s1!.socket.emitWithAck('queue:join', { timeControl: '10+0' });
    await s2!.socket.emitWithAck('queue:join', { timeControl: '10+0' });
    const [roomId] = (await Promise.all(found)).map(([m]) => m.roomId);
    const room = t.server.rooms.get(roomId!)!;
    expect(room.game.teams.w.map((p) => p.id).sort()).toEqual([host!.user.id, friend!.user.id].sort());
  });

  it('lobby watchers see stats and live public games', async () => {
    const watcher = await t.player();
    const w = await watcher.socket.emitWithAck('lobby:watch');
    if (!w.ok) throw new Error(w.error);
    expect(w.stats.online).toBeGreaterThanOrEqual(1);
    const live = next(watcher.socket, 'live:games', (games) => games.length === 1);
    const ps = await Promise.all([1, 2, 3, 4].map(() => t.player()));
    for (const p of ps) await p.socket.emitWithAck('queue:join', { timeControl: 'untimed' });
    const [games] = await live;
    expect(games[0]).toMatchObject({ moveCount: 0, timeControl: 'untimed' });
    await sleep(10);
  });
});
