import {
  parseTimeControl,
  QUEUE_TIME_CONTROLS,
  type Ack,
  type ClientToServerEvents,
  type LobbyStats,
  type ServerToClientEvents,
} from '@relay-chess/game';
import type { Server } from 'socket.io';
import { z } from 'zod';
import { verifyAccessToken, type Identity } from '../auth';
import type { Config } from '../config';
import type { Store } from '../store/types';
import { Matchmaker } from './matchmaking';
import { Parties, PARTY_ID } from './parties';
import { RoomService } from './rooms';

export interface SocketData {
  who: Identity;
  rooms: Set<string>;
  parties: Set<string>;
}
export type IO = Server<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>;

const roomId = z.string().min(1).max(64);
const square = z.string().regex(/^[a-h][1-8]$/);
const timeControl = z.string().max(10).refine((v) => parseTimeControl(v) !== undefined, 'invalid time control');
const queueTimeControl = z.enum(QUEUE_TIME_CONTROLS);
const S = {
  roomRef: z.object({ roomId }),
  create: z.object({ timeControl }),
  seat: z.object({ roomId, team: z.enum(['w', 'b', 'spectator']) }),
  time: z.object({ roomId, timeControl }),
  move: z.object({ roomId, from: square, to: square, promotion: z.enum(['q', 'r', 'b', 'n']).optional() }),
  chat: z.object({ roomId, text: z.string().min(1).max(1000) }),
  queue: z.object({ timeControl: queueTimeControl }),
  party: z.object({ partyId: z.string().regex(PARTY_ID) }),
  partyQueue: z.object({ partyId: z.string().regex(PARTY_ID), timeControl: queueTimeControl }),
};

export function attachRealtime(io: IO, deps: { config: Config; store: Store; abandonMs?: number; flushMs?: number }) {
  const { config, store } = deps;
  const online = new Map<string, number>();
  let statsDirty = false;
  let liveDirty = false;

  const rooms = new RoomService({
    store,
    abandonMs: deps.abandonMs,
    onState: (r) => io.to(`room:${r.id}`).emit('room:state', rooms.snapshot(r)),
    onChat: (r, message) => io.to(`room:${r.id}`).emit('chat:message', { roomId: r.id, message }),
    onLiveChanged: () => (liveDirty = true),
  });
  const parties = new Parties();
  const emitParty = (id: string) => {
    const view = parties.view(id);
    if (view) io.to(`party:${id}`).emit('party:state', view);
  };

  const matchmaker = new Matchmaker((m) => {
    const room = rooms.create({ isPrivate: false, timeControl: parseTimeControl(m.timeControl) ?? null, teams: { w: m.white, b: m.black } });
    for (const p of [...m.white, ...m.black]) {
      io.to(`user:${p.id}`).emit('queue:state', { timeControl: null });
      io.to(`user:${p.id}`).emit('match:found', { roomId: room.id });
    }
    for (const id of m.partyIds) {
      parties.setQueued(id, null);
      emitParty(id);
    }
    statsDirty = true;
  });

  const stats = (): LobbyStats => {
    const counts = matchmaker.counts();
    return { online: online.size, queues: QUEUE_TIME_CONTROLS.map((tc) => ({ timeControl: tc, count: counts.get(tc) ?? 0 })) };
  };

  const flush = setInterval(() => {
    if (statsDirty) io.to('lobby').emit('lobby:stats', stats());
    if (liveDirty) io.to('lobby').emit('live:games', rooms.liveGames());
    statsDirty = liveDirty = false;
  }, deps.flushMs ?? 1000);

  const housekeeping = setInterval(() => {
    rooms.sweep();
    const stale = matchmaker.sweep();
    for (const id of stale.users) io.to(`user:${id}`).emit('queue:state', { timeControl: null });
    for (const id of stale.parties) (parties.setQueued(id, null), emitParty(id));
    if (stale.users.length || stale.parties.length) statsDirty = true;
  }, 60_000);

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    const who = typeof token === 'string' ? verifyAccessToken(config.AUTH_SECRET, token) : null;
    if (!who) return next(new Error('unauthorized'));
    socket.data.who = who;
    socket.data.rooms = new Set();
    socket.data.parties = new Set();
    next();
  });

  io.on('connection', (socket) => {
    const who = socket.data.who;
    socket.join(`user:${who.id}`);
    online.set(who.id, (online.get(who.id) ?? 0) + 1);
    statsDirty = true;

    /** Register a handler: validate the payload, always answer the ack, never throw. */
    function on<T>(
      event: keyof ClientToServerEvents,
      schema: z.ZodType<T> | null,
      handler: (payload: T) => Ack<object> | void,
    ) {
      socket.on(event, (...args: unknown[]) => {
        const ack = typeof args[args.length - 1] === 'function' ? (args.pop() as (r: Ack<object>) => void) : undefined;
        let result: Ack<object> | void;
        try {
          if (schema) {
            const parsed = schema.safeParse(args[0]);
            result = parsed.success ? handler(parsed.data) : { ok: false, error: 'invalid-input' };
          } else result = handler(undefined as T);
        } catch (err) {
          console.error(`error handling ${event}`, err);
          result = { ok: false, error: 'server-error' };
        }
        if (ack) ack(result ?? { ok: true });
      });
    }
    const done = (r: { ok: true } | { ok: false; error: string }): Ack => (r.ok ? { ok: true } : r);

    // ---- rooms ----

    on('room:create', S.create, (p) => {
      const room = rooms.create({ isPrivate: true, timeControl: parseTimeControl(p.timeControl) ?? null });
      return { ok: true, roomId: room.id };
    });

    on('room:join', S.roomRef, (p) => {
      if (!socket.data.rooms.has(p.roomId)) {
        const r = rooms.join(p.roomId, who);
        if (!r.ok) return r;
        socket.data.rooms.add(p.roomId);
        socket.join(`room:${p.roomId}`);
      }
      return { ok: true, room: rooms.snapshot(rooms.get(p.roomId)!) };
    });

    on('room:leave', S.roomRef, (p) => {
      if (!socket.data.rooms.delete(p.roomId)) return;
      socket.leave(`room:${p.roomId}`);
      rooms.leave(p.roomId, who);
    });

    const inRoom = (id: string) => socket.data.rooms.has(id);
    const guard = <T extends { roomId: string }>(fn: (p: T) => Ack | { ok: true } | { ok: false; error: string }) => (p: T) =>
      inRoom(p.roomId) ? fn(p) : { ok: false as const, error: 'not-in-room' };

    on('room:seat', S.seat, guard((p) => done(rooms.seat(p.roomId, who, p.team))));
    on('room:time', S.time, guard((p) => done(rooms.setTime(p.roomId, who, parseTimeControl(p.timeControl) ?? null))));
    on('game:move', S.move, guard((p) => done(rooms.move(p.roomId, who, p))));
    on('game:resign', S.roomRef, guard((p) => done(rooms.resign(p.roomId, who))));
    on('game:abort', S.roomRef, guard((p) => done(rooms.abort(p.roomId, who))));
    on('game:draw', S.roomRef, guard((p) => done(rooms.draw(p.roomId, who))));
    on('chat:send', S.chat, guard((p) => done(rooms.chat(p.roomId, who, p.text))));
    on('game:rematch', S.roomRef, (p) => {
      if (!inRoom(p.roomId)) return { ok: false, error: 'not-in-room' };
      const r = rooms.rematch(p.roomId, who);
      if (!r.ok) return r;
      io.to(`room:${p.roomId}`).emit('room:rematch', { roomId: p.roomId, rematchRoomId: r.value });
      return { ok: true, roomId: r.value };
    });

    // ---- lobby ----

    on('lobby:watch', null, () => {
      socket.join('lobby');
      return { ok: true, stats: stats(), games: rooms.liveGames() };
    });
    on('lobby:unwatch', null, () => void socket.leave('lobby'));

    // ---- matchmaking ----

    on('queue:join', S.queue, (p) => {
      for (const id of matchmaker.removeUser(who.id)) (parties.setQueued(id, null), emitParty(id));
      matchmaker.joinSolo(who, p.timeControl);
      // joinSolo may have matched us immediately; only report queued if still waiting
      const tc = matchmaker.soloTimeControl(who.id);
      if (tc) io.to(`user:${who.id}`).emit('queue:state', { timeControl: tc });
      statsDirty = true;
    });

    on('queue:leave', null, () => {
      matchmaker.leaveSolo(who.id);
      io.to(`user:${who.id}`).emit('queue:state', { timeControl: null });
      statsDirty = true;
    });

    // ---- parties (teammate lobbies) ----

    const unqueue = (partyId: string) => {
      if (matchmaker.unqueueParty(partyId)) statsDirty = true;
      parties.setQueued(partyId, null);
    };

    on('party:join', S.party, (p) => {
      if (!socket.data.parties.has(p.partyId)) {
        const r = parties.join(p.partyId, who);
        if (!r.ok) return r;
        socket.data.parties.add(p.partyId);
        socket.join(`party:${p.partyId}`);
        if (r.changed) unqueue(p.partyId);
        emitParty(p.partyId);
      }
      return { ok: true, party: parties.view(p.partyId)! };
    });

    const leaveParty = (partyId: string) => {
      if (!socket.data.parties.delete(partyId)) return;
      socket.leave(`party:${partyId}`);
      if (parties.leave(partyId, who.id)) {
        unqueue(partyId);
        emitParty(partyId);
      }
    };
    on('party:leave', S.party, (p) => leaveParty(p.partyId));

    on('party:queue', S.partyQueue, (p) => {
      if (!parties.isHost(p.partyId, who.id)) return { ok: false, error: 'not-host' };
      parties.setQueued(p.partyId, p.timeControl);
      matchmaker.queueParty(p.partyId, parties.members(p.partyId), p.timeControl);
      emitParty(p.partyId);
      statsDirty = true;
    });

    on('party:unqueue', S.party, (p) => {
      if (!parties.get(p.partyId)?.members.some((m) => m.id === who.id)) return { ok: false, error: 'not-in-party' };
      unqueue(p.partyId);
      emitParty(p.partyId);
    });

    // ---- disconnect ----

    socket.on('disconnect', () => {
      for (const id of socket.data.rooms) rooms.leave(id, who);
      for (const id of [...socket.data.parties]) leaveParty(id);
      const n = (online.get(who.id) ?? 1) - 1;
      if (n > 0) online.set(who.id, n);
      else {
        online.delete(who.id);
        for (const id of matchmaker.removeUser(who.id)) (parties.setQueued(id, null), emitParty(id));
      }
      statsDirty = true;
    });
  });

  return {
    rooms,
    matchmaker,
    parties,
    close() {
      clearInterval(flush);
      clearInterval(housekeeping);
      rooms.shutdown();
    },
  };
}
