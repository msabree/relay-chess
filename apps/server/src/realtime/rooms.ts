import { randomBytes } from 'node:crypto';
import {
  abandon,
  abort,
  applyMove,
  cancel,
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
  takeSeat,
  teamGone,
  turn,
  timeControlKey,
  type ChatMessage,
  type Color,
  type GameState,
  type LiveGame,
  type MoveInput,
  type Outcome,
  type RoomPatch,
  type RoomSnapshot,
  type Spectator,
  type TimeControl,
} from '@relay-chess/game';
import type { Identity } from '../auth';
import { recordOutcomes } from '../leaderboard';
import { outcomes, toGameRecord } from '../records';
import type { Store } from '../store/types';

const MAX_CHAT = 200;
/** spectator names sent with each room update; the rest is just a count */
const SPECTATOR_SAMPLE = 20;
/** live games shown on the home page */
const TOP_GAMES = 5;
const MAX_PLAYERS = 8;

export interface Room {
  id: string;
  isPrivate: boolean;
  /** private room opened up to anyone: listed on live games */
  watchable: boolean;
  /** players turned off spectator chat (applies while the game is on) */
  spectatorsMuted: boolean;
  createdAt: number;
  game: GameState;
  spectators: Map<string, Spectator>;
  chat: ChatMessage[];
  rematchRoomId: string | null;
  /** created by a rematch: seats are the old players, newcomers arrive as spectators */
  isRematch: boolean;
  /** ids of guest players: they never go on the leaderboard */
  guests: Set<string>;
  /** open sockets per user currently in the room */
  presence: Map<string, number>;
  lastActivity: number;
  flagTimer?: NodeJS.Timeout;
  abandonTimers: Partial<Record<Color, NodeJS.Timeout>>;
  /** when each running abandon timer fires (server time) */
  deadlines: Partial<Record<Color, number>>;
  /** status the abandon timers were set for; they reset when it changes */
  timersFor?: GameState['status'];
  /** resolves once the result is stored (tests await it) */
  saved?: Promise<void>;
  /** version: bumped on every change, so clients can apply small patches in order */
  v: number;
  /** moves clients had at the last broadcast, to know if this change added one */
  sentMoves: number;
}

export type RoomResult<T = Room> = { ok: true; value: T } | { ok: false; error: string };
const fail = (error: string) => ({ ok: false as const, error });

export interface RoomServiceDeps {
  store: Store;
  /** a room changed: broadcast it */
  onState: (room: Room) => void;
  onChat: (room: Room, msg: ChatMessage) => void;
  /** only the spectators changed (cheap; batched by the caller) */
  onCrowd: (room: Room) => void;
  /** public room list changed */
  onLiveChanged: () => void;
  now?: () => number;
  /** how long a whole team can be gone mid-game before it forfeits */
  abandonMs?: number;
  /** how long a quick-match seat can stay empty before the first move before the room closes */
  lobbyMs?: number;
  /** idle rooms are dropped after this */
  idleMs?: number;
  log?: (msg: string, err?: unknown) => void;
}

export class RoomService {
  private rooms = new Map<string, Room>();
  private chatRate = new Map<string, number[]>();
  private now: () => number;
  private abandonMs: number;
  private lobbyMs: number;
  private idleMs: number;
  private log: (msg: string, err?: unknown) => void;

  constructor(private deps: RoomServiceDeps) {
    this.now = deps.now ?? Date.now;
    this.abandonMs = deps.abandonMs ?? 3 * 60_000;
    this.lobbyMs = deps.lobbyMs ?? 60_000;
    this.idleMs = deps.idleMs ?? 2 * 60 * 60_000;
    this.log = deps.log ?? ((m, e) => console.error(m, e ?? ''));
  }

  get(id: string) {
    return this.rooms.get(id);
  }

  get size() {
    return this.rooms.size;
  }

  create(opts: { isPrivate: boolean; isRematch?: boolean; watchable?: boolean; spectatorsMuted?: boolean; timeControl: TimeControl | null; teams?: Partial<Record<Color, Identity[]>> }): Room {
    const id = randomBytes(8).toString('base64url');
    const room: Room = {
      id,
      isPrivate: opts.isPrivate,
      watchable: opts.watchable ?? false,
      spectatorsMuted: opts.spectatorsMuted ?? false,
      createdAt: this.now(),
      game: createGame({ id, timeControl: opts.timeControl, teams: opts.teams }),
      spectators: new Map(),
      chat: [],
      rematchRoomId: null,
      isRematch: opts.isRematch ?? false,
      guests: new Set([...(opts.teams?.w ?? []), ...(opts.teams?.b ?? [])].filter((p) => p.guest).map((p) => p.id)),
      presence: new Map(),
      lastActivity: this.now(),
      abandonTimers: {},
      deadlines: {},
      v: 0,
      sentMoves: 0,
    };
    // Matchmade players haven't opened the room yet.
    for (const p of [...room.game.teams.w, ...room.game.teams.b]) room.game = setConnected(room.game, p.id, false);
    this.rooms.set(id, room);
    if (this.listed(room)) this.deps.onLiveChanged();
    return room;
  }

  snapshot(room: Room): RoomSnapshot {
    return {
      id: room.id,
      isPrivate: room.isPrivate,
      watchable: room.watchable,
      spectatorsMuted: room.spectatorsMuted,
      createdAt: room.createdAt,
      game: room.game,
      spectators: [...room.spectators.values()].slice(0, SPECTATOR_SAMPLE),
      spectatorCount: room.spectators.size,
      chat: room.chat,
      rematchRoomId: room.rematchRoomId,
      deadlines: room.deadlines,
      serverNow: this.now(),
      v: room.v,
    };
  }

  /**
   * Just what changed since the last broadcast: the new move (if any) and the
   * light room state, without move history, chat or spectators. Null when a
   * patch can't express the change, so the caller sends the whole room instead.
   */
  patch(room: Room): RoomPatch | null {
    const { moves, ...game } = room.game;
    const added = moves.length - room.sentMoves;
    room.sentMoves = moves.length;
    if (added > 1) return null;
    return {
      id: room.id,
      isPrivate: room.isPrivate,
      watchable: room.watchable,
      spectatorsMuted: room.spectatorsMuted,
      createdAt: room.createdAt,
      game,
      moveCount: moves.length,
      ...(added === 1 ? { move: moves[moves.length - 1] } : {}),
      rematchRoomId: room.rematchRoomId,
      deadlines: room.deadlines,
      serverNow: this.now(),
      v: room.v,
    };
  }

  // ---- presence ----

  /** A socket opened the room. Seats you in a private lobby if there's space (not in a rematch: spectators stay spectators). */
  join(roomId: string, who: Identity): RoomResult {
    const room = this.rooms.get(roomId);
    if (!room) return fail('room-not-found');
    room.presence.set(who.id, (room.presence.get(who.id) ?? 0) + 1);
    if (who.guest) room.guests.add(who.id);

    const g = room.game;
    let watching = false;
    if (colorOf(g, who.id)) {
      room.game = setConnected(g, who.id, true);
    } else if (room.isPrivate && !room.isRematch && g.status === 'waiting' && g.teams.w.length + g.teams.b.length < MAX_PLAYERS) {
      const w = g.teams.w.length;
      const b = g.teams.b.length;
      const team: Color = w < b ? 'w' : b < w ? 'b' : Math.random() < 0.5 ? 'w' : 'b';
      const r = joinTeam(g, { id: who.id, name: who.name }, team);
      if (r.ok) room.game = r.state;
      else (room.spectators.set(who.id, { id: who.id, name: who.name }), (watching = true));
    } else {
      room.spectators.set(who.id, { id: who.id, name: who.name });
      watching = true;
    }
    // A spectator arriving only changes the crowd: don't resend the whole room to everyone.
    if (watching) this.crowdChanged(room);
    else this.changed(room);
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
    if (colorOf(room.game, who.id)) {
      room.game = setConnected(room.game, who.id, false);
      this.changed(room);
    } else if (room.spectators.delete(who.id)) {
      this.crowdChanged(room);
    }
  }

  // ---- lobby actions (before the first move) ----

  seat(roomId: string, who: Identity, team: Color | 'spectator'): RoomResult {
    return this.update(roomId, who, (room) => {
      if (!room.presence.has(who.id)) return fail('not-in-room');
      if (team === 'spectator') {
        if (!room.isPrivate) return fail('not-allowed');
        const r = leaveTeam(room.game, who.id);
        if (!r.ok) return r;
        room.spectators.set(who.id, { id: who.id, name: who.name });
        return r;
      }
      // Quick matches have fixed seats: you can only take one whose player left.
      const g = room.game;
      const away = g.teams[team].find((p) => !p.connected);
      const r = room.isPrivate
        ? joinTeam(g, { id: who.id, name: who.name }, team)
        : away
          ? takeSeat(g, { id: who.id, name: who.name }, away.id)
          : fail('no-open-seat');
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

  /** Any seated player can open a friend room up to the live games list (or close it). */
  setWatchable(roomId: string, who: Identity, watchable: boolean): RoomResult {
    const room = this.rooms.get(roomId);
    if (!room) return fail('room-not-found');
    if (!colorOf(room.game, who.id)) return fail('not-seated');
    if (room.game.status === 'over') return fail('game-over');
    if (room.watchable !== watchable) {
      room.watchable = watchable;
      this.changed(room);
    }
    return { ok: true, value: room };
  }

  /** Any seated player can stop spectators from chatting during the game (or let them back in). */
  setSpectatorsMuted(roomId: string, who: Identity, muted: boolean): RoomResult {
    const room = this.rooms.get(roomId);
    if (!room) return fail('room-not-found');
    if (!colorOf(room.game, who.id)) return fail('not-seated');
    if (room.spectatorsMuted !== muted) {
      room.spectatorsMuted = muted;
      this.changed(room);
    }
    return { ok: true, value: room };
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
      isRematch: true,
      watchable: room.watchable,
      spectatorsMuted: room.spectatorsMuted,
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
    // Muted spectators can't hint mid-game; they can talk again once it's over.
    if (room.spectatorsMuted && room.game.status === 'playing' && !colorOf(room.game, who.id)) return fail('spectators-muted');
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
      .filter((r) => this.listed(r) && r.game.status !== 'over')
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

  /** Home page: the most watched games, then the longest running. */
  topGames(): LiveGame[] {
    return this.liveGames()
      .filter((g) => g.moveCount >= 2)
      .sort((a, b) => b.spectators - a.spectators || b.moveCount - a.moveCount)
      .slice(0, TOP_GAMES);
  }

  crowd(room: Room) {
    return { roomId: room.id, spectators: [...room.spectators.values()].slice(0, SPECTATOR_SAMPLE), spectatorCount: room.spectators.size };
  }

  /** Games in progress (first move made), private ones included. */
  playingCount(): number {
    let n = 0;
    for (const r of this.rooms.values()) if (r.game.status !== 'over' && r.game.moves.length > 0) n++;
    return n;
  }

  /**
   * Shown on live games: matchmade, or a friend room the players opened up.
   * Friend rooms only once the game has started: before that, opening the room
   * hands out seats, so it must stay link-only.
   */
  private listed(r: Room) {
    return !r.isPrivate || (r.watchable && r.game.status !== 'waiting');
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
  private crowdChanged(room: Room) {
    room.lastActivity = this.now();
    this.deps.onCrowd(room);
    if (this.listed(room)) this.deps.onLiveChanged();
  }

  private changed(room: Room) {
    room.lastActivity = this.now();
    this.schedule(room);
    if (room.game.status === 'over' && !room.saved) room.saved = this.finish(room);
    room.v++;
    this.deps.onState(room);
    if (this.listed(room)) this.deps.onLiveChanged();
  }

  private clearTimers(room: Room) {
    clearTimeout(room.flagTimer);
    room.flagTimer = undefined;
    for (const c of ['w', 'b'] as const) {
      clearTimeout(room.abandonTimers[c]);
      delete room.abandonTimers[c];
    }
    room.deadlines = {};
  }

  private schedule(room: Room) {
    const g = room.game;
    if (g.status === 'over') return this.clearTimers(room);

    clearTimeout(room.flagTimer);
    room.flagTimer = undefined;
    const ms = g.status === 'playing' ? msUntilFlag(g, this.now()) : null;
    if (ms !== null) {
      room.flagTimer = setTimeout(() => {
        const next = checkTimeout(room.game, this.now());
        if (next !== room.game) {
          room.game = next;
          this.changed(room);
        } else this.schedule(room);
      }, ms + 10);
    }

    // A whole side gone: mid-game it forfeits after abandonMs; in a quick match
    // that hasn't started, the room closes after lobbyMs. Private lobbies just wait.
    if (room.timersFor !== g.status) {
      for (const c of ['w', 'b'] as const) clearTimeout(room.abandonTimers[c]);
      room.abandonTimers = {};
      room.deadlines = {};
      room.timersFor = g.status;
    }
    const lobby = g.status === 'waiting';
    for (const c of ['w', 'b'] as const) {
      const gone = (!lobby || !room.isPrivate) && teamGone(g, c);
      if (gone && !room.abandonTimers[c]) {
        const wait = lobby ? this.lobbyMs : this.abandonMs;
        room.deadlines = { ...room.deadlines, [c]: this.now() + wait };
        room.abandonTimers[c] = setTimeout(() => {
          delete room.abandonTimers[c];
          const { [c]: _, ...rest } = room.deadlines;
          room.deadlines = rest;
          if (!teamGone(room.game, c)) return;
          const r = room.game.status === 'waiting' ? cancel(room.game) : abandon(room.game, c);
          if (r.ok) {
            room.game = r.state;
            this.changed(room);
          }
        }, wait);
      } else if (!gone && room.abandonTimers[c]) {
        clearTimeout(room.abandonTimers[c]);
        delete room.abandonTimers[c];
        const { [c]: _, ...rest } = room.deadlines;
        room.deadlines = rest;
      }
    }
  }

  private async finish(room: Room) {
    const g = room.game;
    if (g.result?.reason === 'aborted' || g.moves.length === 0) return;
    try {
      await this.deps.store.saveGame(toGameRecord(g, new Date(this.now())));
      await recordOutcomes(this.deps.store, outcomes(g), new Date(this.now()));
    } catch (err) {
      this.log(`failed to save result for room ${room.id}`, err);
    }
  }
}
