'use client';
import { useContext, useEffect, useState, useRef } from 'react';
import { Chessboard, ClearPremoves } from 'react-chessboard';
import { BOARD_COLOR_SCHEMES, TEAM_COLOR_BLACK, TEAM_COLOR_WHITE } from '@/constants';
import { ChessGameContext } from '@/contexts/ChessGame';
import GameControlPanel from '@/modals/GameControlPanel';
import { Square } from 'chess.js';
import { AppContext } from '@/contexts/App';
import Matchmaking from '@/modals/Matchmaking';
import SwitchSides from '@/modals/SwitchSides';

interface ChessGameProps {
  darkColor: string | undefined;
  lightColor: string | undefined;
}

// Chess Game driven by Websocket
const ChessGame = ({darkColor, lightColor}: ChessGameProps) => {
  const chessboardRef = useRef<ClearPremoves>(null);
  const [moveFrom, setMoveFrom] = useState('');
  const [optionSquares, setOptionSquares] = useState({});
  const [isInitialized, setIsInitialized] = useState(false);
  const {
    isGameOver,
    chessGame,
    moveHistoryFen, 
    teamColor,
    isMyMove,
    isMyMoveNext,
    waitingOnTeamsToJoin,
    movePiece,
    selectedTimer
  } = useContext(ChessGameContext);
  const { setModal, modal } = useContext(AppContext);


  // DISABLE GAME PLAY IN THIS MODE!!!
  const viewingMoveHistory = moveHistoryFen !== '';

  const resetFirstMove = (square: Square) => {
    const hasOptions = getMoveOptions(square);
    if (hasOptions) {
      setMoveFrom(square);
    };
  };

  const getMoveOptions = (square: Square) => {
    const moves = chessGame.moves({
      square,
      verbose: true,
    });
    if (moves.length === 0) {
      return false;
    }

    const newSquares = {} as any;

    moves.map((move) => {
      newSquares[move.to] = {
        background:
        chessGame.get(move.to) && chessGame.get(move.to)?.color !== chessGame.get(square)?.color
          ? 'radial-gradient(circle, rgba(0,0,0,.1) 85%, transparent 85%)'
          : 'radial-gradient(circle, rgba(0,0,0,.1) 25%, transparent 25%)',
        borderRadius: '50%',
      };
      return move;
    });
    newSquares[square] = {
      background: 'rgba(255, 255, 0, 0.4)',
    };
    setOptionSquares(newSquares);
    return true;
  };

  // Handles check. 
  // Updates background color of king to a highlighted red and shows notification.
  const [wasInCheck, setWasInCheck] = useState(false);
  useEffect(() => {
    const whiteKing = document?.querySelector('[data-piece="wK"]');
    const blackKing = document?.querySelector('[data-piece="bK"]');
    const isInCheck = chessGame.isCheck();
    const currentTurn = chessGame.turn();

    if(document !== undefined && whiteKing && blackKing && isInCheck){
      // Highlight the king in check
      if(currentTurn === TEAM_COLOR_WHITE){
        (whiteKing as HTMLElement).style.backgroundColor = '#ff0000a1';
        (whiteKing as HTMLElement).style.boxShadow = '0 0 10px rgba(255, 0, 0, 0.8)';
      }
      else if(currentTurn === TEAM_COLOR_BLACK){
        (blackKing as HTMLElement).style.backgroundColor = '#ff0000a1';
        (blackKing as HTMLElement).style.boxShadow = '0 0 10px rgba(255, 0, 0, 0.8)';
      }
      
      // Show notification when check first occurs
      if (!wasInCheck && (currentTurn === teamColor || teamColor === undefined)) {
        // Check notification will be handled by GameConsole if needed
      }
      setWasInCheck(true);
    } 
    else if(document !== undefined && whiteKing && blackKing && !isInCheck){
      if(whiteKing && blackKing){
        (blackKing as HTMLElement).style.backgroundColor = '';
        (blackKing as HTMLElement).style.boxShadow = '';
        (whiteKing as HTMLElement).style.backgroundColor = '';
        (whiteKing as HTMLElement).style.boxShadow = '';
      }
      setWasInCheck(false);
    }
  }, [chessGame, wasInCheck, teamColor]);

  // Initialize game state
  useEffect(() => {
    if (!isInitialized && chessGame) {
      setIsInitialized(true);
    }
  }, [chessGame, isInitialized]);

  // Handle modals - removed game over modal trigger

  return (
    <>
      <Chessboard
        ref={chessboardRef}
        customDarkSquareStyle={
          { backgroundColor: darkColor ?? BOARD_COLOR_SCHEMES[0].dark }
        }
        customLightSquareStyle={
          { backgroundColor: lightColor ?? BOARD_COLOR_SCHEMES[0].light }
        }
        customBoardStyle={
          {border: '1px solid #272D4D'}
        }
        arePremovesAllowed={true}
        boardOrientation={teamColor === TEAM_COLOR_BLACK ? 'black' : 'white'}
        position={viewingMoveHistory ? moveHistoryFen : chessGame?.fen()}
        customSquareStyles={{
          ...optionSquares,
        }}
        onSquareClick={(square: Square) => {
          chessboardRef.current?.clearPremoves();
          if(isGameOver || viewingMoveHistory || waitingOnTeamsToJoin){
            return false;
          }
          else if(isMyMove && teamColor === chessGame.turn()){

            // from square
            if (!moveFrom) {
              resetFirstMove(square);
              return;
            }

            // Show visual feedback that move is being processed
            const move = movePiece({
              from: moveFrom,
              to: square,
              promotion: 'q', // always promote to a queen for example simplicity
            });

            const isValidMove = move !== null;

            if (!isValidMove) {
              resetFirstMove(square);
            }
            else{
              setMoveFrom('');
              setOptionSquares({});
              // Move is being processed - the board will update via websocket
            }

            return isValidMove;
          }

          return isMyMoveNext;
        }}
        isDraggablePiece={({piece}) => {
          const pieceColor = piece[0];
          if(isGameOver || viewingMoveHistory || waitingOnTeamsToJoin || teamColor !== pieceColor){
            return false;
          }

          return true;
        }}
        onPieceDrop={(sourceSquare, targetSquare) => {
          if(isGameOver || viewingMoveHistory || waitingOnTeamsToJoin){
            return false;
          }
          else if(isMyMove && teamColor === chessGame.turn()){
            const move = movePiece({
              from: sourceSquare,
              to: targetSquare,
              promotion: 'q', // always promote to a queen for example simplicity
            });

            const isValidMove = move !== null;

            if (isValidMove) {
              setMoveFrom('');
              setOptionSquares({});
              // Move is being processed - the board will update via websocket
            }

            return isValidMove;
          }
          return isMyMoveNext;
        } } />
      <GameControlPanel open={modal.name === 'GAME_CONTROL_PANEL'} onClose={() => {
        setModal({name: ''});
      }} />
      <Matchmaking
        open={modal.name === 'START_NEW_GAME'} 
        onClose={() => {
          setModal({name: ''});
        }}
        selectedTimer={selectedTimer}
        isNewGame={true}
      />
      <SwitchSides open={modal.name === 'SWITCH_SIDES'} onClose={() => {
        setModal({name: ''});
      }} />
    </>
  );
};

export default ChessGame;
