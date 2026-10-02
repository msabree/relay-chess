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
  createdAt: number;
  game: GameState;
  spectators: Spectator[];
  chat: ChatMessage[];
  rematchRoomId: string | null;
  /** server clock when this snapshot was sent, to correct client clock drift */
  serverNow: number;
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
  queues: { timeControl: string; count: number }[];
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
  'game:move': (p: RoomRef & { from: string; to: string; promotion?: string }, ack: Cb) => void;
  'game:resign': (p: RoomRef, ack: Cb) => void;
  'game:abort': (p: RoomRef, ack: Cb) => void;
  'game:draw': (p: RoomRef, ack: Cb) => void;
  'game:rematch': (p: RoomRef, ack: Cb<{ roomId: string }>) => void;
  'chat:send': (p: RoomRef & { text: string }, ack: Cb) => void;
  'lobby:watch': (ack: Cb<{ stats: LobbyStats; games: LiveGame[] }>) => void;
  'lobby:unwatch': () => void;
  'queue:join': (p: { timeControl: string }, ack: Cb) => void;
  'queue:leave': (ack: Cb) => void;
  'party:join': (p: { partyId: string }, ack: Cb<{ party: Party }>) => void;
  'party:leave': (p: { partyId: string }) => void;
  'party:queue': (p: { partyId: string; timeControl: string }, ack: Cb) => void;
  'party:unqueue': (p: { partyId: string }, ack: Cb) => void;
}

export interface ServerToClientEvents {
  'room:state': (room: RoomSnapshot) => void;
  'chat:message': (p: { roomId: string; message: ChatMessage }) => void;
  'room:rematch': (p: { roomId: string; rematchRoomId: string }) => void;
  'lobby:stats': (stats: LobbyStats) => void;
  'live:games': (games: LiveGame[]) => void;
  'party:state': (party: Party) => void;
  'queue:state': (p: { timeControl: string | null }) => void;
  'match:found': (p: { roomId: string }) => void;
}

/** Time controls offered in public matchmaking. */
export const QUEUE_TIME_CONTROLS = ['5+3', '10+0', '10+3', 'untimed'] as const;

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
