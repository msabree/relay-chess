import { useEffect, useMemo, useRef, useState } from 'react';
import socketIOClient, { Socket } from 'socket.io-client';
import { CHESS_SERVER_SOCKETS, INVITE_TEAMMATES_CONNECTION_TYPE, TEAMMATE_LOBBY_CONNECTED, TEAMMATE_LOBBY_MATCHMAKING_STARTED } from '@/constants';
import { TeammateLobbyConnectedEvent } from '@/types';
import randomstring from 'randomstring';
import { useUser } from './useUser';

interface UseInviteTeammatesProps {
  selectedTimer: string;
  open: boolean;
  inviteCode: string; // when shared the invited user will use this invite code to join the lobby
}

const useInviteTeammates = ({ selectedTimer, open, inviteCode }: UseInviteTeammatesProps) => {
  const roomId = useMemo(() => {
    return randomstring.generate(6);
  }, []);
  const socketRef = useRef<Socket>(null);
  const [teammateLobby, setTeammateLobby] = useState<{
    isHost: boolean;
    userId: string;
    username: string;
}[] | []>([]);
  const user = useUser();
  const userId = user?.data?._id;
  const username = user?.data?.username;
  const [matchmakingStarted, setMatchmakingStarted] = useState(false);
  
  useEffect(() => {
    // Creates a WebSocket connection for matchmaking
    if(!userId || userId === 'undefined' || !open) {
      return;
    }

    socketRef.current = socketIOClient(CHESS_SERVER_SOCKETS, {
      query: { 
        connectionType: INVITE_TEAMMATES_CONNECTION_TYPE, 
        roomId: inviteCode === '' ? roomId : inviteCode,  
        selectedTimer, 
        userId,
        username
      },
    });

    // Listens for changes to rooms on server
    socketRef.current?.on(TEAMMATE_LOBBY_CONNECTED, (event: TeammateLobbyConnectedEvent) => {
      setMatchmakingStarted(event.matchmakingStarted);
      setTeammateLobby(event.users);
    });

    // Destroys the socket reference
    // when the connection is closed
    return () => {
      socketRef.current?.disconnect();
    };
  }, [open, roomId, selectedTimer, userId, username, inviteCode]);

  const startTeamMatchmaking = () => {
    socketRef.current?.emit(TEAMMATE_LOBBY_MATCHMAKING_STARTED, {
      roomId,
    });
  };

  return { teammateLobby, roomId, startTeamMatchmaking, matchmakingStarted };
};

export default useInviteTeammates;