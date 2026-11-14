import { Text } from '@/components/ui/Text';
import { QUEUE_TIMER_OPTIONS, timerLabel } from '@/constants/Games';
import useOnlineStats from '@/hooks/useOnlineStats';
import { useTheme } from '@/theme/ThemeProvider';
import { radius } from '@/theme/tokens';
import { router } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

/** Public queue: two buttons, live waiting counts. */
export function QuickMatch() {
  const { c } = useTheme();
  const { getQueueCount } = useOnlineStats();

  return (
    <View style={{ gap: 8 }}>
      <Text variant="small" tone="muted" style={{ fontWeight: '600' }}>
        Quick match
      </Text>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {QUEUE_TIMER_OPTIONS.map((t) => {
          const waiting = getQueueCount(t.time);
          return (
            <Pressable
              key={t.time}
              accessibilityRole="button"
              accessibilityLabel={`Quick match, ${timerLabel(t.time)}${waiting ? `, ${waiting} waiting` : ''}`}
              onPress={() => router.push({ pathname: '/modals/matchmaking', params: { selectedTimer: t.time } })}
              style={({ pressed }) => [
                styles.queue,
                { borderColor: c.line, backgroundColor: pressed ? c.raised : c.surface },
              ]}
            >
              <Text variant="mono" style={{ fontWeight: '600', fontSize: 17 }}>
                {timerLabel(t.time)}
              </Text>
              <Text variant="caption" tone={waiting ? 'accent' : 'subtle'}>
                {waiting ? `${waiting} waiting` : t.type}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  queue: {
    flex: 1,
    height: 72,
    borderWidth: 1,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
});
