import React, { createContext, useEffect, useMemo, useState, ReactNode } from 'react';
import { Alert } from 'react-native';
import { router } from 'expo-router';
import { Chess, Move } from 'chess.js';
import {
  colorOf,
  nextMover,
  remainingMs,
  timeControlKey,
  turn as boardTurn,
  type Color,
  type GameState,
  type RoomSnapshot,
} from '@relay-chess/game';
import { ChatMessage, GameMove, Spectator, TEAM_COLOR, TeamInRoom, TeamMember } from '@/types/types';
import useChessRoom from '@/hooks/useChessRoom';
import { fromServerTimer } from '@/lib/socket';

interface ChessGameContextProps {
  /** raw server state, for components that use @relay-chess/game helpers directly */
  game: GameState | undefined;
  room: RoomSnapshot | undefined;
  /** remaining ms per side right now (null when untimed) */
  clocks: Record<Color, number> | null;
  /** local-time deadline per away side: forfeit mid-game, or the quick match closes before it starts */
  deadlines: Partial<Record<Color, number>>;
  isPrivateGame: boolean;
  roomId: string;
  isLoggedIn: boolean;
  opponentTimer: string;
  myTimer: string;
  selectedTimer: string;
  userId: string;
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
  canResign: boolean; // abort until both sides moved, then resign only
  colorResigned: TEAM_COLOR | undefined;
  isCheckmate: boolean;
  winningTeamId: string;
  losingTeamId: string;
  winningTeamColor: TEAM_COLOR | undefined;
  drawOfferedBy: TEAM_COLOR | null;
  roomError: string | null;
  sendChatMessage: (message: string) => void;
  movePiece: (move: { from: string; to: string; promotion?: string }) => Move | null;
  resignGame: () => void;
  autoResignGame: (teamColor: TEAM_COLOR, userId: string, username: string) => void;
  abortGame: () => void;
  offerDraw: () => void;
  setMoveHistoryFen: (fen: string) => void;
  changeTeam: (team: 'w' | 'b' | 'spectator') => void;
  offerRematch: () => void;
  updateTimer: (timer: string) => void;
  setWatchable: (watchable: boolean) => void;
  setSpectatorsMuted: (muted: boolean) => void;
}

const noop = () => {};
export const ChessGameContext = createContext<ChessGameContextProps>({
  game: undefined,
  room: undefined,
  clocks: null,
  deadlines: {},
  isPrivateGame: false,
  roomId: '',
  isLoggedIn: false,
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
  drawOfferedBy: null,
  roomError: null,
  sendChatMessage: noop,
  movePiece: () => null,
  resignGame: noop,
  autoResignGame: noop,
  abortGame: noop,
  offerDraw: noop,
  setMoveHistoryFen: noop,
  changeTeam: noop,
  offerRematch: noop,
  updateTimer: noop,
  setWatchable: noop,
  setSpectatorsMuted: noop,
});

interface ChessGameProviderProps {
  children: ReactNode;
  isLoggedIn?: boolean;
  roomId: string;
  /** kept for compatibility; identity now comes from the server session */
  userId?: string;
  username?: string;
  selectedTimer?: string;
}

const replay = (game: GameState | undefined) => {
  const chess = new Chess();
  for (const m of game?.moves ?? []) chess.move({ from: m.from, to: m.to, promotion: m.promotion });
  return chess;
};

const formatClock = (ms: number) => {
  const total = Math.max(0, Math.ceil(ms / 1000));
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
};

/** Pieces captured and promoted by each color, from the move list. */
function material(chess: Chess) {
  const out = { w: { captured: [] as string[], promotion: [] as string[] }, b: { captured: [] as string[], promotion: [] as string[] } };
  for (const m of chess.history({ verbose: true })) {
    if (m.captured) out[m.color].captured.push(m.captured);
    if (m.promotion) out[m.color].promotion.push(m.promotion);
  }
  return out;
}

/**
 * Game state for the game page, derived entirely from server snapshots.
 * Keeps the field names the existing components use.
 */
export const ChessGameProvider = ({ children, isLoggedIn = false, roomId }: ChessGameProviderProps) => {
  const room = useChessRoom(roomId);
  const game = room.room?.game;
  const userId = room.userId;

  const [moveHistoryFen, setMoveHistoryFen] = useState('');
  // Optimistic position while a move is in flight. It only applies on top of
  // the snapshot it was made from, so the next snapshot replaces it.
  const [optimistic, setOptimistic] = useState<{ base: GameState | undefined; chess: Chess } | null>(null);
  const serverChess = useMemo(() => replay(game), [game]);
  const chessGame = optimistic && optimistic.base === game ? optimistic.chess : serverChess;

  // Tick clocks while a timed game is running.
  const [now, setNow] = useState(() => Date.now());
  const running = game?.status === 'playing' && game.timeControl !== null;
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [running]);

  const myColor: Color | undefined = game ? (colorOf(game, userId) ?? undefined) : undefined;
  const turn = game ? boardTurn(game) : 'w';
  const over = game?.status === 'over';
  const mover = game && !over ? nextMover(game, turn) : undefined;
  const bothTeams = !!game && game.teams.w.length > 0 && game.teams.b.length > 0;
  const result = game?.result ?? null;
  const mat = useMemo(() => material(serverChess), [serverChess]);

  const team = (c: Color): TeamInRoom | undefined =>
    game && {
      id: c === 'w' ? 'white' : 'black',
      name: c === 'w' ? 'White' : 'Black',
      usersInRoom: game.teams[c].map((p) => ({
        id: p.id,
        username: p.name,
        online: p.connected,
        color: c,
        isMove: !over && turn === c && mover?.id === p.id,
      })),
      lastMovedUserId: [...game.moves].reverse().find((m) => m.color === c)?.playerId ?? '',
      captured: mat[c].captured,
      promotion: mat[c].promotion,
    };

  // Before the first move show the starting time. Once the game ends, show the
  // clocks as of the final snapshot (counts time spent on the last turn).
  const clocks = !game
    ? null
    : game.status === 'waiting' && game.timeControl
      ? { w: game.timeControl.initialMs, b: game.timeControl.initialMs }
      : game.status === 'over' && game.result?.reason !== 'timeout'
        ? remainingMs({ ...game, status: 'playing' }, room.room?.serverNow ?? now)
        : remainingMs(game, now + room.clockOffset);
  const clockFor = (c: Color) => (clocks ? formatClock(clocks[c]) : '');
  const deadlines = useMemo(() => {
    const out: Partial<Record<Color, number>> = {};
    for (const [c, at] of Object.entries(room.room?.deadlines ?? {})) out[c as Color] = at - room.clockOffset;
    return out;
  }, [room.room?.deadlines, room.clockOffset]);
  const bottom: Color = myColor ?? 'w';
  const top: Color = bottom === 'w' ? 'b' : 'w';
  const names = new Map([...(game?.teams.w ?? []), ...(game?.teams.b ?? [])].map((p) => [p.id, p.name]));

  const fail = (title: string) => (res: { ok: boolean; error?: string }) => {
    if (!res.ok) Alert.alert(title, res.error);
  };

  const movePiece = (move: { from: string; to: string; promotion?: string }) => {
    if (!game || moveHistoryFen) return null;
    const next = new Chess(chessGame.fen());
    let played: Move;
    try {
      played = next.move(move);
    } catch {
      return null;
    }
    setOptimistic({ base: game, chess: next });
    room.move(move.from, move.to, move.promotion).then((res) => {
      if (!res.ok) {
        setOptimistic(null);
        fail('Move rejected')(res);
      }
    });
    return played;
  };

  const value: ChessGameContextProps = {
    game,
    room: room.room ?? undefined,
    clocks,
    deadlines,
    isPrivateGame: room.room?.isPrivate ?? false,
    roomId,
    isLoggedIn,
    myTimer: clockFor(bottom),
    opponentTimer: clockFor(top),
    chatMessages: [...(room.room?.chat ?? [])]
      .reverse()
      .map((m) => ({ id: m.id, message: m.text, userId: m.userId, username: m.name })),
    selectedTimer: game ? fromServerTimer(timeControlKey(game.timeControl)) : '0,0',
    username: room.username,
    userId,
    teamColor: myColor,
    userToMoveNext: mover && {
      id: mover.id,
      username: mover.name,
      online: mover.connected,
      color: turn,
      isMove: true,
    },
    isMyMove: !!game && !over && bothTeams && myColor === turn && mover?.id === userId,
    isMyMoveNext: !!game && !over && !!myColor && myColor !== turn && nextMover(game, myColor)?.id === userId,
    waitingOnTeamsToJoin:
      !game ||
      (game.status === 'waiting' && (!game.teams.w.some((p) => p.connected) || !game.teams.b.some((p) => p.connected))),
    blackTeam: team('b'),
    whiteTeam: team('w'),
    spectators: (room.room?.spectators ?? []).map((s) => ({ id: s.id, username: s.name, online: true })),
    chessGame,
    moveHistoryFen,
    isGameOver: over,
    isDraw: over && result?.winner === null && result?.reason !== 'aborted',
    usernameResigned: result?.reason === 'resign' && result.by ? (names.get(result.by) ?? '') : '',
    canResign: (game?.moves.length ?? 0) > 1,
    colorResigned: result?.reason === 'resign' && result.winner ? (result.winner === 'w' ? 'b' : 'w') : undefined,
    isGameAborted: result?.reason === 'aborted',
    gameTimedOut: result?.reason === 'timeout',
    gameHistory: (game?.moves ?? []).map((m) => ({
      move: m.san,
      sanMove: m.san,
      lanMove: m.lan,
      userId: m.playerId,
      username: names.get(m.playerId),
      fen: m.fen,
    })),
    isCheckmate: result?.reason === 'checkmate',
    winningTeamId: '',
    losingTeamId: '',
    winningTeamColor: result?.winner ?? undefined,
    rematchRoomId: room.room?.rematchRoomId ?? '',
    drawOfferedBy: game?.drawOfferBy ?? null,
    roomError: room.error,
    sendChatMessage: (message: string) => void room.sendChat(message).then(fail('Message not sent')),
    movePiece,
    resignGame: () => void room.resign().then(fail('Could not resign')),
    // The server forfeits a team that has fully left; clients no longer decide results.
    autoResignGame: noop,
    abortGame: () => void room.abort().then(fail('Could not abort')),
    offerDraw: () => void room.offerDraw().then(fail('Could not offer a draw')),
    setMoveHistoryFen,
    changeTeam: (t) => void room.changeTeam(t).then(fail('Could not switch sides')),
    offerRematch: () =>
      void room.rematch().then((res) => {
        if (res.ok) router.replace(`/games/${res.roomId}`);
        else fail('Rematch failed')(res);
      }),
    updateTimer: (timer: string) => void room.setTimer(timer).then(fail('Could not change the timer')),
    setWatchable: (watchable: boolean) => void room.setWatchable(watchable).then(fail('Could not change who can watch')),
    setSpectatorsMuted: (muted: boolean) => void room.setSpectatorsMuted(muted).then(fail('Could not change spectator chat')),
  };

  return <ChessGameContext.Provider value={value}>{children}</ChessGameContext.Provider>;
};
