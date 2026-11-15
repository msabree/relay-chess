import { applyPatch, nextMover, type RoomPatch, type RoomSnapshot } from '@relay-chess/game';
import { io as connect } from 'socket.io-client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { gapsOf, next, nextState, roomOf, sleep, startServer, type Player } from './helpers';

let t: Awaited<ReturnType<typeof startServer>>;
beforeEach(async () => (t = await startServer({ abandonMs: 100, lobbyMs: 150 })));
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

/** Two players opt into "start now" and get a 1v1; both have joined the room. */
async function quickMatch() {
  const [a, b] = await Promise.all([1, 2].map(() => t.player()));
  for (const p of [a, b]) await p!.socket.emitWithAck('queue:join', { timeControl: '5+5' });
  const found = next(a!.socket, 'match:found');
  for (const p of [a, b]) await p!.socket.emitWithAck('queue:ready');
  const [{ roomId }] = await found;
  for (const p of [a, b]) await p!.socket.emitWithAck('room:join', { roomId });
  return { roomId, a: a!, b: b! };
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

  it('players can mute spectator chat during the game; it opens again after', async () => {
    const ps = await Promise.all([1, 2].map(() => t.player()));
    const room = await privateRoom(ps);
    await play(ps, room.id, [['f2', 'f3']]);
    const spec = await t.player();
    await spec.socket.emitWithAck('room:join', { roomId: room.id });

    expect(await spec.socket.emitWithAck('room:mute-spectators', { roomId: room.id, muted: true })).toEqual({ ok: false, error: 'not-seated' });
    const muted = nextState(spec.socket, (r) => r.spectatorsMuted);
    expect(await ps[0]!.socket.emitWithAck('room:mute-spectators', { roomId: room.id, muted: true })).toEqual({ ok: true });
    await muted;
    expect(await spec.socket.emitWithAck('chat:send', { roomId: room.id, text: 'play Qh4' })).toEqual({ ok: false, error: 'spectators-muted' });
    expect(await ps[1]!.socket.emitWithAck('chat:send', { roomId: room.id, text: 'gg soon' })).toEqual({ ok: true });

    await play(ps, room.id, [['e7', 'e5'], ['g2', 'g4'], ['d8', 'h4']]); // mate: game over
    expect(await spec.socket.emitWithAck('chat:send', { roomId: room.id, text: 'called it' })).toEqual({ ok: true });
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

  it('spectators stay spectators in a rematch', async () => {
    const ps = await Promise.all([1, 2].map(() => t.player()));
    const room = await privateRoom(ps);
    await play(ps, room.id, FOOLS_MATE);
    const watcher = await t.player();
    await watcher.socket.emitWithAck('room:join', { roomId: room.id });
    const r = await ps[0]!.socket.emitWithAck('game:rematch', { roomId: room.id });
    if (!r.ok) throw new Error('rematch failed');
    const joined = await watcher.socket.emitWithAck('room:join', { roomId: r.roomId });
    if (!joined.ok) throw new Error(joined.error);
    const seated = [...joined.room.game.teams.w, ...joined.room.game.teams.b].map((p) => p.id);
    expect(seated).not.toContain(watcher.user.id);
    expect(seated).toHaveLength(2);
    expect(t.server.rooms.get(r.roomId)!.spectators.has(watcher.user.id)).toBe(true);
  });

  it('a team that leaves mid-game forfeits', async () => {
    const ps = await Promise.all([1, 2].map(() => t.player()));
    const room = await privateRoom(ps);
    const after = await play(ps, room.id, [['e2', 'e4'], ['e7', 'e5']]);
    const black = ps.find((p) => p.user.id === after.game.teams.b[0]!.id)!;
    const white = ps.find((p) => p !== black)!;
    const away = nextState(white.socket, (r) => !!r.deadlines.b);
    const over = nextState(white.socket, (r) => r.game.status === 'over', 1000);
    black.socket.disconnect();
    expect((await away).deadlines.b).toBeGreaterThan(Date.now());
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
    for (const p of ps) expect(await p.socket.emitWithAck('queue:join', { timeControl: '5+5' })).toEqual({ ok: true });
    const ids = (await Promise.all(found)).map(([m]) => m.roomId);
    expect(new Set(ids).size).toBe(1);
    const room = t.server.rooms.get(ids[0]!)!;
    expect(room.isPrivate).toBe(false);
    expect(room.game.teams.w).toHaveLength(2);
    expect(room.game.teams.b).toHaveLength(2);
    expect(room.game.timeControl).toEqual({ initialMs: 300_000, incrementMs: 5000 });
  });

  it('does not mix time controls and only offers the listed ones', async () => {
    const ps = await Promise.all([1, 2, 3, 4].map(() => t.player()));
    for (const [i, p] of ps.entries()) await p.socket.emitWithAck('queue:join', { timeControl: i < 3 ? '5+5' : 'untimed' });
    expect(t.server.rooms.size).toBe(0);
    expect(await ps[0]!.socket.emitWithAck('queue:join', { timeControl: '7+7' })).toEqual({ ok: false, error: 'invalid-input' });
    expect(await ps[0]!.socket.emitWithAck('queue:join', { timeControl: '10+0' })).toEqual({ ok: false, error: 'invalid-input' });
  });

  it('a party queues as a team against solo players', async () => {
    const [host, friend, s1, s2] = await Promise.all([1, 2, 3, 4].map(() => t.player()));
    const partyId = 'party-abc123';
    expect(await host!.socket.emitWithAck('party:join', { partyId })).toMatchObject({ ok: true });
    const joined = await friend!.socket.emitWithAck('party:join', { partyId });
    if (!joined.ok) throw new Error(joined.error);
    expect(joined.party.members.map((m) => m.isHost)).toEqual([true, false]);

    expect(await friend!.socket.emitWithAck('party:queue', { partyId, timeControl: 'untimed' })).toEqual({ ok: false, error: 'not-host' });
    const found = [host, friend, s1, s2].map((p) => next(p!.socket, 'match:found'));
    expect(await host!.socket.emitWithAck('party:queue', { partyId, timeControl: 'untimed' })).toEqual({ ok: true });
    await s1!.socket.emitWithAck('queue:join', { timeControl: 'untimed' });
    await s2!.socket.emitWithAck('queue:join', { timeControl: 'untimed' });
    const [roomId] = (await Promise.all(found)).map(([m]) => m.roomId);
    const room = t.server.rooms.get(roomId!)!;
    expect(room.game.teams.w.map((p) => p.id).sort()).toEqual([host!.user.id, friend!.user.id].sort());
  });

  it('two players who choose "start now" get a 1v1; the rest keep waiting', async () => {
    const [a, b, c] = await Promise.all([1, 2, 3].map(() => t.player()));
    expect(await a!.socket.emitWithAck('queue:ready')).toEqual({ ok: false, error: 'not-queued' });
    for (const p of [a, b, c]) await p!.socket.emitWithAck('queue:join', { timeControl: '5+5' });
    expect(await a!.socket.emitWithAck('queue:ready')).toEqual({ ok: true });
    expect(t.server.rooms.size).toBe(0); // a lone ready player waits
    expect(t.server.matchmaker.counts().get('5+5')).toEqual({ count: 3, ready: 1 });
    const found = [a, b].map((p) => next(p!.socket, 'match:found'));
    expect(await b!.socket.emitWithAck('queue:ready')).toEqual({ ok: true });
    const [roomId] = (await Promise.all(found)).map(([m]) => m.roomId);
    const room = t.server.rooms.get(roomId!)!;
    expect([room.game.teams.w.length, room.game.teams.b.length]).toEqual([1, 1]);
    expect(t.server.matchmaker.soloTimeControl(c!.user.id)).toBe('5+5'); // c didn't opt in
  });

  it('before the first move, a new identity can take an away seat in a quick match', async () => {
    const { roomId, a, b } = await quickMatch();
    const c = await t.player();
    const away = nextState(a.socket, (r) => !!r.deadlines.b || !!r.deadlines.w);
    b.socket.disconnect();
    const snap = await away;
    const side = snap.deadlines.w ? 'w' : 'b';
    expect(snap.deadlines[side]).toBeGreaterThan(Date.now());
    const joined = await c.socket.emitWithAck('room:join', { roomId });
    expect(joined.ok && joined.room.spectators.some((s) => s.id === c.user.id)).toBe(true);
    const other = side === 'w' ? 'b' : 'w';
    expect(await c.socket.emitWithAck('room:seat', { roomId, team: other })).toEqual({ ok: false, error: 'no-open-seat' });
    const seated = nextState(a.socket, (r) => r.game.teams[side][0]!.id === c.user.id);
    expect(await c.socket.emitWithAck('room:seat', { roomId, team: side })).toEqual({ ok: true });
    expect((await seated).deadlines).toEqual({});
  });

  it('either player can cancel a quick match before the first move', async () => {
    const { roomId, a } = await quickMatch();
    const over = nextState(a.socket, (r) => r.game.status === 'over');
    expect(await a.socket.emitWithAck('game:abort', { roomId })).toEqual({ ok: true });
    expect((await over).game.result).toMatchObject({ winner: null, reason: 'aborted', by: a.user.id });
  });

  it('a quick match closes itself if a seat stays empty before the first move', async () => {
    const { a, b } = await quickMatch();
    const over = nextState(a.socket, (r) => r.game.status === 'over', 1000);
    b.socket.disconnect();
    expect((await over).game.result).toEqual({ winner: null, reason: 'aborted' });
  });

  it('lobby watchers see stats; live watchers see every public game', async () => {
    const watcher = await t.player();
    const w = await watcher.socket.emitWithAck('lobby:watch');
    if (!w.ok) throw new Error(w.error);
    expect(w.stats.online).toBeGreaterThanOrEqual(1);
    expect(await watcher.socket.emitWithAck('live:watch')).toEqual({ ok: true, games: [] });
    const live = next(watcher.socket, 'live:games', (games) => games.length === 1);
    const ps = await Promise.all([1, 2, 3, 4].map(() => t.player()));
    for (const p of ps) await p.socket.emitWithAck('queue:join', { timeControl: 'untimed' });
    const [games] = await live;
    expect(games[0]).toMatchObject({ moveCount: 0, timeControl: 'untimed' });
    await sleep(10);
  });

  it('keeps friend rooms off live games unless a player allows watching, but counts them as playing', async () => {
    const watcher = await t.player();
    const ps = await Promise.all([1, 2, 3, 4].map(() => t.player()));
    const room = await privateRoom(ps);
    // Opened up during setup: still not listed, since joining then takes a seat.
    expect(await ps[0]!.socket.emitWithAck('room:watchable', { roomId: room.id, watchable: true })).toEqual({ ok: true });
    const setup = await watcher.socket.emitWithAck('lobby:watch');
    if (!setup.ok) throw new Error(setup.error);
    expect(setup.games).toEqual([]);
    expect(await ps[0]!.socket.emitWithAck('room:watchable', { roomId: room.id, watchable: false })).toEqual({ ok: true });

    await play(ps, room.id, FOOLS_MATE.slice(0, 2));
    const before = await watcher.socket.emitWithAck('lobby:watch');
    if (!before.ok) throw new Error(before.error);
    expect(before.games).toEqual([]);
    expect(before.stats.playing).toBe(1);

    expect(await watcher.socket.emitWithAck('room:watchable', { roomId: room.id, watchable: true })).toMatchObject({ ok: false });
    await watcher.socket.emitWithAck('live:watch');
    const listed = next(watcher.socket, 'live:games', (games) => games.length === 1);
    const top = next(watcher.socket, 'lobby:games', (games) => games.length === 1);
    expect(await ps[0]!.socket.emitWithAck('room:watchable', { roomId: room.id, watchable: true })).toEqual({ ok: true });
    const [games] = await listed;
    expect(games[0]).toMatchObject({ roomId: room.id, moveCount: 2 });
    await top;

    // Someone arriving from live games mid-game only gets to watch.
    const stranger = await t.player();
    const joined = await stranger.socket.emitWithAck('room:join', { roomId: room.id });
    if (!joined.ok) throw new Error(joined.error);
    expect([...joined.room.game.teams.w, ...joined.room.game.teams.b].map((p) => p.id)).not.toContain(stranger.user.id);
    expect(joined.room.spectators.map((s) => s.id)).toContain(stranger.user.id);
    expect(await stranger.socket.emitWithAck('room:seat', { roomId: room.id, team: 'w' })).toMatchObject({ ok: false });

    const done = next(watcher.socket, 'lobby:stats', (st) => st.playing === 0);
    await play(ps, room.id, FOOLS_MATE.slice(2));
    await done;
  });

  it('home page gets only the top few games, most watched first', async () => {
    const watcher = await t.player();
    const rooms: string[] = [];
    for (let i = 0; i < 6; i++) {
      const ps = await Promise.all([1, 2].map(() => t.player()));
      const room = await privateRoom(ps);
      await ps[0]!.socket.emitWithAck('room:watchable', { roomId: room.id, watchable: true });
      await play(ps, room.id, FOOLS_MATE.slice(0, 2));
      rooms.push(room.id);
    }
    const fan = await t.player();
    await fan.socket.emitWithAck('room:join', { roomId: rooms[4]! });
    await sleep(30);
    const w = await watcher.socket.emitWithAck('lobby:watch');
    if (!w.ok) throw new Error(w.error);
    expect(w.games).toHaveLength(5);
    expect(w.games[0]).toMatchObject({ roomId: rooms[4], spectators: 1 });
    const all = await watcher.socket.emitWithAck('live:watch');
    if (!all.ok) throw new Error(all.error);
    expect(all.games).toHaveLength(6);
  });

  it('spectators coming and going send a small batched crowd update, not the whole room', async () => {
    const ps = await Promise.all([1, 2].map(() => t.player()));
    const room = await privateRoom(ps);
    await play(ps, room.id, FOOLS_MATE.slice(0, 2));
    let states = 0;
    ps[0]!.socket.on('room:state', () => states++);
    const crowd = next(ps[0]!.socket, 'room:crowd', (c) => c.spectatorCount === 25);
    const fans = await Promise.all(Array.from({ length: 25 }, () => t.player()));
    await Promise.all(fans.map((f) => f.socket.emitWithAck('room:join', { roomId: room.id })));
    const [c] = await crowd;
    expect(c.spectators).toHaveLength(20);
    expect(states).toBe(0);

    const late = await t.player();
    const joined = await late.socket.emitWithAck('room:join', { roomId: room.id });
    if (!joined.ok) throw new Error(joined.error);
    expect(joined.room.spectatorCount).toBe(26);
    expect(joined.room.spectators).toHaveLength(20);

    const gone = next(ps[0]!.socket, 'room:crowd', (c) => c.spectatorCount === 25);
    late.socket.disconnect();
    await gone;
    expect(states).toBe(0);
  });
});

describe('room patches', () => {
  // A longer line so the room has real history: 1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. c3 Nf6 5. d4 exd4 6. cxd4 Bb4+
  const ITALIAN: [string, string][] = [
    ['e2', 'e4'], ['e7', 'e5'], ['g1', 'f3'], ['b8', 'c6'], ['f1', 'c4'], ['f8', 'c5'],
    ['c2', 'c3'], ['g8', 'f6'], ['d2', 'd4'], ['e5', 'd4'], ['c3', 'd4'], ['c5', 'b4'],
  ];

  it('moves go out as small patches that rebuild exactly the room a fresh join gets', async () => {
    const ps = await Promise.all([1, 2].map(() => t.player()));
    const room = await privateRoom(ps);
    await play(ps, room.id, ITALIAN.slice(0, 1)); // joiners spectate once the game is on
    const spec = await t.player();
    await spec.socket.emitWithAck('room:join', { roomId: room.id });
    for (let i = 0; i < 5; i++) await ps[0]!.socket.emitWithAck('chat:send', { roomId: room.id, text: `message number ${i} with some words` });

    const sizes: number[] = [];
    let fulls = 0;
    spec.socket.on('room:patch', (p: RoomPatch) => sizes.push(JSON.stringify(p).length));
    spec.socket.on('room:state', () => fulls++);
    await play(ps, room.id, ITALIAN.slice(1));
    await sleep(20);

    // Patches stay the same size however long the game gets, and the whole room never goes out.
    expect(fulls).toBe(0);
    expect(sizes.length).toBeGreaterThanOrEqual(ITALIAN.length - 1);
    expect(Math.max(...sizes)).toBeLessThan(2000);
    expect(Math.abs(sizes.at(-1)! - sizes[0]!)).toBeLessThan(300);

    // What the spectator built from patches equals a fresh join (minus the send time).
    const fresh = (await t.player()).socket;
    const joined = await fresh.emitWithAck('room:join', { roomId: room.id });
    if (!joined.ok) throw new Error(joined.error);
    const built = roomOf(spec.socket, room.id)!;
    const strip = (r: RoomSnapshot) => ({ ...r, serverNow: 0, spectators: [], spectatorCount: 0 });
    expect(strip(built)).toEqual(strip(joined.room));
    // The full room carries every move (and chat); a patch carries one move.
    const perMove = JSON.stringify(joined.room.game.moves[0]).length;
    expect(JSON.stringify(joined.room).length).toBeGreaterThan(Math.max(...sizes) + perMove * (ITALIAN.length - 2));
    expect(gapsOf(spec.socket)).toBe(0);
  });

  it('a missed patch is caught, and an old or repeated one is ignored', async () => {
    const ps = await Promise.all([1, 2].map(() => t.player()));
    const room = await privateRoom(ps);
    const joined = await ps[0]!.socket.emitWithAck('room:join', { roomId: room.id });
    if (!joined.ok) throw new Error(joined.error);
    const base = joined.room;
    const patches: RoomPatch[] = [];
    ps[0]!.socket.on('room:patch', (p: RoomPatch) => patches.push(p));
    await play(ps, room.id, ITALIAN.slice(0, 3));
    await sleep(20);
    expect(patches.length).toBeGreaterThanOrEqual(3);

    const one = applyPatch(base, patches[0]!)!;
    expect(one.game.moves).toHaveLength(1);
    expect(applyPatch(one, patches[0]!)).toBe(one); // repeated: no change
    expect(applyPatch(base, patches[1]!)).toBeNull(); // skipped one: resync
    let r: RoomSnapshot = base;
    for (const p of patches) r = applyPatch(r, p)!;
    expect(r.game.moves.map((m) => m.san)).toEqual(['e4', 'e5', 'Nf3']);
  });
});
