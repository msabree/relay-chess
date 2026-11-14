import Button from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { Dialog } from '@/components/ui/Dialog';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Text } from '@/components/ui/Text';
import { QUEUE_TIMER_OPTIONS, timerLabel } from '@/constants/Games';
import useInviteTeammates from '@/hooks/useInviteTeammates';
import useMatchmaking from '@/hooks/useMatchmaking';
import { useUser } from '@/hooks/useUser';
import { useTheme } from '@/theme/ThemeProvider';
import { alpha, radius } from '@/theme/tokens';
import * as Clipboard from 'expo-clipboard';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, Share, StyleSheet, View } from 'react-native';

/** Team lobby: share a code, friends join, the host queues the team. */
export default function InviteTeammates() {
  const { c } = useTheme();
  const { teamCode = '' } = useLocalSearchParams<{ teamCode?: string }>();
  const [selectedTimer, setSelectedTimer] = useState(QUEUE_TIMER_OPTIONS[0]!.time);
  const [copied, setCopied] = useState(false);
  const userId = useUser().data?._id ?? '';
  const { teammateLobby, roomId, startTeamMatchmaking, matchmakingStarted } = useInviteTeammates({
    selectedTimer,
    inviteCode: teamCode,
  });

  const hasTeammates = teammateLobby.some((t) => t.userId !== userId);
  const isHost = teammateLobby.length === 0 || !!teammateLobby.find((t) => t.userId === userId)?.isHost;
  const { newGameRoomId } = useMatchmaking({
    queueType: 'team',
    selectedTimer,
    enabled: hasTeammates && matchmakingStarted,
  });

  useEffect(() => {
    if (newGameRoomId) router.replace(`/games/${newGameRoomId}`);
  }, [newGameRoomId]);

  const copy = () => {
    Clipboard.setStringAsync(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <Dialog title="Your team">
      <Text variant="small" tone="muted" style={{ textAlign: 'center' }}>
        {isHost
          ? 'Send this code to your partner.'
          : 'The host starts the search.'}
      </Text>

      {isHost && (
        <View style={[styles.code, { backgroundColor: c.raised }]}>
          <Text variant="mono" style={{ fontSize: 22, letterSpacing: 2, fontWeight: '600' }} selectable>
            {roomId}
          </Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Pressable
              accessibilityRole="button"
              onPress={copy}
              style={[styles.codeBtn, { borderColor: c.line, backgroundColor: c.surface }]}
            >
              <IconSymbol name={copied ? 'checkmark' : 'doc.on.doc'} size={16} color={copied ? c.success : c.fgMuted} />
              <Text variant="small">{copied ? 'Copied' : 'Copy'}</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => Share.share({ message: `Join my Relay Chess team with code ${roomId}` })}
              style={[styles.codeBtn, { borderColor: c.line, backgroundColor: c.surface }]}
            >
              <IconSymbol name="paperplane.fill" size={16} color={c.fgMuted} />
              <Text variant="small">Share</Text>
            </Pressable>
          </View>
        </View>
      )}

      <View style={{ gap: 8 }}>
        {teammateLobby.map((t) => (
          <View key={t.userId} style={[styles.member, { borderColor: c.line }]}>
            <Avatar name={t.username} size={28} />
            <Text style={{ flex: 1, fontWeight: '500' }} numberOfLines={1}>
              {t.username}
              {t.userId === userId ? ' (you)' : ''}
            </Text>
            {t.isHost && (
              <Text variant="caption" tone="subtle">
                Host
              </Text>
            )}
          </View>
        ))}
        {!hasTeammates && (
          <View style={styles.waiting}>
            <ActivityIndicator color={c.fgMuted} />
            <Text variant="small" tone="muted">
              Waiting for a teammate...
            </Text>
          </View>
        )}
      </View>

      {isHost && !matchmakingStarted && (
        <>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {QUEUE_TIMER_OPTIONS.map((t) => {
              const on = t.time === selectedTimer;
              return (
                <Pressable
                  key={t.time}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: on }}
                  onPress={() => setSelectedTimer(t.time)}
                  style={[
                    styles.timer,
                    { borderColor: on ? c.accent : c.line, backgroundColor: on ? alpha(c.accent, 0.12) : c.bg },
                  ]}
                >
                  <Text variant="mono" style={{ fontWeight: '600' }}>
                    {timerLabel(t.time)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <Button size="lg" disabled={!hasTeammates} onPress={startTeamMatchmaking}>
            Find a game
          </Button>
        </>
      )}

      {matchmakingStarted && !newGameRoomId && (
        <View style={styles.waiting}>
          <ActivityIndicator color={c.accentInk} />
          <Text variant="small">Looking for another team...</Text>
        </View>
      )}

      <Button variant="secondary" onPress={() => router.back()}>
        Leave team
      </Button>
    </Dialog>
  );
}

const styles = StyleSheet.create({
  code: { alignItems: 'center', gap: 12, padding: 16, borderRadius: radius.md },
  codeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 36,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: radius.sm,
  },
  member: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, borderWidth: 1, borderRadius: radius.md },
  waiting: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 6 },
  timer: { flex: 1, height: 48, borderWidth: 1, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
});
