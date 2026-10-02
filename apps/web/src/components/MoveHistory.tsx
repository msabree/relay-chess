import React, { useCallback, useContext, useEffect, useState, useMemo } from 'react';
import { ScrollMenu, VisibilityContext } from 'react-horizontal-scrolling-menu';
import { ChessGameContext } from '@/contexts/ChessGame';
import dynamic from 'next/dynamic';
import { useGame } from '@/hooks/useGame';
import { Chess } from 'chess.js';

const ChevronFirst = dynamic(() => import('lucide-react').then(mod => mod.ChevronFirst), { ssr: false });
const ChevronLast = dynamic(() => import('lucide-react').then(mod => mod.ChevronLast), { ssr: false });
const ChevronLeft = dynamic(() => import('lucide-react').then(mod => mod.ChevronLeft), { ssr: false });
const ChevronRight = dynamic(() => import('lucide-react').then(mod => mod.ChevronRight), { ssr: false });
const ChevronFirstIcon = ChevronFirst;
const ChevronLastIcon = ChevronLast;
import Bishop from '@/icons/Bishop';
import Knight from '@/icons/Knight';
import Queen from '@/icons/Queen';
import Rook from '@/icons/Rook';
import 'react-horizontal-scrolling-menu/dist/styles.css';

type scrollVisibilityApiType = React.ContextType<typeof VisibilityContext>;

interface MoveHistoryProps {
    roomId: string | undefined;
}

export const getSanWithIcon = (sanMove: string, isCurrentMove: boolean) => {
  const pieceChar = sanMove.charAt(0);
  return <span className='flex flex-row items-center'>{getPiece(pieceChar, isCurrentMove)}{sanMove.substring(1)}</span>;
};

export const getPiece = (piece: string, isCurrentMove: boolean) => {
  if(piece === 'N'){
    return <Knight fill={isCurrentMove ? '#ffffff': 'white'} />;
  }
  else if(piece === 'B'){
    return <Bishop fill={isCurrentMove ? '#ffffff': 'white'} />;
  }
  else if(piece === 'R'){
    return <Rook fill={isCurrentMove ? '#ffffff': 'white'} />;
  }
  else if(piece === 'Q'){
    return <Queen fill={isCurrentMove ? '#ffffff': 'white'} />;
  }
  else {
    return <span>{piece}</span>;
  }
};

const MoveHistory = ({roomId} : MoveHistoryProps) => {
  const { gameHistory, setMoveHistoryFen, isGameOver } = useContext(ChessGameContext);
  const apiRef = React.useRef({} as scrollVisibilityApiType);
  const gameQuery = useGame(roomId || '');
  const afterGameHistory = useMemo(() => gameQuery.data?.gameHistory ?? [], [gameQuery.data?.gameHistory]);
  const moves = useMemo(() => isGameOver ? afterGameHistory : (gameHistory ?? []), [isGameOver, afterGameHistory, gameHistory]);
  
  // Initialize with a safe value that works on both server and client
  const [currentMoveIndex, setCurrentMoveIndex] = useState(() => {
    // Use 0 as default to ensure consistent server/client rendering
    return Math.max(0, moves.length - 1);
  });
  
  const updateMoveHistoryView = useCallback((index: number) => {
    try{
      if(index === -1 || (index === moves.length - 1 && !isGameOver)){
        setMoveHistoryFen('');
      }
      else{
        const _tempChessGame = new Chess();
        for(let i = 0; i <= index; i++){
          _tempChessGame.move(moves[i].move);
        }
        setMoveHistoryFen(_tempChessGame.fen());
      }
    }
    catch(e){
      console.log(e);
      setMoveHistoryFen('');
    }
  }, [isGameOver, moves, setMoveHistoryFen]);
  
  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;
    
    const newIndex = Math.max(0, moves.length - 1);
    setCurrentMoveIndex(newIndex);
    
    // Use setTimeout only on client
    const timeoutId = setTimeout(() => {
      if (moves.length > 0) {
        const lastItem = apiRef.current?.getItemByIndex?.(moves.length - 1);
        const secondToLastItem = apiRef.current?.getItemByIndex?.(moves.length - 2);
        const scrollTo = lastItem ?? secondToLastItem;
        apiRef.current?.scrollToItem?.(scrollTo);
      }
    }, 750);

    updateMoveHistoryView(-1);
    
    return () => clearTimeout(timeoutId);
  }, [moves, updateMoveHistoryView]);

  // Early return if no moves to prevent hydration mismatch
  if (!moves || moves.length === 0) {
    return (
      <div className='flex flex-row items-center text-white text-xs glass-effect border border-white/10 backdrop-blur-xl px-2 py-3 shadow-lg rounded-lg mb-4 w-full'>
        <div className='flex-1 text-center text-white/50 text-sm'>{"No moves yet"}</div>
      </div>
    );
  }

  return (
    <div className='flex flex-row items-center text-white text-xs glass-effect border border-white/10 backdrop-blur-xl px-2 py-3 shadow-lg rounded-lg mb-4 w-full'>
      
      {/* Left Navigation Controls */}
      <div className='flex flex-shrink-0 space-x-1 px-1'>
        <button 
          disabled={currentMoveIndex <= 0 || moves.length === 0}
          onClick={() => {
            apiRef.current?.scrollToItem(apiRef.current?.getItemByIndex(0));
            setCurrentMoveIndex(0);
            updateMoveHistoryView(0);
          }}
          className="p-2 rounded-lg glass-effect border border-white/10 hover:border-cyan-400/50 hover:bg-cyan-400/10 disabled:opacity-20 disabled:cursor-not-allowed transition-all"
          aria-label={"First move"}
        >
          <ChevronFirstIcon className='text-white/80' size={14} />
        </button>
        <button 
          disabled={currentMoveIndex <= 0 || moves.length === 0}
          onClick={() => {
            if(currentMoveIndex > 0){
              apiRef.current?.scrollToItem(apiRef.current?.getItemByIndex(currentMoveIndex - 1));
              setCurrentMoveIndex(currentMoveIndex - 1);
              updateMoveHistoryView(currentMoveIndex - 1);
            }
          }}
          className="p-2 rounded-lg glass-effect border border-white/10 hover:border-cyan-400/50 hover:bg-cyan-400/10 disabled:opacity-20 disabled:cursor-not-allowed transition-all"
          aria-label={"Previous move"}
        >
          <ChevronLeft className='text-white/80' size={14} />
        </button>
      </div>

      {/* Center Scroll Area - Now takes up all remaining space */}
      <div className="flex-1 min-w-0 overflow-hidden mask-fade-edges">
        <ScrollMenu 
          wrapperClassName="w-full scrollbar-hide" 
          apiRef={apiRef}
        >
          {moves.map((history, index) => (
            <div 
              onClick={() => {
                apiRef.current?.scrollToItem(apiRef.current?.getItemByIndex(index));
                setCurrentMoveIndex(index);
                updateMoveHistoryView(index);
              }} 
              key={`${history.move}-${index}`} 
              className={`cursor-pointer flex flex-col justify-center items-center p-2 min-w-[70px] mx-1 transition-all duration-200 rounded-md border ${
                index === currentMoveIndex 
                  ? 'border-cyan-400/50 bg-cyan-500/20 text-cyan-300' 
                  : 'border-white/5 hover:border-white/20 hover:bg-white/5'
              }`}
            >
              <div className='font-bold text-[11px]'>
                {history.sanMove ? getSanWithIcon(history.sanMove, index === currentMoveIndex) : history.lanMove}
              </div>
              <div className={'text-[9px] truncate max-w-[60px] opacity-60'}>
                {history.username || history.userId}
              </div>
            </div>
          ))}
        </ScrollMenu>
      </div>

      {/* Right Navigation Controls */}
      <div className='flex flex-shrink-0 space-x-1 px-1'>
        <button 
          disabled={currentMoveIndex >= moves.length - 1 || moves.length === 0}
          onClick={() => {
            if(currentMoveIndex < moves.length - 1){
              apiRef.current?.scrollToItem(apiRef.current?.getItemByIndex(currentMoveIndex + 1));
              setCurrentMoveIndex(currentMoveIndex + 1);
              updateMoveHistoryView(currentMoveIndex + 1);
            }
          }}
          className="p-2 rounded-lg glass-effect border border-white/10 hover:border-cyan-400/50 hover:bg-cyan-400/10 disabled:opacity-20 disabled:cursor-not-allowed transition-all"
          aria-label={"Next move"}
        >
          <ChevronRight className='text-white/80' size={14} />
        </button>
        <button 
          disabled={currentMoveIndex >= moves.length - 1 || moves.length === 0}
          onClick={() => {
            apiRef.current?.scrollToItem(apiRef.current?.getItemByIndex(moves.length - 1));
            setCurrentMoveIndex(moves.length - 1);
            updateMoveHistoryView(-1);
          }}
          className="p-2 rounded-lg glass-effect border border-white/10 hover:border-cyan-400/50 hover:bg-cyan-400/10 disabled:opacity-20 disabled:cursor-not-allowed transition-all"
          aria-label={"Last move"}
        >
          <ChevronLastIcon className='text-white/80' size={14} />
        </button>
      </div>
    </div>
  );
};

export default MoveHistory;