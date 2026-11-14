import Button from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Text } from '@/components/ui/Text';
import { timerLabel } from '@/constants/Games';
import useMatchmaking from '@/hooks/useMatchmaking';
import useOnlineStats from '@/hooks/useOnlineStats';
import { useTheme } from '@/theme/ThemeProvider';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

/** How long to wait for a full 2v2 before offering a 1v1. */
const OFFER_1V1_AFTER_MS = 20_000;

/** Public queue, same flow as web: 2v2 first, a 1v1 offer if it's quiet. */
export default function Matchmaking() {
  const { c } = useTheme();
  const { selectedTimer = '0,0' } = useLocalSearchParams<{ selectedTimer: string }>();
  const { newGameRoomId, ready, startNow } = useMatchmaking({ queueType: 'solo', selectedTimer, enabled: true });
  const { getQueueCount, getReadyCount } = useOnlineStats();
  const [waitedLong, setWaitedLong] = useState(false);

  const waiting = getQueueCount(selectedTimer);
  const othersReady = getReadyCount(selectedTimer) - (ready ? 1 : 0);
  const offer1v1 = !newGameRoomId && !ready && (waitedLong || othersReady > 0);

  useEffect(() => {
    const t = setTimeout(() => setWaitedLong(true), OFFER_1V1_AFTER_MS);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!newGameRoomId) return;
    const t = setTimeout(() => router.replace(`/games/${newGameRoomId}`), 1500);
    return () => clearTimeout(t);
  }, [newGameRoomId]);

  return (
    <Dialog title="Quick match">
      <View style={{ alignItems: 'center', gap: 6 }}>
        <ActivityIndicator size="large" color={c.accentInk} />
        <Text variant="heading" style={{ marginTop: 8 }}>
          {newGameRoomId ? 'Match found!' : ready ? 'Finding a 1v1...' : 'Finding a 2v2...'}
        </Text>
        <Text variant="small" tone="muted">
          {timerLabel(selectedTimer)}
        </Text>
        {waiting > 0 && !newGameRoomId && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <IconSymbol name="person.2.fill" size={14} color={c.accentInk} />
            <Text variant="small" tone="accent">
              {waiting === 1 ? 'Just you so far' : `${waiting} waiting`}
            </Text>
          </View>
        )}
      </View>

      {newGameRoomId ? (
        <Text variant="small" tone="muted" style={{ textAlign: 'center' }}>
          Taking you to the game...
        </Text>
      ) : (
        <>
          {offer1v1 && (
            <View style={{ gap: 8 }}>
              <Button onPress={startNow}>
                {othersReady > 0 ? `Play 1v1 now (${othersReady} ready)` : 'Play 1v1 instead'}
              </Button>
              <Text variant="caption" tone="subtle" style={{ textAlign: 'center' }}>
                A full 2v2 still wins if four show up.
              </Text>
            </View>
          )}
          {ready && (
            <Text variant="small" tone="muted" style={{ textAlign: 'center' }}>
              1v1 starts when one more player joins.
            </Text>
          )}
          <Button variant="secondary" onPress={() => router.back()}>
            Cancel
          </Button>
        </>
      )}
    </Dialog>
  );
}
