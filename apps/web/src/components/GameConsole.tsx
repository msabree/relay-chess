import React, { useContext, useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { TEAM_COLOR, TeamInRoom, TeamMember } from '@/types';
import { ChessGameContext } from '@/contexts/ChessGame';
import { TEAM_COLOR_WHITE, TEAM_COLOR_BLACK } from '@/constants';
import Timer from '@/components/Timer';
import ScoreBoard from '@/components/ScoreBoard';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';

const CircleXIcon = dynamic(() => import('lucide-react').then(mod => mod.CircleX), { ssr: false });
const ClipboardCheck = dynamic(() => import('lucide-react').then(mod => mod.ClipboardCheck), { ssr: false });
const ClockIcon = dynamic(() => import('lucide-react').then(mod => mod.Clock), { ssr: false });
const FlagIcon = dynamic(() => import('lucide-react').then(mod => mod.Flag), { ssr: false });
const Play = dynamic(() => import('lucide-react').then(mod => mod.Play), { ssr: false });
const SearchCodeIcon = dynamic(() => import('lucide-react').then(mod => mod.SearchCode), { ssr: false });
const ShareIcon = dynamic(() => import('lucide-react').then(mod => mod.Share), { ssr: false });
const RotateCcw = dynamic(() => import('lucide-react').then(mod => mod.RotateCcw), { ssr: false });
const MessageSquare = dynamic(() => import('lucide-react').then(mod => mod.MessageSquare), { ssr: false });
const Circle = dynamic(() => import('lucide-react').then(mod => mod.Circle), { ssr: false });
const Sparkles = dynamic(() => import('lucide-react').then(mod => mod.Sparkles), { ssr: false });
const AlertCircle = dynamic(() => import('lucide-react').then(mod => mod.AlertCircle), { ssr: false });
const Handshake = dynamic(() => import('lucide-react').then(mod => mod.Handshake), { ssr: false });
import { AppContext } from '@/contexts/App';
import { useIsMobile } from '@/hooks/useIsMobile';
import { useIsTablet } from '@/hooks/useIsTablet';
import { useToast } from '@/components/ui/use-toast';
import { ToastAction } from '@/components/ui/toast';
import { notifyMove } from '@/utils/notifications';
import { checkThreefoldRepetitionFromHistory } from '@/utils/games';
import { capitalizeFirstLetter } from '@/utils/strings';

// This keeps the team display in sync w/ the board orientation
const getUsersToDisplay = (
  positionTop: boolean,
  currentUserColor: TEAM_COLOR | undefined,
  blackTeam: TeamInRoom | undefined,
  whiteTeam: TeamInRoom | undefined
) => {
  if (positionTop && !currentUserColor) {
    return blackTeam;
  } else if (!positionTop && !currentUserColor) {
    return whiteTeam;
  } else if (positionTop && currentUserColor === TEAM_COLOR_WHITE) {
    return blackTeam;
  } else if (positionTop && currentUserColor === TEAM_COLOR_BLACK) {
    return whiteTeam;
  } else if (!positionTop && currentUserColor === TEAM_COLOR_BLACK) {
    return blackTeam;
  } else if (!positionTop && currentUserColor === TEAM_COLOR_WHITE) {
    return whiteTeam;
  }

  return undefined;
};

interface GameConsoleTeamViewProps {
  positionTop: boolean
  isMyTimer?: boolean
  justifyContent?: string
}

export const GameConsoleTeamView = ({
  positionTop,
  isMyTimer,
  justifyContent
}: GameConsoleTeamViewProps) => {
  const {
    userId,
    teamColor,
    blackTeam,
    whiteTeam,
    myTimer,
    opponentTimer,
    isGameOver
  } = useContext(ChessGameContext);
  const team = getUsersToDisplay(positionTop, teamColor, blackTeam, whiteTeam);

  const getOpponentColor = () => {
    if (teamColor === undefined) {
      return TEAM_COLOR_BLACK;
    }

    if (teamColor === 'b') {
      return TEAM_COLOR_WHITE;
    }
    return TEAM_COLOR_BLACK;
  };

  return (
    <div
      className={`flex flex-1 flex-col ${justifyContent === 'flex-end' ? 'justify-end' : 'justify-start'} text-white px-2 py-2`}
    >
      <div className="mb-3">
        <ScoreBoard
          color={positionTop ? getOpponentColor() : teamColor ?? TEAM_COLOR_WHITE}
          whiteCaptured={whiteTeam?.captured ?? []}
          blackCaptured={blackTeam?.captured ?? []}
          whitePromoted={whiteTeam?.promotion ?? []}
          blackPromoted={blackTeam?.promotion ?? []}
        />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
        <div className="flex-1 space-y-2">
          {team?.usersInRoom?.map((user: TeamMember) => {
            const isCurrentUser = userId === user.id;
            // Format username for display (shortens long anon IDs)
            const displayName = user.username ?? user.id ?? "Anonymous";
            
            return (
              <div className={`${(user.isMove && !isGameOver) ? 'animate-pulse text-orange-500 font-bold' : ''} flex items-center text-sm gap-2`} key={user.id}>
                <Circle size={10} style={{ fontSize: '30px', fill: user.online ? 'green' : '#d4d4d4', stroke: 'none', flexShrink: 0 }} />
                <span className="truncate">{displayName}</span>
                {isCurrentUser && (
                  <span className="ml-auto font-bold text-cyan-400 bg-cyan-400/20 px-2 py-0.5 rounded text-xs whitespace-nowrap">
                    {"(You)"}
                  </span>
                )}
              </div>
            );
          })}
          {(team?.usersInRoom ?? []).length === 0 && (
            <div className='flex items-center text-sm gap-2'>
              <Circle size={10} style={{ fontSize: '30px', fill: '#d4d4d4', stroke: 'none', flexShrink: 0 }} />
              <span className="text-white/60">{"Waiting on more players..."}</span>
            </div>
          )}
        </div>
        <div className="flex-shrink-0">
          {isMyTimer === true && <Timer timer={myTimer} />}
          {isMyTimer === false && <Timer timer={opponentTimer} />}
        </div>
      </div>
    </div>
  );
};

export const GameConsoleCenter = () => {
  const {
    resignGame,
    autoResignGame,
    abortGame,
    isMyMove,
    canResign,
    isGameOver,
    isGameAborted,
    userId,
    teamColor,
    roomId,
    waitingOnTeamsToJoin,
    userToMoveNext,
    moveHistoryFen,
    colorResigned,
    usernameResigned,
    isPrivateGame,
    chatMessages,
    chessGame,
    gameHistory,
    gameTimedOut,
    winningTeamColor,
    isDraw,
    isCheckmate
  } = useContext(ChessGameContext);
  const { setModal, modal } = useContext(AppContext);
  const [autoEndTime, setAutoEndTime] = useState<number>(15);
  const [intervalId, setIntervalId] = useState<number>(-1);
  const [copied, setCopied] = useState<boolean>(false);
  const userToMoveLeftGame = (userToMoveNext && !userToMoveNext.online) ?? false;
  const gameResigned = colorResigned !== undefined && usernameResigned !== '';
  const [isConfirmingResign, setIsConfirmingResign] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const lastMessageRef = useRef<string>('');
  const lastMoveNotificationRef = useRef<boolean>(false);
  const gameOverNotificationRef = useRef<boolean>(false);
  const autoResignTriggeredRef = useRef<boolean>(false); // Prevent multiple auto-resigns
  const { toast } = useToast();

  const isMobile = useIsMobile();
  const isTablet = useIsTablet();

  // Start countdown timer and handle auto-resign when player leaves
  useEffect(() => {
    if(userToMoveLeftGame && !isGameAborted && !isGameOver && intervalId === -1 && !autoResignTriggeredRef.current){
      const interval = window.setInterval(() => {
        setAutoEndTime((prev) => {
          const newTime = prev - 1;
          
          // When countdown reaches 0, trigger auto-resign and clear interval
          if (newTime <= 0) {
            clearInterval(interval);
            setIntervalId(-1);
            
            // Trigger auto-resign immediately
            if (teamColor === 'w' || teamColor === 'b') {
              autoResignTriggeredRef.current = true; // Mark as triggered to prevent duplicates
              const opponentColor = teamColor === 'w' ? 'b' : 'w';
              autoResignGame(opponentColor, userToMoveNext?.id ?? "Anonymous", userToMoveNext?.username ?? "Anonymous");
            }
            
            return 0;
          }
          
          return newTime;
        });
      }, 1000);
      setIntervalId(interval);
      
      // Cleanup on unmount or when conditions change
      return () => {
        clearInterval(interval);
        setIntervalId(-1);
      };
    }
  }, [userToMoveLeftGame, isGameAborted, isGameOver, intervalId, teamColor, userToMoveNext, autoResignGame]);

  // Reset auto-resign trigger and countdown when game state changes
  useEffect(() => {
    if (isGameOver || isGameAborted) {
      autoResignTriggeredRef.current = false;
      setAutoEndTime(15);
      if (intervalId !== -1) {
        clearInterval(intervalId);
        setIntervalId(-1);
      }
    }
  }, [isGameOver, isGameAborted]);

  useEffect(() => {
    if (!chatMessages?.length || modal?.name === 'CHAT') return;

    const lastMessage = chatMessages[0];
    if (lastMessage.id !== lastMessageRef.current && lastMessage.userId !== userId) {
      setUnreadCount(prev => prev + 1);
      lastMessageRef.current = lastMessage.id;
    }
  }, [chatMessages, userId, modal?.name]);

  // Modern move notification system
  useEffect(() => {
    if (isMyMove && !isGameOver && !isGameAborted && !waitingOnTeamsToJoin && !lastMoveNotificationRef.current) {
      lastMoveNotificationRef.current = true;
      
      // Show toast notification
      toast({
        title: "Your Move!",
        description: "It's your turn to make a move.",
        className: 'glass-effect border-cyan-400/50 bg-gradient-to-r from-cyan-500/20 to-blue-500/20',
      });
      
      // Play sound and browser notification
      notifyMove("Your Move!", "It's your turn to make a move in Relay Chess").catch(() => {});
      
      // Reset notification flag when move is no longer active
      return () => {
        lastMoveNotificationRef.current = false;
      };
    } else if (!isMyMove) {
      lastMoveNotificationRef.current = false;
    }
  }, [isMyMove, isGameOver, isGameAborted, waitingOnTeamsToJoin, toast]);

  // Game over notification with feedback prompt
  useEffect(() => {
    if (isGameOver && !isGameAborted && !gameOverNotificationRef.current) {
      gameOverNotificationRef.current = true;
      
      // Determine game over message
      const getGameOverMessage = () => {
        const colorLabel = (color: string) => capitalizeFirstLetter(color === 'white' ? "White" : "Black");
        if (gameResigned) {
          const winningColor = colorResigned === 'w' ? 'black' : 'white';
          return `${colorLabel(winningColor)} won by resignation. ${usernameResigned} resigned.`;
        }
        if (gameTimedOut && winningTeamColor) {
          return `${colorLabel(winningTeamColor)} won on time.`;
        }
        if (gameTimedOut && winningTeamColor === undefined) {
          return "Time expired.";
        }
        if (winningTeamColor !== undefined && isCheckmate) {
          return `${colorLabel(winningTeamColor)} won by checkmate.`;
        }
        if (winningTeamColor !== undefined) {
          return `${colorLabel(winningTeamColor)} won.`;
        }
        if (isDraw) {
          const drawReasonKey = chessGame.isStalemate() ? 'stalemate' :
            chessGame.isInsufficientMaterial() ? 'insufficientMaterial' :
              chessGame.isThreefoldRepetition() ? 'threefold' :
                chessGame.isDraw() ? 'agreement' : 'draw';
          const drawReason = ({ stalemate: 'Stalemate', insufficientMaterial: 'Insufficient Material', threefold: 'Three-fold Repetition', agreement: 'Draw by Agreement', draw: 'Draw' } as Record<string, string>)[drawReasonKey] ?? 'Draw';
          return `The game ended in a draw (${drawReason}).`;
        }
        return "This game has ended.";
      };

      const message = getGameOverMessage();
      
      // Show toast notification with feedback button
      toast({
        title: "Game Over",
        description: message,
        className: 'glass-effect border-cyan-400/50 bg-gradient-to-r from-cyan-500/20 to-blue-500/20',
        duration: 10000, // Show for 10 seconds
        action: (
          <ToastAction
            altText={"Leave feedback"}
            className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-400/10 border border-cyan-400/30"
            onClick={() => {
              setModal({ name: 'GAME_FEEDBACK' });
            }}
          >
            <MessageSquare className="w-4 h-4 mr-1" />
            {"Feedback"}
          </ToastAction>
        ),
      });
    } else if (!isGameOver) {
      gameOverNotificationRef.current = false;
    }
  }, [isGameOver, isGameAborted, gameResigned, colorResigned, usernameResigned, gameTimedOut, winningTeamColor, isDraw, isCheckmate, chessGame, toast, setModal]);

  const handleResignClick = () => {
    if (!canResign || isGameOver) return;
    
    if (!isConfirmingResign) {
      setIsConfirmingResign(true);
      setTimeout(() => {
        setIsConfirmingResign(false);
      }, 3000);
    } else {
      resignGame();
      setIsConfirmingResign(false);
    }
  };

  const handleOpenChat = () => {
    setUnreadCount(0);
    setModal({name: 'CHAT'});
  };

  if (userId === '' && !isGameOver) {
    return (
      <div className='flex flex-col items-center'>
        {copied ? <ClipboardCheck size={30} /> : <ShareIcon size={30} />}
        <Button
          variant="ghost"
          className='flex flex-col bg-transparent hover:bg-transparent'
          onClick={() => {
            navigator.clipboard.writeText(window.location.href ?? '');
            setCopied(true);
            window.setTimeout(() => {
              setCopied(false);
            }, 5000);
          }}
        >
          <div className="text-xs">
            {copied ? "Copied!" : "Share Link"}
          </div>
        </Button>
      </div>
    );
  } else if (userId === '' && isGameOver && !isGameAborted) {
    return (
      <Link href={`/analysis/${roomId}`}>
        <Button className='bg-transparent hover:bg-transparent'>
          <div className='flex flex-col items-center'>
            <SearchCodeIcon />
            <div className="text-xs text-white">{"View Analysis"}</div>
          </div>
        </Button>
      </Link>
    );
  }

  return (
    <>
      {/* Modern status indicators - subtle and elegant */}
      {isMyMove &&
        !isGameOver &&
        !isGameAborted &&
        !waitingOnTeamsToJoin && (
        <div className='glass-effect border border-cyan-400/30 rounded-lg p-3 mb-4 flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500/10 to-blue-500/10'>
          <Sparkles className='w-5 h-5 text-cyan-400 animate-pulse' />
          <span className='text-cyan-400 font-semibold text-sm'>{"Your Move!"}</span>
        </div>
      )}
      {waitingOnTeamsToJoin &&
        !userToMoveLeftGame &&
        !isGameAborted &&
        !isGameOver &&
        !gameResigned && !canResign && (
        <div className='glass-effect border border-yellow-400/30 rounded-lg p-3 mb-4 flex items-center justify-center gap-2 bg-yellow-400/10'>
          <AlertCircle className='w-5 h-5 text-yellow-400' />
          <span className='text-yellow-400 text-sm'>{"Waiting on more players..."}</span>
        </div>
      )}
      {userToMoveLeftGame && !isGameAborted && !isGameOver && (
        <div className='glass-effect border border-orange-400/30 rounded-lg p-3 mb-4 flex items-center justify-center gap-2 bg-orange-400/10'>
          <AlertCircle className='w-5 h-5 text-orange-400' />
          <span className='text-orange-400 text-sm'>
            {`Player left. Auto-resigning in ${autoEndTime}s...`}
          </span>
        </div>
      )}
      {moveHistoryFen !== '' && !isGameAborted && !isGameOver && (
        <div className='glass-effect border border-blue-400/30 rounded-lg p-3 mb-4 flex items-center justify-center gap-2 bg-blue-400/10'>
          <SearchCodeIcon className='w-5 h-5 text-blue-400' />
          <span className='text-blue-400 text-sm'>{"Review Mode - Navigate to last move to continue"}</span>
        </div>
      )}
      {isGameAborted && (
        <div className='glass-effect border border-red-500/50 rounded-lg p-4 mb-4 flex items-center justify-center gap-2 bg-red-500/10'>
          <CircleXIcon className='w-6 h-6 text-red-400' />
          <span className='text-red-400 font-semibold'>{"Game Aborted"}</span>
        </div>
      )}
      {isGameOver && !isGameAborted && (
        <div className='glass-effect border border-gray-400/30 rounded-lg p-4 mb-4 flex items-center justify-center gap-2 bg-gray-400/10'>
          <FlagIcon className='w-6 h-6 text-gray-400' />
          <span className='text-gray-300 font-semibold'>{"Game Over"}</span>
        </div>
      )}
      
      {/* Creative two-row button bar */}
      <div className='glass-effect border border-white/10 rounded-xl p-4 backdrop-blur-xl space-y-3'>
        {/* Row 1: Game Control Actions */}
        <div className='flex flex-row items-center justify-center gap-2.5 flex-wrap'>
          {teamColor && !canResign && !isGameOver && !isGameAborted && (
            <Button 
              variant="ghost"
              className='hover:bg-red-400/10 text-red-400 hover:text-red-300 transition-all duration-200 px-3 py-2 h-auto rounded-lg flex-1 min-w-[80px]' 
              onClick={() => abortGame()}
            >
              <CircleXIcon className='w-4 h-4 mr-1.5' />
              <span className="text-xs font-medium">{"Abort"}</span>
            </Button>
          )}
          {teamColor && canResign && !isGameOver && (
            <Button 
              variant="ghost"
              className={`relative hover:bg-red-400/10 transition-all duration-200 px-3 py-2 h-auto rounded-lg flex-1 min-w-[80px] ${
                isConfirmingResign 
                  ? 'text-red-400 bg-red-400/20' 
                  : 'text-red-400 hover:text-red-300'
              }`}
              onClick={handleResignClick}
            >
              <FlagIcon className='w-4 h-4 mr-1.5' />
              <span className={`text-xs font-medium transition-colors ${
                isConfirmingResign ? 'text-red-400' : ''
              }`}>
                {isConfirmingResign ? "Confirm?" : "Resign"}
              </span>
              {isConfirmingResign && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-400/50 rounded-b-lg">
                  <div className="h-full bg-red-400 animate-[shrink_3s_linear_forwards] rounded-b-lg" />
                </div>
              )}
            </Button>
          )}
          {isPrivateGame && !canResign && !isGameOver && !isGameAborted && (
            <Button 
              variant="ghost"
              className='hover:bg-cyan-400/10 text-cyan-400 hover:text-cyan-300 transition-all duration-200 px-3 py-2 h-auto rounded-lg flex-1 min-w-[80px]' 
              onClick={() => setModal({name: 'SWITCH_SIDES'})}
            >
              <RotateCcw className='w-4 h-4 mr-1.5' />
              <span className="text-xs font-medium">{"Flip"}</span>
            </Button>
          )}
          {isPrivateGame && teamColor && !canResign && !isGameOver && !isGameAborted && (
            <Button 
              variant="ghost"
              className='hover:bg-cyan-400/10 text-cyan-400 hover:text-cyan-300 transition-all duration-200 px-3 py-2 h-auto rounded-lg flex-1 min-w-[80px]' 
              onClick={() => setModal({name: 'GAME_CONTROL_PANEL'})}
            >
              <ClockIcon className='w-4 h-4 mr-1.5' />
              <span className="text-xs font-medium">{"Timer"}</span>
            </Button>
          )}
        </div>

        {/* Row 2: Utility Actions */}
        <div className='flex flex-row items-center justify-center gap-2.5 flex-wrap'>
          {/* Three-fold Repetition Claim Button */}
          {!isGameOver && !isGameAborted && isMyMove && chessGame && gameHistory.length > 0 && (() => {
            const fullHistory = gameHistory.map((m) => m.lanMove as string);
            const canClaimThreefold = checkThreefoldRepetitionFromHistory(fullHistory);
            return canClaimThreefold ? (
              <Button
                variant="ghost"
                className='hover:bg-amber-400/10 text-amber-400 hover:text-amber-300 transition-all duration-200 px-3 py-2 h-auto rounded-lg flex-1 min-w-[100px] border border-amber-400/30'
                onClick={() => {
                  toast({
                    title: "Claim Draw",
                    description: "Three-fold repetition detected. Draw will be claimed.",
                    duration: 3000,
                  });
                  // The draw will be automatically detected on next move, but we can show a message
                }}
              >
                <Handshake className='w-4 h-4 mr-1.5' />
                <span className="text-xs font-medium">{"Claim Draw"}</span>
              </Button>
            ) : null;
          })()}
          {!isGameOver && !isGameAborted && (
            <Button
              variant="ghost"
              className='hover:bg-cyan-400/10 text-cyan-400 hover:text-cyan-300 transition-all duration-200 px-3 py-2 h-auto rounded-lg flex-1 min-w-[80px]'
              onClick={() => {
                navigator.clipboard.writeText(window.location.href ?? '');
                setCopied(true);
                window.setTimeout(() => {
                  setCopied(false);
                }, 2000);
              }}
            >
              {copied ? (
                <>
                  <ClipboardCheck className='w-4 h-4 mr-1.5' />
                  <span className="text-xs font-medium">{"Copied!"}</span>
                </>
              ) : (
                <>
                  <ShareIcon className='w-4 h-4 mr-1.5' />
                  <span className="text-xs font-medium">{"Share"}</span>
                </>
              )}
            </Button>
          )}
          {!isPrivateGame && isGameOver && (
            <Button 
              variant="ghost"
              className='hover:bg-cyan-400/10 text-cyan-400 hover:text-cyan-300 transition-all duration-200 px-3 py-2 h-auto rounded-lg flex-1 min-w-[80px]' 
              onClick={() => {
                sessionStorage.setItem('contextDirty', 'true');
                setModal({name: 'START_NEW_GAME'});
              }}
            >
              <Play className='w-4 h-4 mr-1.5' />
              <span className="text-xs font-medium">{"New"}</span>
            </Button>
          )}
          {isGameOver && !isGameAborted && (
            <Link href={`/analysis/${roomId}`}>
              <Button 
                variant="ghost"
                className='hover:bg-cyan-400/10 text-cyan-400 hover:text-cyan-300 transition-all duration-200 px-3 py-2 h-auto rounded-lg flex-1 min-w-[80px]'
              >
                <SearchCodeIcon className='w-4 h-4 mr-1.5' />
                <span className="text-xs font-medium">{"Analysis"}</span>
              </Button>
            </Link>
          )}
          {(isMobile || isTablet) && (
            <Button
              variant="ghost"
              className='hover:bg-cyan-400/10 text-cyan-400 hover:text-cyan-300 transition-all duration-200 px-3 py-2 h-auto rounded-lg flex-1 min-w-[80px] relative'
              onClick={handleOpenChat}
            >
              <MessageSquare className='w-4 h-4 mr-1.5' />
              <span className="text-xs font-medium">{"Chat"}</span>
              {unreadCount > 0 && (
                <div className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-gradient-to-r from-red-500 to-red-600 text-white text-[10px] font-medium flex items-center justify-center">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </div>
              )}
            </Button>
          )}
        </div>
      </div>
    </>
  );
};

export const GameConsole = () => {
  const { opponentTimer, myTimer } = useContext(ChessGameContext);

  return (
    <div className="hidden sm:flex w-[300px] h-[70%] glass-effect border border-white/10 rounded-xl shadow-lg backdrop-blur-xl">
      <div className='flex flex-col justify-center w-[300px] p-4'>
        <div className="mb-4">
          <Timer timer={opponentTimer} />
        </div>
        <div className="h-px w-full bg-white/10 my-3" />
        <div className="mb-4">
          <GameConsoleTeamView
            positionTop={true}
            justifyContent={'flex-start'}
          />
        </div>
        <div className="mb-4">
          <GameConsoleCenter />
        </div>
        <div className="mb-4">
          <GameConsoleTeamView
            positionTop={false}
            justifyContent={'flex-end'}
          />
        </div>
        <div className="h-px w-full bg-white/10 my-3" />
        <div className="mt-2">
          <Timer timer={myTimer} />
        </div>
      </div>
    </div>
  );
};
