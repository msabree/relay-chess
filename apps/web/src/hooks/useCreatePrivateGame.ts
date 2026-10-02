import { useEffect, useRef, useState } from 'react';
import socketIOClient, { Socket } from 'socket.io-client';
import { CHESS_SERVER_SOCKETS, PRIVATE_GAME_CREATED, PRIVATE_GAME_CREATION_CONNECTION_TYPE } from '@/constants';
import { useUser } from './useUser';

interface UseCreatePrivateGameProps {
    enabled: boolean;
  selectedTimer: string;
}

const useCreatePrivateGame = ({ enabled, selectedTimer }: UseCreatePrivateGameProps) => {
  const [gameRoomId, setGameRoomId] = useState<string>();
  const socketRef = useRef<Socket>(null);
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
        connectionType: PRIVATE_GAME_CREATION_CONNECTION_TYPE, 
        userId,
        username,
        selectedTimer
      },
    });

    // Listens for changes to rooms on server
    socketRef.current?.on(PRIVATE_GAME_CREATED, (event: {roomId: string}) => {
      setGameRoomId(event.roomId);
    });

    // Destroys the socket reference
    // when the connection is closed
    return () => {
      socketRef.current?.disconnect();
    };
  }, [enabled, selectedTimer, userId, username]);

  return { gameRoomId };
};

export default useCreatePrivateGame;