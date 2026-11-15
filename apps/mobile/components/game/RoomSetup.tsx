import Button from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { TIMER_OPTIONS, timerLabel } from '@/constants/Games';
import { SITE_URL } from '@/constants/URLs';
import { ChessGameContext } from '@/contexts/ChessGame';
import { type Color } from '@relay-chess/game';
import { useTheme } from '@/theme/ThemeProvider';
import { radius } from '@/theme/tokens';
import * as Clipboard from 'expo-clipboard';
import React, { useContext, useState } from 'react';
import { Pressable, Share, StyleSheet, Switch, View } from 'react-native';
import { ColorSwatch } from './ColorSwatch';
import { colorName } from './util';

const MAX_PER_TEAM = 4;
const TIMERS = ['1,0', '3,2', ...TIMER_OPTIONS.map((t) => t.time)];

/** Before the first move of a private game: invite, pick sides, pick the clock. */
export default function RoomSetup() {
  const { c } = useTheme();
  const { game, room, roomId, userId, teamColor, changeTeam, updateTimer, selectedTimer, setWatchable } =
    useContext(ChessGameContext);
  const [copied, setCopied] = useState(false);
  if (!game || !room) return null;
  const url = `${SITE_URL}/games/${roomId}`;
  const seated = !!teamColor;

  const copy = async () => {
    await Clipboard.setStringAsync(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const team = (side: Color) => (
    <View style={[styles.team, { borderColor: c.line }]}>
      <View style={styles.teamHead}>
        <ColorSwatch color={side} size={12} />
        <Text variant="small" style={{ fontWeight: '600' }}>
          {colorName(side)}
        </Text>
        {side === 'w' && (
          <Text variant="caption" tone="subtle">
            moves first
          </Text>
        )}
      </View>
      {game.teams[side].map((p, i) => (
        <View key={p.id} style={styles.seat}>
          <Text variant="caption" tone="subtle" style={{ width: 14 }}>
            {i + 1}
          </Text>
          <Text variant="small" numberOfLines={1} style={{ flexShrink: 1, fontWeight: p.id === userId ? '600' : '400' }}>
            {p.name}
          </Text>
          {p.id === userId && (
            <View style={[styles.you, { backgroundColor: c.accent }]}>
              <Text style={{ fontSize: 10, fontWeight: '700', color: c.accentFg }}>YOU</Text>
            </View>
          )}
          {!p.connected && (
            <Text variant="caption" tone="subtle">
              away
            </Text>
          )}
        </View>
      ))}
      {game.teams[side].length === 0 && (
        <Text variant="small" tone="subtle" style={styles.seat}>
          Open seat
        </Text>
      )}
      {teamColor !== side && game.teams[side].length < MAX_PER_TEAM && (
        <Button variant="secondary" style={{ height: 36, marginTop: 6 }} onPress={() => changeTeam(side)}>
          {seated ? `Switch to ${colorName(side)}` : `Join ${colorName(side)}`}
        </Button>
      )}
    </View>
  );

  return (
    <View style={{ padding: 16, gap: 18 }}>
      <View style={{ gap: 4 }}>
        <Text variant="heading">Room setup</Text>
        <Text variant="small" tone="muted">
          Share the link and pick sides. Teams can be 1 to 4 players and take turns in the order shown. White&apos;s
          first move starts the game.
        </Text>
      </View>

      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Button style={{ flex: 1 }} onPress={() => Share.share({ message: `Play Relay Chess with me: ${url}` })}>
          Invite friends
        </Button>
        <Button variant="secondary" onPress={copy}>
          {copied ? 'Copied' : 'Copy link'}
        </Button>
      </View>

      <View style={{ flexDirection: 'row', gap: 8 }}>
        {team('w')}
        {team('b')}
      </View>
      {seated && (
        <Pressable accessibilityRole="button" onPress={() => changeTeam('spectator')}>
          <Text variant="small" tone="muted" style={{ textDecorationLine: 'underline' }}>
            Just watch instead
          </Text>
        </Pressable>
      )}

      <View style={{ gap: 8 }}>
        <Text variant="small" style={{ fontWeight: '600' }}>
          Clock
        </Text>
        <View style={styles.timers}>
          {TIMERS.map((t) => {
            const on = selectedTimer === t;
            return (
              <Pressable
                key={t}
                accessibilityRole="button"
                accessibilityState={{ selected: on, disabled: !seated }}
                disabled={!seated}
                onPress={() => updateTimer(t)}
                style={[
                  styles.timer,
                  on ? { backgroundColor: c.fg } : { borderWidth: 1, borderColor: c.line },
                  !seated && { opacity: 0.6 },
                ]}
              >
                <Text variant="mono" style={{ fontSize: 14, fontWeight: '500', color: on ? c.bg : c.fg }}>
                  {timerLabel(t, 'None')}
                </Text>
              </Pressable>
            );
          })}
        </View>
        {!seated && (
          <Text variant="caption" tone="subtle">
            Players pick the clock.
          </Text>
        )}
      </View>

      <View style={[styles.watch, !seated && { opacity: 0.6 }]}>
        <View style={{ flex: 1 }}>
          <Text variant="small" style={{ fontWeight: '600' }}>
            Allow anyone to watch
          </Text>
          <Text variant="caption" tone="subtle">
            Shows this game on Live Games once it starts, so anyone can watch. Only people with the link can play.
          </Text>
        </View>
        <Switch
          value={room.watchable}
          disabled={!seated}
          onValueChange={setWatchable}
          trackColor={{ true: c.accent, false: c.raised }}
          thumbColor="#FFFFFF"
          accessibilityLabel="Allow anyone to watch"
        />
      </View>

      {room.spectators.length > 0 && (
        <Text variant="caption" tone="subtle">
          Watching: {room.spectators.map((s) => (s.id === userId ? 'you' : s.name)).join(', ')}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  team: { flex: 1, borderWidth: 1, borderRadius: radius.md, padding: 10 },
  teamHead: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  seat: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 30 },
  you: { borderRadius: 4, paddingHorizontal: 4, paddingVertical: 1 },
  timers: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  timer: { height: 36, paddingHorizontal: 12, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  watch: { flexDirection: 'row', alignItems: 'center', gap: 12 },
});
