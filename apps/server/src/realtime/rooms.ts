import { randomBytes } from 'node:crypto';
import {
  abandon,
  abort,
  applyMove,
  checkTimeout,
  colorOf,
  createGame,
  join as joinTeam,
  leave as leaveTeam,
  msUntilFlag,
  remainingMs,
  offerDraw,
  resign,
  setConnected,
  setTimeControl,
  teamGone,
  turn,
  timeControlKey,
  type ChatMessage,
  type Color,
  type GameState,
  type LiveGame,
  type MoveInput,
  type Outcome,
  type RoomSnapshot,
  type Spectator,
  type TimeControl,
} from '@relay-chess/game';
import type { Identity } from '../auth';
import { recordOutcomes } from '../leaderboard';
import { outcomes, toGameRecord } from '../records';
import type { Store } from '../store/types';

const MAX_CHAT = 200;
const MAX_PLAYERS = 8;

export interface Room {
  id: string;
  isPrivate: boolean;
  createdAt: number;
  game: GameState;
  spectators: Map<string, Spectator>;
  chat: ChatMessage[];
  rematchRoomId: string | null;
  /** ids of guest players: they never go on the leaderboard */
  guests: Set<string>;
  /** open sockets per user currently in the room */
  presence: Map<string, number>;
  lastActivity: number;
  flagTimer?: NodeJS.Timeout;
  abandonTimers: Partial<Record<Color, NodeJS.Timeout>>;
  /** resolves once the result is stored (tests await it) */
  saved?: Promise<void>;
}

export type RoomResult<T = Room> = { ok: true; value: T } | { ok: false; error: string };
const fail = (error: string) => ({ ok: false as const, error });

export interface RoomServiceDeps {
  store: Store;
  /** a room changed: broadcast it */
  onState: (room: Room) => void;
  onChat: (room: Room, msg: ChatMessage) => void;
  /** public room list changed */
  onLiveChanged: () => void;
  now?: () => number;
  /** how long a whole team can be gone before it forfeits */
  abandonMs?: number;
  /** idle rooms are dropped after this */
  idleMs?: number;
  log?: (msg: string, err?: unknown) => void;
}

export class RoomService {
  private rooms = new Map<string, Room>();
  private chatRate = new Map<string, number[]>();
  private now: () => number;
  private abandonMs: number;
  private idleMs: number;
  private log: (msg: string, err?: unknown) => void;

  constructor(private deps: RoomServiceDeps) {
    this.now = deps.now ?? Date.now;
    this.abandonMs = deps.abandonMs ?? 60_000;
    this.idleMs = deps.idleMs ?? 2 * 60 * 60_000;
    this.log = deps.log ?? ((m, e) => console.error(m, e ?? ''));
  }

  get(id: string) {
    return this.rooms.get(id);
  }

  get size() {
    return this.rooms.size;
  }

  create(opts: { isPrivate: boolean; timeControl: TimeControl | null; teams?: Partial<Record<Color, Identity[]>> }): Room {
    const id = randomBytes(8).toString('base64url');
    const room: Room = {
      id,
      isPrivate: opts.isPrivate,
      createdAt: this.now(),
      game: createGame({ id, timeControl: opts.timeControl, teams: opts.teams }),
      spectators: new Map(),
      chat: [],
      rematchRoomId: null,
      guests: new Set([...(opts.teams?.w ?? []), ...(opts.teams?.b ?? [])].filter((p) => p.guest).map((p) => p.id)),
      presence: new Map(),
      lastActivity: this.now(),
      abandonTimers: {},
    };
    // Matchmade players haven't opened the room yet.
    for (const p of [...room.game.teams.w, ...room.game.teams.b]) room.game = setConnected(room.game, p.id, false);
    this.rooms.set(id, room);
    if (!room.isPrivate) this.deps.onLiveChanged();
    return room;
  }

  snapshot(room: Room): RoomSnapshot {
    return {
      id: room.id,
      isPrivate: room.isPrivate,
      createdAt: room.createdAt,
      game: room.game,
      spectators: [...room.spectators.values()],
      chat: room.chat,
      rematchRoomId: room.rematchRoomId,
      serverNow: this.now(),
    };
  }

  // ---- presence ----

  /** A socket opened the room. Seats you in a private lobby if there's space. */
  join(roomId: string, who: Identity): RoomResult {
    const room = this.rooms.get(roomId);
    if (!room) return fail('room-not-found');
    room.presence.set(who.id, (room.presence.get(who.id) ?? 0) + 1);
    if (who.guest) room.guests.add(who.id);

    const g = room.game;
    if (colorOf(g, who.id)) {
      room.game = setConnected(g, who.id, true);
    } else if (room.isPrivate && g.status === 'waiting' && g.teams.w.length + g.teams.b.length < MAX_PLAYERS) {
      const w = g.teams.w.length;
      const b = g.teams.b.length;
      const team: Color = w < b ? 'w' : b < w ? 'b' : Math.random() < 0.5 ? 'w' : 'b';
      const r = joinTeam(g, { id: who.id, name: who.name }, team);
      if (r.ok) room.game = r.state;
      else room.spectators.set(who.id, { id: who.id, name: who.name });
    } else {
      room.spectators.set(who.id, { id: who.id, name: who.name });
    }
    this.changed(room);
    return { ok: true, value: room };
  }

  /** A socket left the room (closed tab, navigated away, disconnected). */
  leave(roomId: string, who: Identity) {
    const room = this.rooms.get(roomId);
    if (!room) return;
    const n = (room.presence.get(who.id) ?? 1) - 1;
    if (n > 0) {
      room.presence.set(who.id, n);
      return;
    }
    room.presence.delete(who.id);
    room.spectators.delete(who.id);
    if (colorOf(room.game, who.id)) room.game = setConnected(room.game, who.id, false);
    this.changed(room);
  }

  // ---- lobby actions (before the first move) ----

  seat(roomId: string, who: Identity, team: Color | 'spectator'): RoomResult {
    return this.update(roomId, who, (room) => {
      if (!room.presence.has(who.id)) return fail('not-in-room');
      if (team === 'spectator') {
        const r = leaveTeam(room.game, who.id);
        if (!r.ok) return r;
        room.spectators.set(who.id, { id: who.id, name: who.name });
        return r;
      }
      const r = joinTeam(room.game, { id: who.id, name: who.name }, team);
      if (r.ok) room.spectators.delete(who.id);
      return r;
    });
  }

  setTime(roomId: string, who: Identity, tc: TimeControl | null): RoomResult {
    return this.update(roomId, who, (room) => {
      if (!colorOf(room.game, who.id)) return fail('not-seated');
      return setTimeControl(room.game, tc);
    });
  }

  // ---- game actions ----

  move(roomId: string, who: Identity, input: MoveInput): RoomResult {
    return this.update(roomId, who, (room) => applyMove(room.game, who.id, input, this.now()));
  }

  resign(roomId: string, who: Identity): RoomResult {
    return this.update(roomId, who, (room) => resign(room.game, who.id));
  }

  abort(roomId: string, who: Identity): RoomResult {
    return this.update(roomId, who, (room) => abort(room.game, who.id));
  }

  draw(roomId: string, who: Identity): RoomResult {
    return this.update(roomId, who, (room) => offerDraw(room.game, who.id));
  }

  /** Same players, colors swapped, same time control. One rematch room per game. */
  rematch(roomId: string, who: Identity): RoomResult<string> {
    const room = this.rooms.get(roomId);
    if (!room) return fail('room-not-found');
    if (room.game.status !== 'over') return fail('game-not-over');
    if (!colorOf(room.game, who.id)) return fail('not-seated');
    if (room.rematchRoomId && this.rooms.has(room.rematchRoomId)) return { ok: true, value: room.rematchRoomId };
    const asIdentity = (p: { id: string; name: string }) => ({ id: p.id, name: p.name, guest: room.guests.has(p.id) });
    const next = this.create({
      isPrivate: room.isPrivate,
      timeControl: room.game.timeControl,
      teams: { w: room.game.teams.b.map(asIdentity), b: room.game.teams.w.map(asIdentity) },
    });
    room.rematchRoomId = next.id;
    this.changed(room);
    return { ok: true, value: next.id };
  }

  chat(roomId: string, who: Identity, text: string): RoomResult<ChatMessage> {
    const room = this.rooms.get(roomId);
    if (!room) return fail('room-not-found');
    if (!room.presence.has(who.id)) return fail('not-in-room');
    const clean = text.trim().slice(0, 500);
    if (!clean) return fail('empty-message');
    const now = this.now();
    const recent = (this.chatRate.get(who.id) ?? []).filter((t) => now - t < 5000);
    if (recent.length >= 5) return fail('rate-limited');
    this.chatRate.set(who.id, [...recent, now]);

    const msg: ChatMessage = { id: randomBytes(6).toString('base64url'), userId: who.id, name: who.name, text: clean, at: now };
    room.chat = [...room.chat, msg].slice(-MAX_CHAT);
    room.lastActivity = now;
    this.deps.onChat(room, msg);
    return { ok: true, value: msg };
  }

  // ---- listing & housekeeping ----

  liveGames(): LiveGame[] {
    return [...this.rooms.values()]
      .filter((r) => !r.isPrivate && r.game.status !== 'over')
      .map((r) => ({
        roomId: r.id,
        white: r.game.teams.w.map((p) => p.name),
        black: r.game.teams.b.map((p) => p.name),
        moveCount: r.game.moves.length,
        fen: r.game.fen,
        timeControl: timeControlKey(r.game.timeControl),
        clocks: remainingMs(r.game, this.now()),
        turn: turn(r.game),
        spectators: r.spectators.size,
        createdAt: r.createdAt,
      }));
  }

  /** Drop rooms nobody has touched for a while. */
  sweep() {
    const cutoff = this.now() - this.idleMs;
    for (const room of this.rooms.values()) {
      if (room.presence.size === 0 && room.lastActivity < cutoff) {
        this.clearTimers(room);
        this.rooms.delete(room.id);
      }
    }
  }

  shutdown() {
    for (const room of this.rooms.values()) this.clearTimers(room);
  }

  // ---- internals ----

  private update(roomId: string, who: Identity, fn: (room: Room) => Outcome | { ok: false; error: string }): RoomResult {
    const room = this.rooms.get(roomId);
    if (!room) return fail('room-not-found');
    const r = fn(room);
    if (!r.ok) return r;
    room.game = r.state;
    if (who.guest && colorOf(room.game, who.id)) room.guests.add(who.id);
    this.changed(room);
    return { ok: true, value: room };
  }

  /** Call after every change: reschedule timers, persist results, broadcast. */
  private changed(room: Room) {
    room.lastActivity = this.now();
    this.schedule(room);
    if (room.game.status === 'over' && !room.saved) room.saved = this.finish(room);
    this.deps.onState(room);
    if (!room.isPrivate) this.deps.onLiveChanged();
  }

  private clearTimers(room: Room) {
    clearTimeout(room.flagTimer);
    room.flagTimer = undefined;
    for (const c of ['w', 'b'] as const) {
      clearTimeout(room.abandonTimers[c]);
      delete room.abandonTimers[c];
    }
  }

  private schedule(room: Room) {
    if (room.game.status !== 'playing') return this.clearTimers(room);

    clearTimeout(room.flagTimer);
    const ms = msUntilFlag(room.game, this.now());
    room.flagTimer =
      ms === null
        ? undefined
        : setTimeout(() => {
            const next = checkTimeout(room.game, this.now());
            if (next !== room.game) {
              room.game = next;
              this.changed(room);
            } else this.schedule(room);
          }, ms + 10);

    for (const c of ['w', 'b'] as const) {
      const gone = teamGone(room.game, c);
      if (gone && !room.abandonTimers[c]) {
        room.abandonTimers[c] = setTimeout(() => {
          delete room.abandonTimers[c];
          if (room.game.status === 'playing' && teamGone(room.game, c)) {
            const r = abandon(room.game, c);
            if (r.ok) {
              room.game = r.state;
              this.changed(room);
            }
          }
        }, this.abandonMs);
      } else if (!gone && room.abandonTimers[c]) {
        clearTimeout(room.abandonTimers[c]);
        delete room.abandonTimers[c];
      }
    }
  }

  private async finish(room: Room) {
    const g = room.game;
    if (g.result?.reason === 'aborted' || g.moves.length === 0) return;
    try {
      await this.deps.store.saveGame(toGameRecord(g, new Date(this.now())));
      const ranked = outcomes(g).filter((o) => !room.guests.has(o.userId) && !o.userId.startsWith('guest_'));
      await recordOutcomes(this.deps.store, ranked, new Date(this.now()));
    } catch (err) {
      this.log(`failed to save result for room ${room.id}`, err);
    }
  }
}
