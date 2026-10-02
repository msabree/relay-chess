import { Chess } from 'chess.js';
import type {
  Color,
  GameState,
  MoveInput,
  Outcome,
  Player,
  PlayedMove,
  Result,
  TimeControl,
} from './types';

export const START_FEN = new Chess().fen();
export const DEFAULT_MAX_PER_TEAM = 4;

export const other = (c: Color): Color => (c === 'w' ? 'b' : 'w');
const clone = (s: GameState): GameState => structuredClone(s);
const ok = (state: GameState): Outcome => ({ ok: true, state });
const end = (s: GameState, result: Result): GameState => ({
  ...s,
  status: 'over',
  result,
  drawOfferBy: null,
});

export function createGame(opts: {
  id: string;
  timeControl?: TimeControl | null;
  maxPerTeam?: number;
  teams?: Partial<Record<Color, { id: string; name: string }[]>>;
}): GameState {
  const seat = (p: { id: string; name: string }): Player => ({ id: p.id, name: p.name, connected: true });
  return {
    id: opts.id,
    maxPerTeam: opts.maxPerTeam ?? DEFAULT_MAX_PER_TEAM,
    timeControl: opts.timeControl ?? null,
    status: 'waiting',
    teams: { w: (opts.teams?.w ?? []).map(seat), b: (opts.teams?.b ?? []).map(seat) },
    moves: [],
    fen: START_FEN,
    clocks: null,
    turnStartedAt: null,
    rotation: { w: 0, b: 0 },
    drawOfferBy: null,
    result: null,
  };
}

/** Color whose turn it is on the board. */
export function turn(state: GameState): Color {
  return state.fen.split(' ')[1] === 'b' ? 'b' : 'w';
}

export function colorOf(state: GameState, playerId: string): Color | null {
  if (state.teams.w.some((p) => p.id === playerId)) return 'w';
  if (state.teams.b.some((p) => p.id === playerId)) return 'b';
  return null;
}

/**
 * The player who plays `color`'s next move. Walks seat order from the
 * rotation pointer and skips disconnected players. If nobody on the team
 * is connected, the seat at the pointer is still on move (their clock runs).
 */
export function nextMover(state: GameState, color: Color = turn(state)): Player | undefined {
  const team = state.teams[color];
  if (team.length === 0) return undefined;
  const start = state.rotation[color] % team.length;
  for (let i = 0; i < team.length; i++) {
    const p = team[(start + i) % team.length];
    if (p?.connected) return p;
  }
  return team[start];
}

/** Take (or switch to) a seat on a team. Only before the first move. */
export function join(state: GameState, player: { id: string; name: string }, color: Color): Outcome {
  if (state.status !== 'waiting') return { ok: false, error: 'not-waiting' };
  if (colorOf(state, player.id) === color) return ok(state);
  if (state.teams[color].length >= state.maxPerTeam) return { ok: false, error: 'team-full' };
  const s = clone(state);
  s.teams[other(color)] = s.teams[other(color)].filter((p) => p.id !== player.id);
  s.teams[color].push({ id: player.id, name: player.name, connected: true });
  return ok(s);
}

/** Give up a seat before the first move. During a game, use setConnected instead. */
export function leave(state: GameState, playerId: string): Outcome {
  if (state.status !== 'waiting') return { ok: false, error: 'not-waiting' };
  const s = clone(state);
  s.teams.w = s.teams.w.filter((p) => p.id !== playerId);
  s.teams.b = s.teams.b.filter((p) => p.id !== playerId);
  return ok(s);
}

export function setTimeControl(state: GameState, timeControl: TimeControl | null): Outcome {
  if (state.status !== 'waiting') return { ok: false, error: 'not-waiting' };
  return ok({ ...clone(state), timeControl });
}

export function setConnected(state: GameState, playerId: string, connected: boolean): GameState {
  const s = clone(state);
  for (const c of ['w', 'b'] as const) {
    for (const p of s.teams[c]) if (p.id === playerId) p.connected = connected;
  }
  return s;
}

/** Clocks only run once both sides have made a move (lichess convention). */
const clockRunning = (s: GameState) => s.clocks !== null && s.moves.length >= 2;

/** Remaining time per side at `now`, for display. */
export function remainingMs(state: GameState, now: number): Record<Color, number> | null {
  if (!state.clocks) return null;
  const r = { ...state.clocks };
  if (state.status === 'playing' && clockRunning(state) && state.turnStartedAt !== null) {
    const c = turn(state);
    r[c] = Math.max(0, r[c] - (now - state.turnStartedAt));
  }
  return r;
}

/** Milliseconds until the side to move flags, or null if no clock is running. */
export function msUntilFlag(state: GameState, now: number): number | null {
  if (state.status !== 'playing' || !clockRunning(state)) return null;
  const r = remainingMs(state, now);
  return r ? r[turn(state)] : null;
}

/** End the game on time if the side to move has flagged. Call from a server timer. */
export function checkTimeout(state: GameState, now: number): GameState {
  if (state.status !== 'playing') return state;
  const r = remainingMs(state, now);
  const c = turn(state);
  if (!r || r[c] > 0) return state;
  return end(clone({ ...state, clocks: r }), { winner: other(c), reason: 'timeout' });
}

function replay(state: GameState): Chess {
  const chess = new Chess();
  for (const m of state.moves) chess.move({ from: m.from, to: m.to, promotion: m.promotion });
  return chess;
}

/**
 * Play a move for `playerId`. The first move starts the game (both teams need
 * at least one player). Rejects anyone who is not the next mover in the relay,
 * and any illegal move. If the mover had already flagged, the game ends on
 * time instead and the move is not played.
 */
export function applyMove(state: GameState, playerId: string, input: MoveInput, now: number): Outcome {
  if (state.status === 'over') return { ok: false, error: 'not-playing' };
  let base = state;
  if (state.status === 'waiting') {
    if (state.teams.w.length === 0 || state.teams.b.length === 0) return { ok: false, error: 'teams-empty' };
    base = {
      ...clone(state),
      status: 'playing',
      turnStartedAt: now,
      clocks: state.timeControl ? { w: state.timeControl.initialMs, b: state.timeControl.initialMs } : null,
    };
  }

  const flagged = checkTimeout(base, now);
  if (flagged.status === 'over') return ok(flagged);

  const color = turn(base);
  const mover = nextMover(base, color);
  if (!mover || mover.id !== playerId) return { ok: false, error: 'not-your-turn' };

  const chess = replay(base);
  let played;
  try {
    played = chess.move({ from: input.from, to: input.to, promotion: input.promotion });
  } catch {
    return { ok: false, error: 'illegal-move' };
  }

  const s = clone(base);
  if (s.clocks && s.timeControl && clockRunning(s) && s.turnStartedAt !== null) {
    s.clocks[color] += s.timeControl.incrementMs - (now - s.turnStartedAt);
  }

  const move: PlayedMove = {
    from: played.from,
    to: played.to,
    san: played.san,
    lan: played.lan,
    color,
    playerId,
    fen: played.after,
    at: now,
  };
  if (played.promotion) move.promotion = played.promotion;
  s.moves.push(move);
  s.fen = played.after;
  s.turnStartedAt = now;

  const seat = s.teams[color].findIndex((p) => p.id === playerId);
  s.rotation[color] = (seat + 1) % s.teams[color].length;

  // Moving implicitly declines the opponent's draw offer.
  if (s.drawOfferBy && s.drawOfferBy !== color) s.drawOfferBy = null;

  if (chess.isCheckmate()) return ok(end(s, { winner: color, reason: 'checkmate' }));
  if (chess.isStalemate()) return ok(end(s, { winner: null, reason: 'stalemate' }));
  if (chess.isInsufficientMaterial()) return ok(end(s, { winner: null, reason: 'insufficient-material' }));
  if (chess.isThreefoldRepetition()) return ok(end(s, { winner: null, reason: 'threefold-repetition' }));
  if (chess.isDrawByFiftyMoves()) return ok(end(s, { winner: null, reason: 'fifty-move-rule' }));
  return ok(s);
}

export function resign(state: GameState, playerId: string): Outcome {
  if (state.status !== 'playing') return { ok: false, error: 'not-playing' };
  const c = colorOf(state, playerId);
  if (!c) return { ok: false, error: 'not-seated' };
  return ok(end(clone(state), { winner: other(c), reason: 'resign', by: playerId }));
}

/** Abort is allowed until both sides have moved. No result is recorded. */
export function abort(state: GameState, playerId: string): Outcome {
  if (state.status !== 'playing') return { ok: false, error: 'not-playing' };
  if (!colorOf(state, playerId)) return { ok: false, error: 'not-seated' };
  if (state.moves.length >= 2) return { ok: false, error: 'cannot-abort' };
  return ok(end(clone(state), { winner: null, reason: 'aborted', by: playerId }));
}

/** Forfeit `color` because its whole team left. The server decides when. */
export function abandon(state: GameState, color: Color): Outcome {
  if (state.status !== 'playing') return { ok: false, error: 'not-playing' };
  return ok(end(clone(state), { winner: other(color), reason: 'abandoned' }));
}

/** True when nobody on `color` is connected. */
export function teamGone(state: GameState, color: Color): boolean {
  return state.teams[color].length > 0 && state.teams[color].every((p) => !p.connected);
}

/** Offer a draw, or accept the other team's standing offer. */
export function offerDraw(state: GameState, playerId: string): Outcome {
  if (state.status !== 'playing') return { ok: false, error: 'not-playing' };
  const c = colorOf(state, playerId);
  if (!c) return { ok: false, error: 'not-seated' };
  if (state.drawOfferBy === other(c)) return ok(end(clone(state), { winner: null, reason: 'agreement' }));
  return ok({ ...clone(state), drawOfferBy: c });
}
