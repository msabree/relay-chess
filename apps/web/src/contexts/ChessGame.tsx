import React, { createContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Chess, Move } from 'chess.js';
import {
  ChatMessage,
  GameMove,
  Spectator,
  TEAM_COLOR,
  TeamInRoom,
  TeamMember
} from '@/types';
import useChessRoom from '@/hooks/useChessRoom';
import { TEAM_COLOR_BLACK } from '@/constants';
import { useGame } from '@/hooks/useGame';
import { isUnique } from '@/utils/arrays';
import { checkThreefoldRepetitionFromHistory } from '@/utils/games';

interface ChessGameContextProps {
  isPrivateGame: boolean;
  roomId: string;
  isLoggedIn: boolean;
  opponentTimer: string;
  myTimer: string;
  selectedTimer: string;
  userId: string; // set in context for anon users
  username: string;
  chessGame: Chess;
  moveHistoryFen: string;
  teamColor: TEAM_COLOR | undefined;
  userToMoveNext: TeamMember | undefined;
  isMyMove: boolean;
  isMyMoveNext: boolean;
  blackTeam: TeamInRoom | undefined;
  whiteTeam: TeamInRoom | undefined;
  spectators: Spectator[];
  waitingOnTeamsToJoin: boolean;
  isGameOver: boolean;
  isDraw: boolean;
  rematchRoomId: string;
  isGameAborted: boolean;
  gameTimedOut: boolean;
  gameHistory: GameMove[];
  chatMessages: ChatMessage[];
  usernameResigned: string;
  canResign: boolean; // abort until black moves, then resign only
  colorResigned: TEAM_COLOR | undefined;
  isCheckmate: boolean;
  winningTeamId: string;
  losingTeamId: string;
  winningTeamColor: TEAM_COLOR | undefined;
  sendChatMessage: Function;
  movePiece: Function;
  resignGame: Function;
  // eslint-disable-next-line no-unused-vars
  autoResignGame: (teamColor: TEAM_COLOR, userId: string, username: string) => void;
  abortGame: Function;
  setMoveHistoryFen: Function;
  // eslint-disable-next-line no-unused-vars
  changeTeam: (team: 'w' | 'b' | 'spectator') => void;
  offerRematch: () => void;
  // eslint-disable-next-line no-unused-vars
  updateTimer: (timer: string) => void;
}

export const ChessGameContext = createContext<ChessGameContextProps>({
  isPrivateGame: false,
  roomId: '',
  isLoggedIn: false,// default to public
  opponentTimer: '5:00',
  myTimer: '5:00',
  selectedTimer: '0,0',
  userId: '',
  username: '',
  chessGame: new Chess(),
  moveHistoryFen: '',
  teamColor: undefined,
  userToMoveNext: undefined,
  isMyMove: false,
  isMyMoveNext: false,
  blackTeam: undefined,
  whiteTeam: undefined,
  spectators: [],
  waitingOnTeamsToJoin: true,
  isGameOver: false,
  isDraw: false,
  isGameAborted: false,
  gameTimedOut: false,
  gameHistory: [],
  chatMessages: [],
  usernameResigned: '',
  colorResigned: undefined,
  canResign: false,
  isCheckmate: false,
  winningTeamId: '',
  losingTeamId: '',
  winningTeamColor: undefined,
  rematchRoomId: '',
  sendChatMessage: () => {},
  movePiece: () => {},
  resignGame: () => {},
  autoResignGame: () => {},
  abortGame: () => {},
  setMoveHistoryFen: () => {},
  changeTeam: () => {},
  offerRematch: () => {},
  updateTimer: () => {},
});

interface ChessGameProviderProps {
  children: ReactNode;
  isLoggedIn?: boolean;
  roomId: string;
  userId: string;
  username: string;
  selectedTimer: string;
}

export const ChessGameProvider = ({
  children,
  isLoggedIn = false,
  roomId,
  userId,
  username,
  selectedTimer,
}: ChessGameProviderProps) => {
  const {
    timer, // current reference to real-time
    teamColor,
    blackTeam,
    whiteTeam,
    spectators,
    whiteOnlineCount,
    blackOnlineCount,
    colorResigned,
    usernameResigned,
    chatMessages,
    incomingSelectedTimer,
    incomingMove,
    incomingReconnectedBoardPosition,
    gameHistory,
    isGameAborted,
    gameTimedOut,
    gameEnded,
    rematchRoomId,
    offerRematch,
    dispatchChatMessage,
    dispatchChessMove,
    dispatchAbortGame,
    dispatchResignGame,
    dispatchGameOver,
    dispatchUpdateTimer,
    changeTeam,
    isPrivateGame,
    isDraw
  } = useChessRoom({
    isLoggedIn,
    roomId,
    userId,
    username,
    selectedTimer
  });

  const [chessGame, setChessGame] = useState(new Chess());
  const [moveHistoryFen, setMoveHistoryFen] = useState('');
  const gameQuery = useGame(roomId);

  // When a game is over this will be not null.
  // In that state the context should be in a read only/review mode/share game.
  // Should be able to replay game.
  // to do: save anon games on backend and store roomId with the game object
  // to do: refetch on game over event or we may fetch a stale state

  useEffect(() => {
    const userIdsPlaying = (
      blackTeam?.usersInRoom?.map((user) => user.id) ?? []
    ).concat(whiteTeam?.usersInRoom?.map((user) => user.id) ?? []);

    if (!isUnique(userIdsPlaying) && !isGameAborted) {
      dispatchAbortGame();
    }
  }, [blackTeam?.usersInRoom, whiteTeam?.usersInRoom, isGameAborted, dispatchAbortGame]);

  // Another client made a move
  // Let's keep the context in sync
  useEffect(() => {
    if (incomingMove && incomingMove !== '') {
      try {
        const _chessGame = new Chess(chessGame?.fen());
        _chessGame.move(incomingMove);
        setChessGame(_chessGame);
      } catch {}
    }
  }, [chessGame, incomingMove]);

  // User connected or reconneted after a game started.
  // Server has the most up to date board position
  // Update the fen for this context
  useEffect(() => {
    if (
      incomingReconnectedBoardPosition &&
      incomingReconnectedBoardPosition !== ''
    ) {
      window.setTimeout(() => {
        setChessGame(new Chess(incomingReconnectedBoardPosition)); // hack!
      }, 2500);
    }
  }, [incomingReconnectedBoardPosition]);

  const movePiece = (move: Move) => {
    try {
      // Save current position before moving
      const previousFen = chessGame.fen();
  
      // Clone game state and make the move
      const newGame = new Chess(previousFen);
      const result = newGame.move(move);
  
      // Invalid moves return null - silently ignore them
      if (!result) {
        return null;
      }
  
      // Update local state
      setChessGame(newGame);
  
      // Notify listeners (UI, network, etc.)
      dispatchChessMove?.(move, result.captured, result.promotion, newGame, previousFen);
  
      // Build move history for threefold repetition check
      const fullHistory = [...gameHistory.map((m) => m.lanMove as string), result.lan];
      const isThreefoldRepetition = checkThreefoldRepetitionFromHistory(fullHistory);
  
      // Determine endgame conditions
      const isDraw = newGame.isDraw() || isThreefoldRepetition;
      const isCheckmate = newGame.isCheckmate();
      const isGameOver = newGame.isGameOver() || isDraw;
  
      // Dispatch game-over event if needed
      if (isGameOver && teamColor) {
        dispatchGameOver(teamColor, isDraw, isCheckmate);
        gameQuery.refetch();
      }
  
      return result;
  
    } catch {
      // Invalid moves throw errors - silently ignore them
      return null;
    }
  };

  const isWaiting = () => {
    if (gameHistory.length === 0 && (whiteOnlineCount === 0 || blackOnlineCount === 0)) {
      return true;
    }
    return false;
  };

  const isMyMove = () => {
    const team = teamColor === TEAM_COLOR_BLACK ? blackTeam : whiteTeam;
    const me = team?.usersInRoom?.find((users) => users.id === userId);
    if (me && me.isMove) {
      return true;
    }
    return false;
  };

  // i.e. can i pre-move ...
  const isMyMoveNext = () => {
    const team = teamColor === TEAM_COLOR_BLACK ? blackTeam : whiteTeam;
    const me = team?.usersInRoom?.find((users) => users.id === userId);
    if (me && me.isMove) {
      return false;
    }

    const lastMovedUserId = team?.lastMovedUserId ?? '';
    const lastMoveUserIndex =
      team?.usersInRoom?.findIndex((users) => users.id === lastMovedUserId) ??
      0;
    const nextMoveUserIndex =
      (lastMoveUserIndex + 1) % (team?.usersInRoom ?? []).length;

    if (team?.usersInRoom?.[nextMoveUserIndex]?.id === userId && !isMyMove()) {
      return true;
    }

    return false;
  };

  const getUserTurn = () => {
    return (blackTeam?.usersInRoom ?? [])
      .concat(whiteTeam?.usersInRoom ?? [])
      .find((user) => user.isMove);
  };

  const resignGame = () => {
    if (teamColor) {
      dispatchResignGame(teamColor, userId, username);
      gameQuery.refetch();
    }
  };

  const autoResignGame = useCallback((teamColor: TEAM_COLOR, userId: string, username: string) => {
    dispatchResignGame(teamColor, userId, username);
    gameQuery.refetch();
  }, [dispatchResignGame, gameQuery]);

  const abortGame = () => {
    if (!isGameAborted) {
      dispatchAbortGame();
      gameQuery.refetch();
    }
  };

  const updateTimer = (timer: string) => {
    dispatchUpdateTimer(timer);
  };

  // IMPORTANT
  // current player's timer is always on bottom
  // when a user is watching white team is always on bottom
  const getTimer = (bottom: boolean) => {
    let seconds = 0;

    if (teamColor) {
      if (bottom) {
        seconds = timer[teamColor].initialSeconds;
      } else {
        seconds =
          teamColor === 'b'
            ? timer['w'].initialSeconds
            : timer['b'].initialSeconds;
      }
    } else {
      seconds = bottom ? timer['w'].initialSeconds : timer['b'].initialSeconds;
    }

    return new Date(seconds * 1000).toISOString().substring(14, 19);
  };

  return (
    <ChessGameContext.Provider
      value={{
        isPrivateGame,
        roomId,
        isLoggedIn,
        myTimer: getTimer(true),
        opponentTimer: getTimer(false),
        chatMessages,
        selectedTimer: incomingSelectedTimer, // the selected timer contraint
        username,
        userId, // pass here since anonIds are not part of user session
        teamColor,
        userToMoveNext: getUserTurn(),
        isMyMove: isMyMove(),
        isMyMoveNext: isMyMoveNext(),
        waitingOnTeamsToJoin: isWaiting(),
        blackTeam,
        whiteTeam,
        spectators,
        chessGame,
        moveHistoryFen,
        // yes, we need all three...
        // ...
        // gameEnded - comes from socket
        // chessGame.isGameOver() - comes from chess.js (local state)
        // gameQuery.data - comes from database
        isGameOver: gameEnded || chessGame.isGameOver() || gameQuery.data !== undefined,
        isDraw: isDraw || chessGame.isDraw() || (gameQuery.data?.result === 'draw'),
        usernameResigned,
        canResign: gameHistory.length > 1,
        colorResigned,
        isGameAborted,
        gameTimedOut,
        gameHistory,
        isCheckmate: chessGame.isCheckmate() || (gameQuery.data?.result === 'checkmate'),
        winningTeamId: '',
        losingTeamId: '',
        winningTeamColor: gameQuery.data?.winningColor ? (gameQuery.data.winningColor === 'white' ? 'w' : 'b') : (chessGame.isCheckmate() ? (chessGame.turn() === 'w' ? 'b' : 'w') : undefined),
        rematchRoomId,
        offerRematch,
        sendChatMessage: dispatchChatMessage,
        movePiece,
        resignGame,
        autoResignGame,
        abortGame,
        setMoveHistoryFen,
        changeTeam,
        updateTimer,
      }}
    >
      {children}
    </ChessGameContext.Provider>
  );
};
