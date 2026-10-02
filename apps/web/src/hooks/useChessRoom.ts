import { useCallback, useEffect, useState } from 'react';
import type { Ack, Color, RoomSnapshot } from '@relay-chess/game';
import { request, toServerTimer, useSocket } from '@/lib/socket';

/**
 * Live state of one game room. The server is the source of truth: every
 * change arrives as a full snapshot, and actions are requests it may refuse.
 */
const useChessRoom = (roomId: string) => {
  const { socket, connected, user } = useSocket();
  const [room, setRoom] = useState<RoomSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  /** server clock minus local clock, to display clocks correctly */
  const [clockOffset, setClockOffset] = useState(0);

  useEffect(() => {
    if (!socket || !connected || !roomId) return;
    const onState = (r: RoomSnapshot) => {
      if (r.id !== roomId) return;
      setRoom(r);
      setClockOffset(r.serverNow - Date.now());
    };
    const onChat = (p: { roomId: string; message: RoomSnapshot['chat'][number] }) => {
      if (p.roomId !== roomId) return;
      setRoom((prev) => (prev ? { ...prev, chat: [...prev.chat, p.message].slice(-200) } : prev));
    };
    socket.on('room:state', onState);
    socket.on('chat:message', onChat);
    request<{ room: RoomSnapshot }>(socket, 'room:join', { roomId }).then((res) => {
      if (res.ok) {
        setError(null);
        onState(res.room);
      } else setError(res.error);
    });
    return () => {
      socket.off('room:state', onState);
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
  };
};

export default useChessRoom;
