import { useBoardColors } from '@/lib/settings';
import { ChessGameContext } from '@/contexts/ChessGame';
import type { Square } from 'chess.js';
import { useContext, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import type { ViewStyle } from 'react-native';
import { Chessboard, defaultPieces } from 'react-native-chessboardjs';

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

/** The board. Same behavior as web: tap or drag, premoves, promotion picker. */
const ChessGame = ({ darkColor, lightColor }: ChessGameProps) => {
  const [moveFrom, setMoveFrom] = useState<Square | ''>('');
  const [promotion, setPromotion] = useState<Pending | null>(null);
  const [premove, setPremove] = useState<Pending | null>(null);
  const {
    isGameOver,
    chessGame,
    moveHistoryFen,
    teamColor,
    isMyMove,
    isMyMoveNext,
    waitingOnTeamsToJoin,
    movePiece,
  } = useContext(ChessGameContext);

  const fen = chessGame.fen();
  const reviewing = moveHistoryFen !== '';
  const canMove =
    !isGameOver && !reviewing && !waitingOnTeamsToJoin && isMyMove && teamColor === chessGame.turn();
  const canQueue = !isGameOver && !reviewing && !waitingOnTeamsToJoin && isMyMoveNext;

  const targets = useMemo(
    () => (moveFrom ? new Set(chessGame.moves({ square: moveFrom, verbose: true }).map((m) => m.to)) : new Set<string>()),
    // fen covers chessGame changing
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [moveFrom, fen]
  );

  const checkSquare = useMemo(() => {
    if (reviewing || !chessGame.isCheck()) return null;
    const turn = chessGame.turn();
    for (const row of chessGame.board()) {
      for (const sq of row) if (sq && sq.type === 'k' && sq.color === turn) return sq.square;
    }
    return null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fen, reviewing]);

  const highlights = useMemo(() => {
    const styles: Record<string, ViewStyle> = {};
    const last = chessGame.history({ verbose: true }).at(-1);
    if (last && !reviewing) {
      styles[last.from] = { backgroundColor: tint(last.from) };
      styles[last.to] = { backgroundColor: tint(last.to) };
    }
    if (premove) {
      styles[premove.from] = { backgroundColor: PREMOVE };
      styles[premove.to] = { backgroundColor: PREMOVE };
    }
    if (moveFrom) styles[moveFrom] = { backgroundColor: tint(moveFrom, true) };
    return styles;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fen, moveFrom, premove, reviewing]);

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
    // reacting to the server handing us the turn, not deriving state
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPremove(null);
    movePiece({ from: premove.from, to: premove.to, promotion: 'q' });
  }, [canMove, premove, movePiece]);

  // A stale promotion picker shouldn't outlive the turn.
  const activePromotion = canMove ? promotion : null;

  const scheme = useBoardColors();
  return (
    <View>
      <Chessboard
        options={{
          id: 'relay-board',
          darkSquareStyle: { backgroundColor: darkColor ?? scheme.dark },
          lightSquareStyle: { backgroundColor: lightColor ?? scheme.light },
          boardStyle: { borderRadius: 6, overflow: 'hidden' },
          boardOrientation: teamColor === 'b' ? 'black' : 'white',
          position: reviewing ? moveHistoryFen : fen,
          squareStyles: highlights,
          animationDurationInMs: 150,
          allowDrawingArrows: false,
          squareRenderer: ({ square, piece, children }) => (
            <>
              {square === checkSquare && <View pointerEvents="none" style={styles.check} />}
              {children}
              {targets.has(square) && (
                <View pointerEvents="none" style={piece ? styles.captureRing : styles.moveDot} />
              )}
            </>
          ),
          onSquareClick: ({ square }) => {
            const sq = square as Square;
            setPremove(null);
            if (!canMove) return;
            if (moveFrom && moveFrom !== sq && targets.has(sq)) {
              tryMove(moveFrom, sq);
              return;
            }
            const piece = chessGame.get(sq);
            setMoveFrom(piece && piece.color === teamColor && sq !== moveFrom ? sq : '');
          },
          canDragPiece: ({ piece }) => (canMove || canQueue) && piece.pieceType[0] === teamColor,
          onPieceDrag: () => setMoveFrom(''),
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
      {activePromotion && (
        <Pressable style={styles.promoBackdrop} onPress={() => setPromotion(null)}>
          <View style={styles.promoDialog} accessibilityRole="menu" accessibilityLabel="Promote pawn">
            {PROMOTIONS.map((p) => {
              const render = defaultPieces[`${teamColor ?? 'w'}${p.toUpperCase()}`];
              return (
                <Pressable
                  key={p}
                  accessibilityRole="button"
                  accessibilityLabel={`Promote to ${{ q: 'queen', r: 'rook', b: 'bishop', n: 'knight' }[p]}`}
                  style={styles.promoOption}
                  onPress={() => {
                    const { from, to } = activePromotion;
                    setPromotion(null);
                    tryMove(from, to, p);
                  }}
                >
                  {render?.({ size: 56 })}
                </Pressable>
              );
            })}
          </View>
        </Pressable>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  check: {
    position: 'absolute',
    width: '90%',
    height: '90%',
    borderRadius: 999,
    backgroundColor: 'rgba(220, 38, 38, 0.6)',
  },
  moveDot: {
    position: 'absolute',
    width: '30%',
    height: '30%',
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.22)',
  },
  captureRing: {
    position: 'absolute',
    width: '92%',
    height: '92%',
    borderRadius: 999,
    borderWidth: 4,
    borderColor: 'rgba(0,0,0,0.22)',
  },
  promoBackdrop: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  promoDialog: {
    flexDirection: 'row',
    gap: 4,
    padding: 8,
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  promoOption: { width: 64, height: 64, alignItems: 'center', justifyContent: 'center', borderRadius: 8 },
});

export default ChessGame;
