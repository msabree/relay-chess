import ChessGame from '@/components/ChessGame';
import Button from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { ChessGameContext } from '@/contexts/ChessGame';
import { useTheme } from '@/theme/ThemeProvider';
import { alpha, radius } from '@/theme/tokens';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import React, { useContext, useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Crowd, { MuteSpectators } from './Crowd';
import DeployBanner from './DeployBanner';
import GameActions from './GameActions';
import MoveList from './MoveList';
import RoomChat from './RoomChat';
import RoomSetup from './RoomSetup';
import TeamBar from './TeamBar';
import { colorName } from './util';

type Tab = 'setup' | 'moves' | 'chat';

/**
 * The game screen, laid out like web on mobile: team bar, board, team bar,
 * moves, actions, then tabs (room setup or moves, and chat).
 */
export default function GameScreen() {
  const { c } = useTheme();
  const { game, room, teamColor, isMyMove, moveHistoryFen, setMoveHistoryFen, roomError, drawOfferedBy } =
    useContext(ChessGameContext);
  const setup = !!room?.isPrivate && game?.status === 'waiting';
  const tabs: Tab[] = setup ? ['setup', 'chat'] : ['moves', 'chat'];
  const [picked, setPicked] = useState<Tab | null>(null);
  const tab = picked && tabs.includes(picked) ? picked : tabs[0]!;

  // Unread chat badge: messages that arrived while chat wasn't open.
  const chatCount = room?.chat.length ?? 0;
  const [seen, setSeen] = useState(0);
  const unread = tab === 'chat' ? 0 : Math.max(0, chatCount - seen);
  const pick = (t: Tab) => {
    if (t === 'chat' || tab === 'chat') setSeen(chatCount);
    setPicked(t);
  };

  // A light buzz when it becomes your move.
  useEffect(() => {
    if (isMyMove) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  }, [isMyMove]);

  if (roomError) {
    return (
      <View style={{ alignItems: 'center', paddingVertical: 64, paddingHorizontal: 16, gap: 12 }}>
        <Text variant="title" style={{ textAlign: 'center' }}>
          This room isn&apos;t here anymore
        </Text>
        <Text tone="muted" style={{ textAlign: 'center' }}>
          It may have expired, or the link is off by a character. Start a fresh one, it only takes a second.
        </Text>
        <Button onPress={() => router.dismissTo('/')}>Back to the lobby</Button>
      </View>
    );
  }

  const bottom = teamColor ?? 'w';
  const top = bottom === 'w' ? 'b' : 'w';
  const offerNote =
    drawOfferedBy && game?.status === 'playing'
      ? drawOfferedBy === teamColor
        ? 'You offered a draw.'
        : `${colorName(drawOfferedBy)} offers a draw.`
      : '';

  return (
    <View style={{ gap: 8 }}>
      <DeployBanner />
      <TeamBar color={top} />
      <View>
        <ChessGame />
        {!game && (
          <View style={[StyleSheet.absoluteFill, styles.connecting, { backgroundColor: alpha(c.bg, 0.7) }]}>
            <Text variant="small" tone="muted">
              Connecting…
            </Text>
          </View>
        )}
      </View>
      <TeamBar color={bottom} />

      {!!room?.spectatorCount && (
        <View style={{ alignItems: 'flex-end' }}>
          <Crowd />
        </View>
      )}

      {!setup && <MoveList horizontal />}

      {moveHistoryFen ? (
        <View style={[styles.note, { backgroundColor: c.raised }]}>
          <Text variant="small" tone="muted">
            Looking at an earlier move
          </Text>
          <Pressable accessibilityRole="button" onPress={() => setMoveHistoryFen('')}>
            <Text variant="small" tone="accent" style={{ fontWeight: '600' }}>
              Back to live
            </Text>
          </Pressable>
        </View>
      ) : null}
      {offerNote ? (
        <View style={[styles.note, { backgroundColor: alpha(c.accent, 0.15) }]}>
          <Text variant="small" style={{ fontWeight: '500' }}>
            {offerNote}
          </Text>
        </View>
      ) : null}

      <GameActions />

      <View accessibilityRole="tablist" style={[styles.tabs, { backgroundColor: c.raised }]}>
        {tabs.map((t) => {
          const on = tab === t;
          return (
            <Pressable
              key={t}
              accessibilityRole="tab"
              accessibilityState={{ selected: on }}
              onPress={() => pick(t)}
              style={[styles.tab, on && { backgroundColor: c.surface }]}
            >
              <Text variant="small" style={{ fontWeight: '500', color: on ? c.fg : c.fgMuted }}>
                {t === 'setup' ? 'Room setup' : t === 'moves' ? 'Moves' : 'Chat'}
              </Text>
              {t === 'chat' && unread > 0 && (
                <View style={[styles.badge, { backgroundColor: c.accent }]}>
                  <Text style={{ fontSize: 11, fontWeight: '600', color: c.accentFg }}>{unread}</Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </View>
      <View style={[styles.panel, { borderColor: c.line, backgroundColor: c.surface }]}>
        {tab === 'setup' && <RoomSetup />}
        {tab === 'moves' && <MoveList />}
        {tab === 'chat' && (
          <>
            <View style={{ alignItems: 'flex-end', paddingHorizontal: 8, paddingTop: 8 }}>
              <MuteSpectators />
            </View>
            <RoomChat />
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  connecting: { alignItems: 'center', justifyContent: 'center', borderRadius: 6 },
  note: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.sm,
  },
  tabs: { flexDirection: 'row', padding: 4, gap: 4, borderRadius: radius.sm },
  tab: { flex: 1, height: 40, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 6 },
  badge: { minWidth: 20, height: 20, borderRadius: 10, paddingHorizontal: 5, alignItems: 'center', justifyContent: 'center' },
  panel: { borderWidth: 1, borderRadius: radius.lg, overflow: 'hidden' },
});
