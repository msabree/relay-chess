import { IconSymbol } from '@/components/ui/IconSymbol';
import { Text } from '@/components/ui/Text';
import { ChessGameContext } from '@/contexts/ChessGame';
import { useTheme } from '@/theme/ThemeProvider';
import { alpha } from '@/theme/tokens';
import React, { useContext } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

/** Who's watching. Gets louder as the crowd grows. */
export default function Crowd() {
  const { c } = useTheme();
  const { room, userId } = useContext(ChessGameContext);
  const watchers = room?.spectators ?? [];
  const n = room?.spectatorCount ?? 0;
  if (n === 0) return null;

  const bg = n >= 10 ? c.accent : n >= 3 ? alpha(c.accent, 0.25) : c.raised;
  const fg = n >= 10 ? c.accentFg : n >= 3 ? c.fg : c.fgMuted;
  const label = n >= 10 ? `Big crowd · ${n} watching` : `${n} watching`;
  const more = n - watchers.length;
  const names =
    watchers.map((s) => (s.id === userId ? 'you' : s.name)).join(', ') + (more > 0 ? ` and ${more} more` : '');

  return (
    <View
      accessibilityLabel={`${n} ${n === 1 ? 'person' : 'people'} watching: ${names}`}
      style={[styles.pill, { backgroundColor: bg }]}
    >
      <IconSymbol name="eye" size={14} color={fg} />
      <Text style={{ fontSize: 12, fontWeight: '600', color: fg }}>{label}</Text>
    </View>
  );
}

/** Players can stop spectators from chatting mid-game, e.g. if they start giving hints. */
export function MuteSpectators() {
  const { c } = useTheme();
  const { room, game, teamColor, setSpectatorsMuted } = useContext(ChessGameContext);
  if (!room || !teamColor || game?.status === 'over') return null;
  if (room.spectators.length === 0 && !room.spectatorsMuted) return null;
  const muted = room.spectatorsMuted;
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: muted }}
      onPress={() => setSpectatorsMuted(!muted)}
      style={[styles.mute, muted && { backgroundColor: c.fg }]}
    >
      <Text style={{ fontSize: 12, fontWeight: '500', color: muted ? c.bg : c.fgMuted }}>
        {muted ? 'Spectators muted' : 'Mute spectators'}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 28, paddingHorizontal: 10, borderRadius: 14 },
  mute: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
});
