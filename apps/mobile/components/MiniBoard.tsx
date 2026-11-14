import { useBoardColors } from '@/lib/settings';
import React from 'react';
import { View } from 'react-native';
import { Chessboard } from 'react-native-chessboardjs';

/** Small read-only board for game lists. Touches pass through to the row. */
export function MiniBoard({ id, fen, size = 64 }: { id: string; fen: string; size?: number }) {
  const scheme = useBoardColors();
  return (
    <View pointerEvents="none" style={{ width: size, height: size }}>
      <Chessboard
        options={{
          id: `mini-${id}`,
          position: fen,
          boardWidth: size,
          allowDragging: false,
          allowDrawingArrows: false,
          showNotation: false,
          animationDurationInMs: 200,
          darkSquareStyle: { backgroundColor: scheme.dark },
          lightSquareStyle: { backgroundColor: scheme.light },
          boardStyle: { borderRadius: 4, overflow: 'hidden' },
        }}
      />
    </View>
  );
}
