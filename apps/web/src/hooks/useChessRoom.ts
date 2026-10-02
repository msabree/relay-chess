import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ChatMessage,
  GameMove,
  Spectator,
  TEAM_COLOR,
  TeamInRoom
} from '@/types';
import { Chess, Move } from 'chess.js';
import randomstring from 'randomstring';
import socketIOClient, { Socket } from 'socket.io-client';
import {
  CHESS_MOVE,
  CHAT_MESSAGE,
  USER_CONNECTED,
  USER_LEFT,
  GAME_OVER,
  DECREMENT_TIMER,
  CHESS_SERVER_SOCKETS,
  CHANGE_TEAM,
  OFFER_REMATCH,
  CHESS_GAME_CONNECTION_TYPE,
  GAME_ROOM_NOT_FOUND,
  UPDATE_TIMER,
} from '@/constants';
import { useGame } from './useGame';

interface ChessRoomProps {
  isLoggedIn: boolean;
  roomId: string;
  userId: string;
  username: string;
  selectedTimer: string;
}

interface UserConnectedEvent {
  isPrivateGame: boolean;
  whiteTeam: TeamInRoom;
  blackTeam: TeamInRoom;
  spectators: Spectator[];
  fen: string;
  gameOver: boolean;
  isGameAborted: boolean;
  gameTimedOut: boolean;
  resigned: ResignGameEvent;
  timer: Timer;
  selectedTimer: string;
  chatMessages: ChatMessage[];
  history: GameMove[];
}

interface ResignGameEvent {
  username: string;
  color: TEAM_COLOR;
}

interface ChessMoveEvent {
  userIdMoved: string;
  fen: string;
  turn: 'w' | 'b';
  chessMove: any;
  senderId: string;
  blackTeam?: any;
  whiteTeam?: any;
  history?: GameMove[];
}

interface GameOverEvent {
  color: TEAM_COLOR;
  username: string;
  isCheckmate: boolean;
  isDraw: boolean;
  isTimeout: boolean;
  isResigned: boolean;
  isAbort: boolean;
}

interface Timer {
  w: {
    initialSeconds: number;
    plusSeconds: number;
  };
  b: {
    initialSeconds: number;
    plusSeconds: number;
  };
}

const useChessRoom = ({
  roomId,
  userId,
  username,
  selectedTimer,
}: ChessRoomProps) => {
  const socketRef = useRef<Socket>(null);
  const [rematchRoomId, setRematchRoomId] = useState<string>('');
  const [gameHistory, setGameHistory] = useState<GameMove[]>([]);
  const [gameEnded, setGameEnded] = useState<boolean>(false);
  const [gameTimedOut, setGameTimedOut] = useState<boolean>(false);
  const [isGameAborted, setIsGameAborted] = useState<boolean>(false);
  const [isDraw, setIsDraw] = useState<boolean>(false);
  const [blackTeam, setBlackTeam] = useState<TeamInRoom>();
  const [whiteTeam, setWhiteTeam] = useState<TeamInRoom>();
  const [spectators, setSpectators] = useState<Spectator[]>([]);
  const [isPrivateGame, setIsPrivateGame] = useState<boolean>(false);
  const [incomingSelectedTimer, setIncomingSelectedTimer] =
    useState<string>(selectedTimer);
  const [incomingMove, setIncomingMove] = useState<string>('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [timer, setTimer] = useState<Timer>({
    w: { initialSeconds: 0, plusSeconds: 0 },
    b: { initialSeconds: 0, plusSeconds: 0 }
  }); // start with 5 minutes
  const [colorResigned, setColorResigned] = useState<TEAM_COLOR>();
  const [usernameResigned, setUsernameResigned] = useState<string>('');
  const [reconnectedBoardPosition, setReconnctedBoardPosition] =
    useState<string>('');
  const gameQuery = useGame(roomId);

  const teamColor = useMemo(() => {
    const _users = (blackTeam?.usersInRoom ?? []).concat(
      whiteTeam?.usersInRoom ?? []
    );

    return _users?.find((user) => user.id === userId)?.color;
  }, [blackTeam?.usersInRoom, userId, whiteTeam?.usersInRoom]);

  // Socket connection effect
  useEffect(() => {
    if (roomId === '' || userId === '' || username === '') return;

    const socket = socketIOClient(CHESS_SERVER_SOCKETS, {
      query: {
        connectionType: CHESS_GAME_CONNECTION_TYPE,
        roomId,
        selectedTimer,
        userId,
        username,
      }
    });

    socketRef.current = socket;

    return () => {
      if (socket) {
        socket.removeAllListeners();
        socket.disconnect();
      }
    };
  }, [roomId, selectedTimer, userId, username]);

  // Game state event handlers
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    const handleChangeTeam = (data: any) => {
      const { blackTeam, whiteTeam, spectators } = data;
      setBlackTeam(blackTeam);
      setWhiteTeam(whiteTeam);
      setSpectators(spectators);
    };

    const handleUserConnected = (data: UserConnectedEvent) => {
      const {
        isPrivateGame,
        blackTeam,
        whiteTeam,
        spectators,
        fen,
        resigned,
        gameOver,
        isGameAborted,
        gameTimedOut,
        history
      } = data;

      if (gameOver) setGameEnded(gameOver);
      if (isGameAborted) {
        setIsGameAborted(isGameAborted);
        setGameEnded(true);
      }
      if (gameTimedOut) {
        setGameTimedOut(gameTimedOut);
        setGameEnded(true);
      }
      if (fen !== '') setReconnctedBoardPosition(fen);
      if (resigned.color) {
        setColorResigned(resigned.color);
        setUsernameResigned(resigned.username);
        setGameEnded(true);
      }
      if (history) setGameHistory(history);

      setBlackTeam(blackTeam);
      setWhiteTeam(whiteTeam);
      setSpectators(spectators);
      setIncomingSelectedTimer(data.selectedTimer);
      setTimer(data.timer);
      setChatMessages(data.chatMessages);
      setIsPrivateGame(isPrivateGame);
    };

    const handleUserLeft = (data: any) => {
      const { blackTeam, whiteTeam, spectators } = data;
      setBlackTeam(blackTeam);
      setWhiteTeam(whiteTeam);
      setSpectators(spectators);
    };

    const handleGameOver = (data: GameOverEvent) => {
      if (data.isTimeout) {
        setGameTimedOut(true);
      } else if (data.isAbort) {
        setIsGameAborted(true);
      } else if (data.isResigned) {
        setColorResigned(data.color);
        setUsernameResigned(data.username);
      } else if (data.isDraw) {
        setIsDraw(true);
      }
      setGameEnded(true);
      gameQuery.refetch();
    };

    const handleChessMove = ({
      chessMove,
      senderId,
      blackTeam,
      whiteTeam,
      history
    }: ChessMoveEvent) => {
      setBlackTeam(blackTeam);
      setWhiteTeam(whiteTeam);
      if (history) setGameHistory(history);
      if (socket.id !== senderId) setIncomingMove(chessMove);
    };

    const handleTimer = (_timer: Timer) => {
      setTimer(_timer);
    };

    const handleChat = (messages: ChatMessage[]) => {
      setChatMessages(messages);
    };

    const handleRematch = (_rematchRoomId: string) => {
      setRematchRoomId(_rematchRoomId);
    };

    const handleUpdateTimer = ({timer, selectedTimer}: {timer: Timer, selectedTimer: string}) => {
      setTimer(timer);
      setIncomingSelectedTimer(selectedTimer);
    };

    const handleGameRoomNotFound = () => {
      // router.push('/');
    };

    socket.on(CHANGE_TEAM, handleChangeTeam);
    socket.on(USER_CONNECTED, handleUserConnected);
    socket.on(USER_LEFT, handleUserLeft);
    socket.on(GAME_OVER, handleGameOver);
    socket.on(CHESS_MOVE, handleChessMove);
    socket.on(DECREMENT_TIMER, handleTimer);
    socket.on(CHAT_MESSAGE, handleChat);
    socket.on(OFFER_REMATCH, handleRematch);
    socket.on(GAME_ROOM_NOT_FOUND, handleGameRoomNotFound);
    socket.on(UPDATE_TIMER, handleUpdateTimer);

    return () => {
      socket.off(CHANGE_TEAM, handleChangeTeam);
      socket.off(USER_CONNECTED, handleUserConnected);
      socket.off(USER_LEFT, handleUserLeft);
      socket.off(GAME_OVER, handleGameOver);
      socket.off(CHESS_MOVE, handleChessMove);
      socket.off(DECREMENT_TIMER, handleTimer);
      socket.off(CHAT_MESSAGE, handleChat);
      socket.off(OFFER_REMATCH, handleRematch);
      socket.off(GAME_ROOM_NOT_FOUND, handleGameRoomNotFound);
      socket.off(UPDATE_TIMER, handleUpdateTimer);
    };
  }, [gameQuery]);

  // Sends a chess move to the server that
  // forwards it to all users in the same room
  const dispatchChessMove = (
    chessMove: Move,
    captured: string | undefined,
    promotion: string | undefined,
    game: Chess,
    previousFen: string
  ) => {
    socketRef.current?.emit(CHESS_MOVE, {
      userIdMoved: userId,
      fen: game.fen(),
      previousFen,
      turn: game.turn(),
      chessMove,
      captured,
      promotion,
      chessMoveString: game.history()[0],
      chessMoveObject: game.history({ verbose: true })[0],
      senderId: socketRef.current.id
    });
  };

  const offerRematch = () => {
    socketRef.current?.emit(OFFER_REMATCH);
  };

  const changeTeam = (teamColor: TEAM_COLOR | 'spectator') => {
    socketRef.current?.emit(CHANGE_TEAM, {
      userId,
      username,
      teamColor
    });
  };

  const dispatchAbortGame = () => {
    socketRef.current?.emit(GAME_OVER, {
      isAbort: true
    });
  };

  const dispatchResignGame = (
    color: TEAM_COLOR,
    userId: string,
    username: string
  ) => {
    socketRef.current?.emit(GAME_OVER, {
      color,
      userId,
      username,
      isResigned: true
    });
  };

  const dispatchGameOver = (
    winningColor: TEAM_COLOR,
    isDraw: boolean,
    isCheckmate: boolean
  ) => {
    socketRef.current?.emit(GAME_OVER, {
      color: winningColor,
      isCheckmate,
      isDraw
    });
  };

  const dispatchChatMessage = (message: string) => {
    socketRef.current?.emit(CHAT_MESSAGE, {
      id: randomstring.generate(10),
      message,
      userId
    });
  };

  const dispatchUpdateTimer = (timer: string) => {
    socketRef.current?.emit(UPDATE_TIMER, {
      timer
    });
  };

  const blackOnlineCount = (blackTeam?.usersInRoom ?? []).filter(
    (member) => member.online
  ).length;
  const whiteOnlineCount = (whiteTeam?.usersInRoom ?? []).filter(
    (member) => member.online
  ).length;

  return {
    isPrivateGame,
    timer,
    incomingSelectedTimer,
    blackTeam,
    whiteTeam,
    spectators,
    whiteOnlineCount,
    blackOnlineCount,
    teamColor,
    gameEnded,
    isGameAborted,
    gameTimedOut,
    chatMessages,
    incomingMove,
    incomingReconnectedBoardPosition: reconnectedBoardPosition,
    colorResigned,
    usernameResigned,
    gameHistory,
    rematchRoomId,
    offerRematch,
    changeTeam,
    dispatchChatMessage,
    dispatchChessMove,
    dispatchAbortGame,
    dispatchResignGame,
    dispatchGameOver,
    dispatchUpdateTimer,
    isDraw
  };
};

export default useChessRoom;
