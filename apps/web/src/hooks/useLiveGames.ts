import { useEffect, useRef, useState } from 'react';
import socketIOClient, { Socket } from 'socket.io-client';
import {
  CHESS_SERVER_SOCKETS,
  LIVE_GAMES_CONNECTION_TYPE,
  LIVE_GAMES_ROOM,
  LIVE_GAMES_LIST,
  LIVE_GAME_UPDATED,
  LIVE_GAME_REMOVED,
} from '@/constants';
import { LiveGameInfo, LiveGamesListEvent, LiveGameUpdatedEvent, LiveGameRemovedEvent } from '@/types';

const useLiveGames = () => {
  const socketRef = useRef<Socket | null>(null);
  const [liveGames, setLiveGames] = useState<LiveGameInfo[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    socketRef.current = socketIOClient(CHESS_SERVER_SOCKETS, {
      query: {
        connectionType: LIVE_GAMES_CONNECTION_TYPE,
        roomId: LIVE_GAMES_ROOM,
      }
    });

    const socket = socketRef.current;

    const handleConnect = () => {
      setIsConnected(true);
    };

    const handleDisconnect = () => {
      setIsConnected(false);
    };

    const handleConnectError = (error: Error) => {
      console.error('Live games connection error:', error);
    };

    const handleLiveGamesList = (data: LiveGamesListEvent | any) => {
      // Handle both direct array and object with games property
      let games: LiveGameInfo[] = [];
      
      if (Array.isArray(data)) {
        games = data;
      } else if (data?.games && Array.isArray(data.games)) {
        games = data.games;
      } else if (data && typeof data === 'object') {
        // Maybe it's wrapped differently?
        const possibleGames = Object.values(data).find((val: any) => Array.isArray(val));
        if (possibleGames) {
          games = possibleGames as LiveGameInfo[];
        }
      }
      
      // Filter out games that haven't started (less than 2 moves)
      // This prevents "zombie" games from showing up
      const activeGames = games.filter(game => game.moveCount >= 2);
      
      setLiveGames(activeGames);
    };

    const handleGameUpdated = (data: LiveGameUpdatedEvent | any) => {
      // If this is actually a full game object (not just an update), add it
      if (data && data.roomId) {
        setLiveGames(prev => {
          const existingIndex = prev.findIndex(game => game.roomId === data.roomId);
          const updatedMoveCount = data.moveCount ?? (existingIndex >= 0 ? prev[existingIndex].moveCount : 0);
          
          if (existingIndex >= 0) {
            // Update existing game
            const updated = prev.map(game => 
              game.roomId === data.roomId
                ? { 
                  ...game, 
                  moveCount: updatedMoveCount,
                  currentFen: data.currentFen ?? game.currentFen,
                  timer: data.timer ?? game.timer,
                  currentTurn: data.currentTurn ?? game.currentTurn,
                  lastMoveAt: data.lastMoveAt ?? game.lastMoveAt,
                  spectatorCount: data.spectatorCount ?? game.spectatorCount
                }
                : game
            );
            
            // Filter out games that drop below 2 moves (shouldn't happen, but safety check)
            return updated.filter(game => game.moveCount >= 2);
          } else {
            // This might be a new game - but we need full game info
            // Only add if it has at least 2 moves (game has started)
            if (data.whiteTeam && data.blackTeam && updatedMoveCount >= 2) {
              return [...prev, data as LiveGameInfo];
            } else {
              return prev;
            }
          }
        });
      }
    };

    const handleGameRemoved = (data: LiveGameRemovedEvent) => {
      setLiveGames(prev => prev.filter(game => game.roomId !== data.roomId));
    };

    socket.on('connect', () => {
      handleConnect();
      // Request the list when connected (some backends might need an explicit request)
      socket.emit('get-live-games');
      socket.emit('request-live-games');
    });
    socket.on('disconnect', handleDisconnect);
    socket.on('connect_error', handleConnectError);
    
    // Listen to multiple possible event names
    socket.on(LIVE_GAMES_LIST, handleLiveGamesList);
    socket.on('live-games-list', handleLiveGamesList); // lowercase variant
    socket.on('LIVE_GAMES_LIST', handleLiveGamesList); // uppercase variant
    
    socket.on(LIVE_GAME_UPDATED, handleGameUpdated);
    socket.on('live-game-updated', handleGameUpdated); // lowercase variant
    socket.on('LIVE_GAME_UPDATED', handleGameUpdated); // uppercase variant
    
    socket.on(LIVE_GAME_REMOVED, handleGameRemoved);
    socket.on('live-game-removed', handleGameRemoved); // lowercase variant
    socket.on('LIVE_GAME_REMOVED', handleGameRemoved); // uppercase variant
    

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('connect_error');
      socket.off(LIVE_GAMES_LIST);
      socket.off('live-games-list');
      socket.off('LIVE_GAMES_LIST');
      socket.off(LIVE_GAME_UPDATED);
      socket.off('live-game-updated');
      socket.off('LIVE_GAME_UPDATED');
      socket.off(LIVE_GAME_REMOVED);
      socket.off('live-game-removed');
      socket.off('LIVE_GAME_REMOVED');
      socket.disconnect();
    };
  }, []);

  return { liveGames, isConnected };
};

export default useLiveGames;

