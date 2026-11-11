/**
 * Wire protocol between apps/web and apps/server (socket.io).
 * Every client event takes a payload and an ack callback; the server never
 * trusts anything but the payload's intent (who you are comes from your token).
 */
import type { Color, GameState, TimeControl } from './types';

export interface ChatMessage {
  id: string;
  userId: string;
  name: string;
  text: string;
  at: number;
}

export interface Spectator {
  id: string;
  name: string;
}

export interface RoomSnapshot {
  id: string;
  isPrivate: boolean;
  /** friend room the players opened up: it shows on live games */
  watchable: boolean;
  /** players turned off spectator chat while the game is on */
  spectatorsMuted: boolean;
  createdAt: number;
  game: GameState;
  /** a sample of who's watching (capped so big crowds stay cheap) */
  spectators: Spectator[];
  /** everyone watching */
  spectatorCount: number;
  chat: ChatMessage[];
  rematchRoomId: string | null;
  /**
   * A side whose players have all left gets a deadline (server time, ms). If
   * nobody on that side is back by then, the game ends: a forfeit mid-game, or
   * the room closes if it's a quick match that never started.
   */
  deadlines: Partial<Record<Color, number>>;
  /** server clock when this snapshot was sent, to correct client clock drift */
  serverNow: number;
}

export interface Crowd {
  roomId: string;
  spectators: Spectator[];
  spectatorCount: number;
}

export interface LiveGame {
  roomId: string;
  white: string[];
  black: string[];
  moveCount: number;
  fen: string;
  timeControl: string;
  /** remaining ms per side when sent; null if untimed */
  clocks: { w: number; b: number } | null;
  turn: 'w' | 'b';
  spectators: number;
  createdAt: number;
}

export interface LobbyStats {
  online: number;
  /** games in progress right now, private ones included (count only) */
  playing: number;
  /** count: players waiting. ready: how many of them will start a 1v1 now. */
  queues: { timeControl: string; count: number; ready: number }[];
}

export interface Party {
  id: string;
  members: { id: string; name: string; isHost: boolean }[];
  /** time control the party is queued for, if any */
  queuedFor: string | null;
}

export type Ack<T extends object = object> = ({ ok: true } & T) | { ok: false; error: string };
type Cb<T extends object = object> = (res: Ack<T>) => void;
type RoomRef = { roomId: string };

export interface ClientToServerEvents {
  'room:create': (p: { timeControl: string }, ack: Cb<{ roomId: string }>) => void;
  'room:join': (p: RoomRef, ack: Cb<{ room: RoomSnapshot }>) => void;
  'room:leave': (p: RoomRef) => void;
  'room:seat': (p: RoomRef & { team: Color | 'spectator' }, ack: Cb) => void;
  'room:time': (p: RoomRef & { timeControl: string }, ack: Cb) => void;
  'room:watchable': (p: RoomRef & { watchable: boolean }, ack: Cb) => void;
  'room:mute-spectators': (p: RoomRef & { muted: boolean }, ack: Cb) => void;
  'game:move': (p: RoomRef & { from: string; to: string; promotion?: string }, ack: Cb) => void;
  'game:resign': (p: RoomRef, ack: Cb) => void;
  'game:abort': (p: RoomRef, ack: Cb) => void;
  'game:draw': (p: RoomRef, ack: Cb) => void;
  'game:rematch': (p: RoomRef, ack: Cb<{ roomId: string }>) => void;
  'chat:send': (p: RoomRef & { text: string }, ack: Cb) => void;
  /** stats plus the top few live games (home page) */
  'lobby:watch': (ack: Cb<{ stats: LobbyStats; games: LiveGame[] }>) => void;
  'lobby:unwatch': () => void;
  /** every live game (the live games page) */
  'live:watch': (ack: Cb<{ games: LiveGame[] }>) => void;
  'live:unwatch': () => void;
  'queue:join': (p: { timeControl: string }, ack: Cb) => void;
  'queue:leave': (ack: Cb) => void;
  /** Start a 1v1 with the next player who also opts in, instead of waiting for a full 2v2. */
  'queue:ready': (ack: Cb) => void;
  'party:join': (p: { partyId: string }, ack: Cb<{ party: Party }>) => void;
  'party:leave': (p: { partyId: string }) => void;
  'party:queue': (p: { partyId: string; timeControl: string }, ack: Cb) => void;
  'party:unqueue': (p: { partyId: string }, ack: Cb) => void;
}

export interface ServerToClientEvents {
  'room:state': (room: RoomSnapshot) => void;
  /** spectators came or went; sent instead of a full room:state, at most once a second */
  'room:crowd': (p: Crowd) => void;
  'chat:message': (p: { roomId: string; message: ChatMessage }) => void;
  'room:rematch': (p: { roomId: string; rematchRoomId: string }) => void;
  'lobby:stats': (stats: LobbyStats) => void;
  /** every live game, to 'live:watch' subscribers */
  'live:games': (games: LiveGame[]) => void;
  /** the top few live games, to 'lobby:watch' subscribers */
  'lobby:games': (games: LiveGame[]) => void;
  'party:state': (party: Party) => void;
  'queue:state': (p: { timeControl: string | null }) => void;
  'match:found': (p: { roomId: string }) => void;
  /** Sent on connect. A new bootId means the server restarted (a release). */
  'server:hello': (p: { bootId: string }) => void;
}

/** Time controls offered in public matchmaking. */
export const QUEUE_TIME_CONTROLS = ['5+5', 'untimed'] as const;

/**
 * "M+I" (minutes + increment seconds) or "untimed".
 * Returns null for untimed and undefined for anything invalid.
 */
export function parseTimeControl(key: string): TimeControl | null | undefined {
  if (key === 'untimed') return null;
  const m = /^(\d{1,2})\+(\d{1,2})$/.exec(key);
  if (!m) return undefined;
  const minutes = Number(m[1]);
  const inc = Number(m[2]);
  if (minutes < 1 || minutes > 60 || inc > 60) return undefined;
  return { initialMs: minutes * 60_000, incrementMs: inc * 1000 };
}

export function timeControlKey(tc: TimeControl | null): string {
  if (!tc) return 'untimed';
  return `${Math.round(tc.initialMs / 60_000)}+${Math.round(tc.incrementMs / 1000)}`;
}
