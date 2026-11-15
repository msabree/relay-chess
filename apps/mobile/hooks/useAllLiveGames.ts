import { request, useSocket } from '@/lib/socket';
import type { LiveGame } from '@relay-chess/game';
import { useEffect, useState } from 'react';

let watchers = 0;

/** Every live game, pushed by the server every few seconds. For the Watch screen. */
export function useAllLiveGames() {
  const { socket, connected } = useSocket();
  const [games, setGames] = useState<LiveGame[]>([]);

  useEffect(() => {
    if (!socket || !connected) return;
    socket.on('live:games', setGames);
    watchers++;
    request<{ games: LiveGame[] }>(socket, 'live:watch').then((res) => {
      if (res.ok) setGames(res.games);
    });
    return () => {
      socket.off('live:games', setGames);
      if (--watchers === 0) socket.emit('live:unwatch');
    };
  }, [socket, connected]);

  return { games, connected };
}
