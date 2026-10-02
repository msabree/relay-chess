import { useEffect, useState } from 'react';
import type { LiveGame, LobbyStats } from '@relay-chess/game';
import { request, useSocket } from '@/lib/socket';

let watchers = 0;

/** Online stats and live public games, pushed by the server. */
export function useLobby() {
  const { socket, connected } = useSocket();
  const [stats, setStats] = useState<LobbyStats | null>(null);
  const [games, setGames] = useState<LiveGame[]>([]);

  useEffect(() => {
    if (!socket || !connected) return;
    socket.on('lobby:stats', setStats);
    socket.on('live:games', setGames);
    watchers++;
    request<{ stats: LobbyStats; games: LiveGame[] }>(socket, 'lobby:watch').then((res) => {
      if (res.ok) {
        setStats(res.stats);
        setGames(res.games);
      }
    });
    return () => {
      socket.off('lobby:stats', setStats);
      socket.off('live:games', setGames);
      if (--watchers === 0) socket.emit('lobby:unwatch');
    };
  }, [socket, connected]);

  return { stats, games, connected };
}
