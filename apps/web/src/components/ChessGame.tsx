'use client';
import { useContext, useMemo, useRef, useState } from 'react';
import { Chessboard, ClearPremoves } from 'react-chessboard';
import type { Square } from 'chess.js';
import { BOARD_COLOR_SCHEMES, TEAM_COLOR_BLACK } from '@/constants';
import { ChessGameContext } from '@/contexts/ChessGame';

interface ChessGameProps {
  darkColor?: string;
  lightColor?: string;
}

/** Solid tints so the highlight reads the same on any board scheme. */
const tint = (square: string, strong = false) => {
  const light = (square.charCodeAt(0) - 97 + Number(square[1])) % 2 === 0;
  if (strong) return light ? '#F6D766' : '#E0B93A';
  return light ? '#EFE2A6' : '#C9B35E';
};
const CHECK = 'radial-gradient(circle, rgba(220, 38, 38, 0.85) 0%, rgba(220, 38, 38, 0.35) 55%, transparent 75%)';

/** The board. Moves go to the server; the server's snapshot is the truth. */
const ChessGame = ({ darkColor, lightColor }: ChessGameProps) => {
  const boardRef = useRef<ClearPremoves>(null);
  const [moveFrom, setMoveFrom] = useState<Square | ''>('');
  const { isGameOver, chessGame, moveHistoryFen, teamColor, isMyMove, isMyMoveNext, waitingOnTeamsToJoin, movePiece, game } =
    useContext(ChessGameContext);

  const reviewing = moveHistoryFen !== '';
  const canMove = !isGameOver && !reviewing && !waitingOnTeamsToJoin && isMyMove && teamColor === chessGame.turn();

  const highlights = useMemo(() => {
    const styles: Record<string, React.CSSProperties> = {};
    const last = game?.moves.at(-1);
    if (last && !reviewing) {
      styles[last.from] = { background: tint(last.from) };
      styles[last.to] = { background: tint(last.to) };
    }
    if (chessGame.isCheck() && !reviewing) {
      const turn = chessGame.turn();
      chessGame.board().forEach((row) =>
        row.forEach((sq) => {
          if (sq && sq.type === 'k' && sq.color === turn) styles[sq.square] = { ...styles[sq.square], backgroundImage: CHECK };
        }),
      );
    }
    if (moveFrom) {
      styles[moveFrom] = { background: tint(moveFrom, true) };
      for (const m of chessGame.moves({ square: moveFrom, verbose: true })) {
        styles[m.to] = {
          ...styles[m.to],
          backgroundImage: chessGame.get(m.to as Square)
            ? 'radial-gradient(circle, transparent 58%, rgba(0,0,0,0.22) 60%)'
            : 'radial-gradient(circle, rgba(0,0,0,0.22) 22%, transparent 24%)',
        };
      }
    }
    return styles;
  }, [game?.moves, chessGame, moveFrom, reviewing]);

  const tryMove = (from: Square, to: Square, promotion = 'q') => {
    const ok = movePiece({ from, to, promotion }) !== null;
    if (ok) setMoveFrom('');
    return ok;
  };

  const scheme = BOARD_COLOR_SCHEMES[0];
  return (
    <Chessboard
      ref={boardRef}
      id="relay-board"
      customDarkSquareStyle={{ backgroundColor: darkColor ?? scheme.dark }}
      customLightSquareStyle={{ backgroundColor: lightColor ?? scheme.light }}
      customBoardStyle={{ borderRadius: 6, overflow: 'hidden' }}
      arePremovesAllowed={!isGameOver}
      boardOrientation={teamColor === TEAM_COLOR_BLACK ? 'black' : 'white'}
      position={reviewing ? moveHistoryFen : chessGame.fen()}
      customSquareStyles={highlights}
      animationDuration={150}
      onSquareClick={(square: Square) => {
        boardRef.current?.clearPremoves();
        if (!canMove) return;
        const piece = chessGame.get(square);
        if (moveFrom && moveFrom !== square && tryMove(moveFrom, square)) return;
        setMoveFrom(piece && piece.color === teamColor ? square : '');
      }}
      isDraggablePiece={({ piece }) => !isGameOver && !reviewing && !waitingOnTeamsToJoin && piece[0] === teamColor}
      onPieceDrop={(from, to, piece) => {
        if (!canMove) return isMyMoveNext;
        // after the promotion dialog, piece is the chosen piece (e.g. "wN")
        const promo = piece?.[1]?.toLowerCase();
        return tryMove(from as Square, to as Square, promo && 'qrbn'.includes(promo) ? promo : 'q');
      }}
    />
  );
};

export default ChessGame;
