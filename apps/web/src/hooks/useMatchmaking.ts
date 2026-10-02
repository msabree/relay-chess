import { useEffect, useRef, useState } from 'react';
import socketIOClient, { Socket } from 'socket.io-client';
import { CHESS_SERVER_SOCKETS, MATCHMAKING_CONNECTION_TYPE, MULTIPLAYER_MATCH_FOUND, MULTIPLAYER_MATCHMAKING_ROOM } from '@/constants';
import { MultiplayerMatchFoundEvent } from '@/types';
import { useUser } from './useUser';

interface UseMatchmakingProps {
  queueType: 'solo' | 'team';
  selectedTimer: string;
  enabled: boolean;
  team?: {
    isHost: boolean;
    userId: string;
    username: string;
  }[];
}

const useMatchmaking = ({ queueType, selectedTimer, enabled, team }: UseMatchmakingProps) => {
  const socketRef = useRef<Socket>(null);
  const [newGameRoomId, setNewGameRoomId] = useState<string | undefined>(undefined);
  const user = useUser();
  const userId = user?.data?._id;
  const username = user?.data?.username;

  useEffect(() => {
    // Creates a WebSocket connection for matchmaking
    if(!userId || userId === 'undefined' || !enabled) {
      return;
    }

    socketRef.current = socketIOClient(CHESS_SERVER_SOCKETS, {
      query: { 
        connectionType: MATCHMAKING_CONNECTION_TYPE, 
        roomId: MULTIPLAYER_MATCHMAKING_ROOM, 
        queueType, 
        selectedTimer, 
        userId,
        username,
        team: JSON.stringify(team)
      },
    });

    // Listens for changes to matchmaking room on server
    // It'll emit successes as they are found for all users in the matchmaking room
    // The more users in the room the noisier this event will be
    // That should be okay, when a match is found for a user they'll be redirected to the game page
    socketRef.current?.on(MULTIPLAYER_MATCH_FOUND, (event: MultiplayerMatchFoundEvent) => {
      const matchFound = event.players.find((player) => player.userId === userId);
      if (matchFound) {
        setNewGameRoomId(event.gameRoomId);
      }
    });

    // Destroys the socket reference
    // when the connection is closed
    return () => {
      socketRef.current?.off(MULTIPLAYER_MATCH_FOUND);
      socketRef.current?.disconnect();
    };
  }, [enabled, queueType, selectedTimer, userId, username, team]);

  return { newGameRoomId };
};

export default useMatchmaking;