import { useCallback, useEffect, useState } from 'react';
import { applyPatch, type Ack, type Color, type Crowd, type RoomPatch, type RoomSnapshot } from '@relay-chess/game';
import { request, toServerTimer, useSocket } from '@/lib/socket';

/**
 * Live state of one game room. The server is the source of truth: we get the
 * whole room when we join, then small numbered patches. If a patch doesn't
 * follow the version we have (a dropped message, a phone waking up), we ask
 * for the whole room again. Actions are requests the server may refuse.
 */
const useChessRoom = (roomId: string) => {
  const { socket, connected, user } = useSocket();
  const [room, setRoom] = useState<RoomSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  /** server clock minus local clock, to display clocks correctly */
  const [clockOffset, setClockOffset] = useState(0);

  useEffect(() => {
    if (!socket || !connected || !roomId) return;
    let current: RoomSnapshot | null = null;
    let syncing = false;
    const commit = (next: RoomSnapshot) => {
      current = next;
      setRoom(next);
    };

    const onState = (r: RoomSnapshot) => {
      if (r.id !== roomId) return;
      commit(r);
      setClockOffset(r.serverNow - Date.now());
    };
    const resync = () => {
      if (syncing) return;
      syncing = true;
      request<{ room: RoomSnapshot }>(socket, 'room:join', { roomId }).then((res) => {
        syncing = false;
        if (res.ok) {
          setError(null);
          onState(res.room);
        } else setError(res.error);
      });
    };
    const onPatch = (p: RoomPatch) => {
      if (p.id !== roomId || !current || syncing) return;
      const next = applyPatch(current, p);
      if (!next) return resync();
      if (next === current) return;
      commit(next);
      setClockOffset(p.serverNow - Date.now());
    };
    const onChat = (p: { roomId: string; message: RoomSnapshot['chat'][number] }) => {
      if (p.roomId !== roomId || !current) return;
      commit({ ...current, chat: [...current.chat, p.message].slice(-200) });
    };
    // Spectators coming and going arrive as a small separate update.
    const onCrowd = (c: Crowd) => {
      if (c.roomId !== roomId || !current) return;
      commit({ ...current, spectators: c.spectators, spectatorCount: c.spectatorCount });
    };

    socket.on('room:state', onState);
    socket.on('room:patch', onPatch);
    socket.on('room:crowd', onCrowd);
    socket.on('chat:message', onChat);
    resync();
    return () => {
      socket.off('room:state', onState);
      socket.off('room:patch', onPatch);
      socket.off('room:crowd', onCrowd);
      socket.off('chat:message', onChat);
      socket.emit('room:leave', { roomId });
    };
  }, [socket, connected, roomId]);

  const act = useCallback(
    (event: 'game:resign' | 'game:abort' | 'game:draw') => request(socket, event, { roomId }),
    [socket, roomId],
  );

  return {
    room,
    error,
    clockOffset,
    userId: user?._id ?? '',
    username: user?.username ?? '',
    move: (from: string, to: string, promotion?: string) => request(socket, 'game:move', { roomId, from, to, promotion }),
    resign: () => act('game:resign'),
    abort: () => act('game:abort'),
    offerDraw: () => act('game:draw'),
    rematch: () => request<{ roomId: string }>(socket, 'game:rematch', { roomId }),
    sendChat: (text: string) => request(socket, 'chat:send', { roomId, text }),
    changeTeam: (team: Color | 'spectator') => request(socket, 'room:seat', { roomId, team }),
    /** timer in the web's "5,3" format */
    setTimer: (timer: string): Promise<Ack> => request(socket, 'room:time', { roomId, timeControl: toServerTimer(timer) }),
    setWatchable: (watchable: boolean): Promise<Ack> => request(socket, 'room:watchable', { roomId, watchable }),
    setSpectatorsMuted: (muted: boolean): Promise<Ack> => request(socket, 'room:mute-spectators', { roomId, muted }),
  };
};

export default useChessRoom;
