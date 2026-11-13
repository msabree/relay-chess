import { useEffect, useState } from 'react';
import type { LiveGame } from '@relay-chess/game';
import { request, useSocket } from '@/lib/socket';

let watchers = 0;

/** Every live game, pushed by the server every few seconds. For the live games page. */
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
