import { CodeJoin } from '@/components/home/CodeJoin';
import { LiveGamesStrip } from '@/components/home/LiveGamesStrip';
import { QuickMatch } from '@/components/home/QuickMatch';
import { Screen } from '@/components/Screen';
import Button from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { useGamesPlayed } from '@/hooks/useGamesPlayed';
import useOnlineStats from '@/hooks/useOnlineStats';
import { usePrivateRoom } from '@/hooks/usePrivateRoom';
import React from 'react';

/** The launcher: play with friends, quick match, join a code. */
export default function HomeScreen() {
  const { totalOnline } = useOnlineStats();
  const played = useGamesPlayed().data;
  const room = usePrivateRoom();

  const stats = [
    totalOnline > 0 && `${totalOnline} online`,
    played && `${played.toLocaleString('en-US')} games played`,
  ].filter(Boolean);

  return (
    <Screen contentStyle={{ padding: 16, paddingTop: 20, gap: 24 }}>
      <Button size="lg" loading={room.creating} onPress={() => room.create()} style={{ height: 60 }}>
        Play with friends
      </Button>
      <QuickMatch />
      <CodeJoin />
      <LiveGamesStrip />
      {stats.length > 0 && (
        <Text variant="caption" tone="subtle" style={{ textAlign: 'center' }}>
          {stats.join(' · ')}
        </Text>
      )}
    </Screen>
  );
}
