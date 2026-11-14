import { MiniBoard } from '@/components/MiniBoard';
import { Text } from '@/components/ui/Text';
import { timerLabel } from '@/constants/Games';
import { useTopLiveGames } from '@/hooks/useLiveGames';
import { fromServerTimer } from '@/lib/socket';
import { useTheme } from '@/theme/ThemeProvider';
import { radius } from '@/theme/tokens';
import { router } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

export const teamNames = (names: string[]) => (names.length ? names.join(' & ') : 'Anonymous');

/** Home: one slim row of live games. Hidden when nothing is live. */
export function LiveGamesStrip() {
  const { c } = useTheme();
  const { liveGames } = useTopLiveGames();
  if (liveGames.length === 0) return null;

  return (
    <View style={{ gap: 10 }}>
      <View style={styles.title}>
        <View style={[styles.dot, { backgroundColor: c.success }]} />
        <Text variant="small" style={{ fontWeight: '600' }}>
          Live now
        </Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
        {liveGames.map((g) => (
          <Pressable
            key={g.roomId}
            accessibilityRole="link"
            accessibilityLabel={`Watch ${teamNames(g.white)} versus ${teamNames(g.black)}`}
            onPress={() => router.push(`/games/${g.roomId}`)}
            style={({ pressed }) => [
              styles.card,
              { borderColor: c.line, backgroundColor: pressed ? c.raised : c.surface },
            ]}
          >
            <MiniBoard id={g.roomId} fen={g.fen} />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text variant="small" numberOfLines={1} style={{ fontWeight: '500' }}>
                {teamNames(g.white)}
              </Text>
              <Text variant="small" numberOfLines={1} style={{ fontWeight: '500' }}>
                vs {teamNames(g.black)}
              </Text>
              <Text variant="caption" tone="subtle" style={{ marginTop: 2 }}>
                {g.moveCount} moves · {timerLabel(fromServerTimer(g.timeControl))}
              </Text>
            </View>
          </Pressable>
        ))}
      </ScrollView>
      <Pressable
        accessibilityRole="link"
        onPress={() => router.push('/live')}
        style={({ pressed }) => [styles.more, { borderColor: c.line }, pressed && { backgroundColor: c.raised }]}
      >
        <Text variant="small" style={{ fontWeight: '500' }}>
          Watch live games
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  title: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  card: {
    width: 260,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 8,
    borderWidth: 1,
    borderRadius: radius.lg,
  },
  more: {
    alignSelf: 'flex-start',
    height: 36,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderRadius: radius.sm,
    justifyContent: 'center',
  },
});
