'use client';
import { useContext, useEffect, useMemo, useState } from 'react';
import { Chessboard, defaultPieces } from 'react-chessboard';
import type { Square } from 'chess.js';
import { BOARD_COLOR_SCHEMES, TEAM_COLOR_BLACK } from '@/constants';
import { ChessGameContext } from '@/contexts/ChessGame';

interface ChessGameProps {
  darkColor?: string;
  lightColor?: string;
}

type Pending = { from: Square; to: Square };
const PROMOTIONS = ['q', 'r', 'b', 'n'] as const;

/** Solid tints so the highlight reads the same on any board scheme. */
const tint = (square: string, strong = false) => {
  const light = (square.charCodeAt(0) - 97 + Number(square[1])) % 2 === 0;
  if (strong) return light ? '#F6D766' : '#E0B93A';
  return light ? '#EFE2A6' : '#C9B35E';
};
const PREMOVE = 'rgba(220, 38, 38, 0.45)';
const CHECK = 'radial-gradient(circle, rgba(220, 38, 38, 0.85) 0%, rgba(220, 38, 38, 0.35) 55%, transparent 75%)';

/** The board. Moves go to the server; the server's snapshot is the truth. */
const ChessGame = ({ darkColor, lightColor }: ChessGameProps) => {
  const [moveFrom, setMoveFrom] = useState<Square | ''>('');
  const [promotion, setPromotion] = useState<Pending | null>(null);
  const [premove, setPremove] = useState<Pending | null>(null);
  const { isGameOver, chessGame, moveHistoryFen, teamColor, isMyMove, isMyMoveNext, waitingOnTeamsToJoin, movePiece, game } =
    useContext(ChessGameContext);

  const reviewing = moveHistoryFen !== '';
  const canMove = !isGameOver && !reviewing && !waitingOnTeamsToJoin && isMyMove && teamColor === chessGame.turn();
  const canQueue = !isGameOver && !reviewing && !waitingOnTeamsToJoin && isMyMoveNext;

  const highlights = useMemo(() => {
    const styles: Record<string, React.CSSProperties> = {};
    const last = game?.moves.at(-1);
    if (last && !reviewing) {
      styles[last.from] = { backgroundColor: tint(last.from) };
      styles[last.to] = { backgroundColor: tint(last.to) };
    }
    if (chessGame.isCheck() && !reviewing) {
      const turn = chessGame.turn();
      chessGame.board().forEach((row) =>
        row.forEach((sq) => {
          if (sq && sq.type === 'k' && sq.color === turn) styles[sq.square] = { ...styles[sq.square], backgroundImage: CHECK };
        }),
      );
    }
    if (premove) {
      styles[premove.from] = { backgroundColor: PREMOVE };
      styles[premove.to] = { backgroundColor: PREMOVE };
    }
    if (moveFrom) {
      styles[moveFrom] = { backgroundColor: tint(moveFrom, true) };
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
  }, [game?.moves, chessGame, moveFrom, premove, reviewing]);

  const isPromotion = (from: Square, to: Square) =>
    chessGame.moves({ square: from, verbose: true }).some((m) => m.to === to && !!m.promotion);

  const tryMove = (from: Square, to: Square, promo?: string) => {
    if (!promo && isPromotion(from, to)) {
      setPromotion({ from, to });
      setMoveFrom('');
      return false;
    }
    const ok = movePiece({ from, to, promotion: promo ?? 'q' }) !== null;
    if (ok) setMoveFrom('');
    return ok;
  };

  // Play the queued premove as soon as it's our turn. Illegal by then? Drop it.
  useEffect(() => {
    if (!canMove || !premove) return;
    setPremove(null);
    movePiece({ from: premove.from, to: premove.to, promotion: 'q' });
  }, [canMove, premove, movePiece]);

  // A stale promotion picker shouldn't outlive the turn.
  useEffect(() => {
    if (!canMove) setPromotion(null);
  }, [canMove]);

  const scheme = BOARD_COLOR_SCHEMES[0];
  const orientation = teamColor === TEAM_COLOR_BLACK ? 'black' : 'white';
  return (
    <div className="relative">
      <Chessboard
        options={{
          id: 'relay-board',
          darkSquareStyle: { backgroundColor: darkColor ?? scheme.dark },
          lightSquareStyle: { backgroundColor: lightColor ?? scheme.light },
          boardStyle: { borderRadius: 6, overflow: 'hidden' },
          boardOrientation: orientation,
          position: reviewing ? moveHistoryFen : chessGame.fen(),
          squareStyles: highlights,
          animationDurationInMs: 150,
          allowDrawingArrows: false,
          onSquareClick: ({ square }) => {
            const sq = square as Square;
            setPremove(null);
            if (!canMove) return;
            const piece = chessGame.get(sq);
            if (moveFrom && moveFrom !== sq && chessGame.moves({ square: moveFrom, verbose: true }).some((m) => m.to === sq)) {
              tryMove(moveFrom, sq);
              return;
            }
            setMoveFrom(piece && piece.color === teamColor ? sq : '');
          },
          canDragPiece: ({ piece }) => (canMove || canQueue) && piece.pieceType[0] === teamColor,
          onPieceDrop: ({ sourceSquare, targetSquare }) => {
            if (!targetSquare || sourceSquare === targetSquare) return false;
            const from = sourceSquare as Square;
            const to = targetSquare as Square;
            if (canMove) return tryMove(from, to);
            if (canQueue) setPremove({ from, to });
            return false;
          },
        }}
      />
      {promotion && (
        <div
          className="absolute inset-0 flex items-center justify-center rounded-md bg-black/40"
          onClick={() => setPromotion(null)}
        >
          <div role="dialog" aria-label="Promote pawn" className="flex gap-1 rounded-xl bg-surface p-2 shadow-lg" onClick={(e) => e.stopPropagation()}>
            {PROMOTIONS.map((p) => {
              const key = `${teamColor ?? 'w'}${p.toUpperCase()}`;
              const Piece = defaultPieces[key];
              return (
                <button
                  key={p}
                  type="button"
                  aria-label={`Promote to ${{ q: 'queen', r: 'rook', b: 'bishop', n: 'knight' }[p]}`}
                  className="h-16 w-16 rounded-lg p-1 hover:bg-raised"
                  onClick={() => {
                    const { from, to } = promotion;
                    setPromotion(null);
                    tryMove(from, to, p);
                  }}
                >
                  {Piece?.()}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChessGame;
