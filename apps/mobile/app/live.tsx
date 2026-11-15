import { teamNames } from '@/components/home/LiveGamesStrip';
import { MiniBoard } from '@/components/MiniBoard';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/ui/Card';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Text } from '@/components/ui/Text';
import { timerLabel } from '@/constants/Games';
import { useLiveGames } from '@/hooks/useLiveGames';
import { fromServerTimer } from '@/lib/socket';
import { useTheme } from '@/theme/ThemeProvider';
import { radius } from '@/theme/tokens';
import { router } from 'expo-router';
import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

const clock = (ms: number) => {
  const s = Math.max(0, Math.round(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

/** Every public game in progress. Updates on its own. */
export default function LiveGames() {
  const { c } = useTheme();
  const { liveGames, connected } = useLiveGames();

  return (
    <Screen>
      <View style={{ gap: 4 }}>
        <Text variant="title">Live games</Text>
      </View>

      {!connected ? (
        <ActivityIndicator color={c.fgMuted} style={{ marginTop: 24 }} />
      ) : liveGames.length === 0 ? (
        <Card style={{ alignItems: 'center', paddingVertical: 32 }}>
          <Text tone="muted" style={{ textAlign: 'center' }}>
            No public games right now. Start one and it shows up here.
          </Text>
        </Card>
      ) : (
        liveGames.map((g) => (
          <Pressable
            key={g.roomId}
            accessibilityRole="link"
            accessibilityLabel={`Watch ${teamNames(g.white)} versus ${teamNames(g.black)}`}
            onPress={() => router.push(`/games/${g.roomId}`)}
            style={({ pressed }) => [
              styles.row,
              { borderColor: c.line, backgroundColor: pressed ? c.raised : c.surface },
            ]}
          >
            <MiniBoard id={g.roomId} fen={g.fen} size={88} />
            <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
              <Side name={teamNames(g.white)} color="w" toMove={g.turn === 'w'} ms={g.clocks?.w} />
              <Side name={teamNames(g.black)} color="b" toMove={g.turn === 'b'} ms={g.clocks?.b} />
              <View style={styles.meta}>
                <Text variant="caption" tone="subtle">
                  {g.moveCount} moves · {timerLabel(fromServerTimer(g.timeControl))}
                </Text>
                {g.spectators > 0 && (
                  <View style={styles.meta}>
                    <IconSymbol name="eye" size={13} color={c.fgSubtle} />
                    <Text variant="caption" tone="subtle">
                      {g.spectators}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </Pressable>
        ))
      )}
    </Screen>
  );
}

function Side({ name, color, toMove, ms }: { name: string; color: 'w' | 'b'; toMove: boolean; ms?: number }) {
  const { c } = useTheme();
  return (
    <View style={styles.side}>
      <View
        style={[
          styles.swatch,
          { backgroundColor: color === 'w' ? '#FFFFFF' : '#141414', borderColor: c.line },
        ]}
      />
      <Text variant="small" numberOfLines={1} style={{ flex: 1, fontWeight: toMove ? '600' : '400' }}>
        {name}
      </Text>
      {ms !== undefined && (
        <Text variant="caption" tone={toMove ? 'default' : 'subtle'} style={{ fontVariant: ['tabular-nums'] }}>
          {clock(ms)}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 10, borderWidth: 1, borderRadius: radius.lg },
  side: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  swatch: { width: 10, height: 10, borderRadius: 2, borderWidth: 1 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
});
