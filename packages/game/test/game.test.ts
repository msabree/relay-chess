import { describe, expect, it } from 'vitest';
import {
  abort,
  applyMove,
  checkTimeout,
  createGame,
  join,
  nextMover,
  offerDraw,
  remainingMs,
  resign,
  setConnected,
  start,
  type GameState,
  type Outcome,
} from '../src';

const unwrap = (o: Outcome): GameState => {
  if (!o.ok) throw new Error(`expected ok, got ${o.error}`);
  return o.state;
};

// White: ana (seat 1), ben (seat 2). Black: cat (seat 1), dan (seat 2).
function seated(opts: Parameters<typeof createGame>[0] = { id: 'g1' }) {
  let s = createGame(opts);
  s = unwrap(join(s, { id: 'ana', name: 'Ana' }, 'w'));
  s = unwrap(join(s, { id: 'ben', name: 'Ben' }, 'w'));
  s = unwrap(join(s, { id: 'cat', name: 'Cat' }, 'b'));
  s = unwrap(join(s, { id: 'dan', name: 'Dan' }, 'b'));
  return s;
}
const playing = (opts?: Parameters<typeof createGame>[0], now = 0) => unwrap(start(seated(opts), now));
const mv = (s: GameState, who: string, from: string, to: string, now = 0) =>
  unwrap(applyMove(s, who, { from, to }, now));

describe('seating', () => {
  it('fills seats in join order and rejects a full team', () => {
    const s = seated();
    expect(s.teams.w.map((p) => p.id)).toEqual(['ana', 'ben']);
    expect(join(s, { id: 'eve', name: 'Eve' }, 'w')).toEqual({ ok: false, error: 'team-full' });
  });

  it('switching teams frees the old seat', () => {
    let s = createGame({ id: 'g' });
    s = unwrap(join(s, { id: 'ana', name: 'Ana' }, 'w'));
    s = unwrap(join(s, { id: 'ana', name: 'Ana' }, 'b'));
    expect(s.teams.w).toEqual([]);
    expect(s.teams.b.map((p) => p.id)).toEqual(['ana']);
  });

  it('cannot start until every seat is filled', () => {
    let s = createGame({ id: 'g' });
    s = unwrap(join(s, { id: 'ana', name: 'Ana' }, 'w'));
    expect(start(s, 0)).toEqual({ ok: false, error: 'seats-not-filled' });
  });

  it('cannot change seats after the game starts', () => {
    expect(join(playing(), { id: 'eve', name: 'Eve' }, 'w')).toEqual({ ok: false, error: 'not-waiting' });
  });
});

describe('relay rotation', () => {
  it('teammates alternate in seat order', () => {
    let s = playing();
    const order: string[] = [];
    const line: [string, string][] = [
      ['e2', 'e4'], ['e7', 'e5'], ['g1', 'f3'], ['b8', 'c6'], ['f1', 'c4'], ['f8', 'c5'],
    ];
    for (const [from, to] of line) {
      const who = nextMover(s)!.id;
      order.push(who);
      s = mv(s, who, from, to);
    }
    expect(order).toEqual(['ana', 'cat', 'ben', 'dan', 'ana', 'cat']);
    expect(s.moves.map((m) => m.playerId)).toEqual(order);
  });

  it('rejects a teammate moving out of turn', () => {
    const s = playing();
    expect(applyMove(s, 'ben', { from: 'e2', to: 'e4' }, 0)).toEqual({ ok: false, error: 'not-your-turn' });
  });

  it('rejects the other team moving', () => {
    const s = playing();
    expect(applyMove(s, 'cat', { from: 'e7', to: 'e5' }, 0)).toEqual({ ok: false, error: 'not-your-turn' });
  });

  it('rejects spectators and strangers', () => {
    expect(applyMove(playing(), 'zed', { from: 'e2', to: 'e4' }, 0)).toEqual({ ok: false, error: 'not-your-turn' });
  });

  it('skips a disconnected teammate', () => {
    let s = playing();
    s = mv(s, 'ana', 'e2', 'e4');
    s = mv(s, 'cat', 'e7', 'e5');
    s = setConnected(s, 'ben', false);
    expect(nextMover(s)!.id).toBe('ana');
    s = mv(s, 'ana', 'g1', 'f3');
    s = setConnected(s, 'ben', true);
    s = mv(s, 'dan', 'b8', 'c6');
    expect(nextMover(s)!.id).toBe('ben');
  });

  it('keeps the seat on move when the whole team is disconnected', () => {
    let s = playing();
    s = setConnected(s, 'ana', false);
    s = setConnected(s, 'ben', false);
    expect(nextMover(s)!.id).toBe('ana');
  });
});

describe('move validation', () => {
  it('rejects illegal moves and leaves state untouched', () => {
    const s = playing();
    expect(applyMove(s, 'ana', { from: 'e2', to: 'e5' }, 0)).toEqual({ ok: false, error: 'illegal-move' });
    expect(s.moves).toEqual([]);
  });

  it('does not mutate the input state', () => {
    const s = playing();
    const before = structuredClone(s);
    mv(s, 'ana', 'e2', 'e4');
    expect(s).toEqual(before);
  });

  it('supports promotion choice', () => {
    let s = unwrap(start(seated(), 0));
    // fast route to a promotion: a-pawn marches and captures on b7 then promotes on a8
    const line: [string, string, string][] = [
      ['ana', 'a2', 'a4'], ['cat', 'h7', 'h6'], ['ben', 'a4', 'a5'], ['dan', 'h6', 'h5'],
      ['ana', 'a5', 'a6'], ['cat', 'h5', 'h4'], ['ben', 'a6', 'b7'], ['dan', 'h4', 'h3'],
    ];
    for (const [who, from, to] of line) s = mv(s, who, from, to);
    s = unwrap(applyMove(s, 'ana', { from: 'b7', to: 'a8', promotion: 'n' }, 0));
    expect(s.moves.at(-1)!.san).toBe('bxa8=N');
  });
});

describe('results', () => {
  it("detects checkmate (fool's mate) and credits the mating team", () => {
    let s = playing();
    s = mv(s, 'ana', 'f2', 'f3');
    s = mv(s, 'cat', 'e7', 'e5');
    s = mv(s, 'ben', 'g2', 'g4');
    s = mv(s, 'dan', 'd8', 'h4');
    expect(s.status).toBe('over');
    expect(s.result).toEqual({ winner: 'b', reason: 'checkmate' });
    expect(applyMove(s, 'ana', { from: 'e2', to: 'e4' }, 0)).toEqual({ ok: false, error: 'not-playing' });
  });

  it('resign gives the win to the other team', () => {
    const s = unwrap(resign(playing(), 'ben'));
    expect(s.result).toEqual({ winner: 'b', reason: 'resign', by: 'ben' });
  });

  it('abort only before both sides have moved', () => {
    let s = playing();
    s = mv(s, 'ana', 'e2', 'e4');
    expect(unwrap(abort(s, 'cat')).result?.reason).toBe('aborted');
    s = mv(s, 'cat', 'e7', 'e5');
    expect(abort(s, 'cat')).toEqual({ ok: false, error: 'cannot-abort' });
  });

  it('a draw needs both teams: offer then accept', () => {
    let s = unwrap(offerDraw(playing(), 'ana'));
    expect(s.drawOfferBy).toBe('w');
    expect(unwrap(offerDraw(s, 'ben')).status).toBe('playing');
    s = unwrap(offerDraw(s, 'dan'));
    expect(s.result).toEqual({ winner: null, reason: 'agreement' });
  });

  it('moving declines the opponent draw offer', () => {
    let s = unwrap(offerDraw(playing(), 'cat'));
    s = mv(s, 'ana', 'e2', 'e4');
    expect(s.drawOfferBy).toBeNull();
  });
});

describe('clocks', () => {
  const tc = { id: 'g', timeControl: { initialMs: 60_000, incrementMs: 2_000 } };

  it('do not run until both sides have moved', () => {
    let s = playing(tc, 0);
    s = mv(s, 'ana', 'e2', 'e4', 10_000);
    s = mv(s, 'cat', 'e7', 'e5', 20_000);
    expect(s.clocks).toEqual({ w: 60_000, b: 60_000 });
  });

  it('deduct thinking time and add the increment', () => {
    let s = playing(tc, 0);
    s = mv(s, 'ana', 'e2', 'e4', 0);
    s = mv(s, 'cat', 'e7', 'e5', 0);
    s = mv(s, 'ben', 'g1', 'f3', 5_000);
    expect(s.clocks!.w).toBe(60_000 - 5_000 + 2_000);
    expect(remainingMs(s, 8_000)!.b).toBe(57_000);
  });

  it('flag fall ends the game for the side to move', () => {
    let s = playing(tc, 0);
    s = mv(s, 'ana', 'e2', 'e4', 0);
    s = mv(s, 'cat', 'e7', 'e5', 0);
    expect(checkTimeout(s, 59_999).status).toBe('playing');
    const over = checkTimeout(s, 60_000);
    expect(over.result).toEqual({ winner: 'b', reason: 'timeout' });
  });

  it('a move sent after the flag fell ends on time instead of playing', () => {
    let s = playing(tc, 0);
    s = mv(s, 'ana', 'e2', 'e4', 0);
    s = mv(s, 'cat', 'e7', 'e5', 0);
    const late = unwrap(applyMove(s, 'ben', { from: 'g1', to: 'f3' }, 61_000));
    expect(late.result?.reason).toBe('timeout');
    expect(late.moves).toHaveLength(2);
  });
});
