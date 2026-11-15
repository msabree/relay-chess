import { Text } from '@/components/ui/Text';
import { ChessGameContext } from '@/contexts/ChessGame';
import { useTheme } from '@/theme/ThemeProvider';
import React, { useContext, useEffect, useRef } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { initials } from './util';

/** Moves in pairs. Each move carries the initial of the teammate who played it. Tap one to look at it. */
export default function MoveList({ horizontal = false }: { horizontal?: boolean }) {
  const { c } = useTheme();
  const { game, moveHistoryFen, setMoveHistoryFen, isGameOver } = useContext(ChessGameContext);
  const scroll = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const moves = game?.moves ?? [];
  const names = new Map([...(game?.teams.w ?? []), ...(game?.teams.b ?? [])].map((p) => [p.id, p.name]));
  const lastFen = moves.at(-1)?.fen;

  // Keep the latest move in view.
  useEffect(() => {
    scroll.current?.scrollToEnd({ animated: true });
  }, [moves.length]);

  const view = (fen: string) => setMoveHistoryFen(fen === lastFen ? '' : fen);
  const isViewing = (fen: string) => (moveHistoryFen ? moveHistoryFen === fen : fen === lastFen);

  if (moves.length === 0) {
    return (
      <Text variant="small" tone="subtle" style={{ paddingHorizontal: 14, paddingVertical: 10 }}>
        {isGameOver ? 'No moves were played.' : 'No moves yet.'}
      </Text>
    );
  }

  const cell = (i: number) => {
    const m = moves[i];
    if (!m) return <View style={{ flex: 1 }} />;
    const on = isViewing(m.fen);
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${m.san} by ${names.get(m.playerId) ?? 'unknown'}`}
        accessibilityState={{ selected: on }}
        onPress={() => view(m.fen)}
        style={[styles.cell, !horizontal && { flex: 1 }, on && { backgroundColor: c.raised }]}
      >
        <Text variant="small" style={{ fontWeight: on ? '700' : '500' }}>
          {m.san}
        </Text>
        <Text style={{ fontSize: 11, color: c.fgSubtle }}>{initials(names.get(m.playerId) ?? '?')}</Text>
      </Pressable>
    );
  };

  if (horizontal) {
    return (
      <ScrollView
        ref={scroll}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ alignItems: 'center', gap: 2, paddingHorizontal: 4 }}
        accessibilityLabel="Moves"
      >
        {moves.map((m, i) => (
          <View key={i} style={styles.hItem}>
            {i % 2 === 0 && (
              <Text variant="caption" tone="subtle" style={{ fontVariant: ['tabular-nums'] }}>
                {i / 2 + 1}.
              </Text>
            )}
            {cell(i)}
          </View>
        ))}
      </ScrollView>
    );
  }

  const rows = Math.ceil(moves.length / 2);
  return (
    <ScrollView ref={scroll} style={{ maxHeight: 320 }} contentContainerStyle={{ padding: 6 }} nestedScrollEnabled>
      {Array.from({ length: rows }, (_, r) => (
        <View key={r} style={styles.row}>
          <Text variant="caption" tone="subtle" style={styles.num}>
            {r + 1}.
          </Text>
          {cell(r * 2)}
          {cell(r * 2 + 1)}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  cell: { height: 32, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 8, borderRadius: 6 },
  hItem: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  row: { flexDirection: 'row', alignItems: 'center' },
  num: { width: 32, paddingLeft: 6, fontVariant: ['tabular-nums'] },
});
