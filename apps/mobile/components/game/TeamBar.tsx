import { IconSymbol } from '@/components/ui/IconSymbol';
import { Text } from '@/components/ui/Text';
import { ChessGameContext } from '@/contexts/ChessGame';
import { nextMover, type Color } from '@relay-chess/game';
import { useTheme } from '@/theme/ThemeProvider';
import { alpha, radius } from '@/theme/tokens';
import React, { useContext, useEffect, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { ColorSwatch } from './ColorSwatch';
import { colorName, formatClock, initials, relayOrder, sideToMove } from './util';

/**
 * One side of the board: relay order as chips, a status line, and the clock.
 * Yellow always means "you".
 */
export default function TeamBar({ color }: { color: Color }) {
  const { c, isDark } = useTheme();
  const { game, userId, clocks, deadlines } = useContext(ChessGameContext);
  const deadline = deadlines[color];
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!deadline) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [deadline]);

  if (!game) return <View style={{ height: 60 }} />;

  const over = game.status === 'over';
  const turn = sideToMove(game);
  const onMove = !over && turn === color && game.teams.w.length > 0 && game.teams.b.length > 0;
  const order = relayOrder(game, color);
  const next = nextMover(game, color);
  const mine = game.teams[color].some((p) => p.id === userId);
  const myMove = onMove && next?.id === userId;

  let status = '';
  if (game.teams[color].length === 0) status = 'Waiting for a player';
  else if (over) status = game.result?.winner === color ? 'Won' : game.result?.winner ? 'Lost' : '';
  else if (myMove) status = order.length > 1 ? `Your move. ${order[1]!.name} plays after you.` : 'Your move.';
  else if (onMove)
    status = mine && order[1]?.id === userId ? `${next?.name} is moving. You're next.` : `${next?.name} is moving.`;
  else if (game.status === 'waiting')
    status = color === 'w' ? `${next?.name} makes the first move.` : `${next?.name} plays Black's first move.`;
  else status = mine && next?.id === userId ? `You play ${colorName(color)}'s next move.` : `${next?.name} plays next.`;

  const away = !!deadline && !over;
  if (away) {
    const left = formatClock(Math.max(0, deadline - now));
    status = game.status === 'playing' ? `Away. Forfeits in ${left}.` : `Away. Game closes in ${left}.`;
  }

  const clock = clocks ? formatClock(clocks[color]) : null;
  const low = clocks ? clocks[color] < 20_000 && onMove : false;
  const clockBg = low ? c.danger : onMove ? (myMove ? c.accent : c.fg) : c.raised;
  const clockFg = low ? '#FFFFFF' : onMove ? (myMove ? c.accentFg : c.bg) : c.fgMuted;

  return (
    <View
      accessibilityLabel={`${colorName(color)} team`}
      style={[styles.bar, { backgroundColor: c.surface, borderColor: myMove ? c.accent : c.line }]}
    >
      <ColorSwatch color={color} />
      <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
        <View style={styles.chips} accessibilityLabel={`${colorName(color)} relay order`}>
          {order.map((p, i) => {
            const isMe = p.id === userId;
            const moving = i === 0 && onMove;
            const bg = moving && isMe ? c.accent : moving ? c.fg : isMe ? alpha(c.accent, 0.2) : c.raised;
            const fg = moving && isMe ? c.accentFg : moving ? c.bg : c.fg;
            return (
              <View key={p.id} style={[styles.chipWrap, { opacity: p.connected ? 1 : 0.5 }]}>
                {i > 0 && <IconSymbol name="chevron.right" size={12} color={c.fgSubtle} />}
                <View
                  style={[
                    styles.chip,
                    { backgroundColor: bg },
                    isMe && !moving && { borderWidth: 1, borderColor: alpha(c.accent, 0.6) },
                  ]}
                >
                  <View style={[styles.initial, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]}>
                    <Text style={{ fontSize: 11, fontWeight: '600', color: fg }}>{initials(p.name)}</Text>
                  </View>
                  {i === 0 && (
                    <Text numberOfLines={1} style={{ fontSize: 13, fontWeight: '500', color: fg, flexShrink: 1 }}>
                      {isMe ? 'You' : p.name}
                    </Text>
                  )}
                  {!p.connected && (
                    <Text style={{ fontSize: 10, letterSpacing: 0.8, color: fg, opacity: 0.7 }}>AWAY</Text>
                  )}
                </View>
              </View>
            );
          })}
        </View>
        {status ? (
          <Text
            numberOfLines={1}
            accessibilityLiveRegion="polite"
            style={{ fontSize: 13 }}
            tone={away ? 'danger' : myMove ? 'accent' : 'muted'}
          >
            {status}
          </Text>
        ) : null}
      </View>
      <View
        accessibilityLabel={clock ? `${colorName(color)} clock ${clock}` : 'No clock'}
        style={[styles.clock, { backgroundColor: clockBg }]}
      >
        {clock ? (
          <Text style={[styles.clockText, { color: clockFg }]}>{clock}</Text>
        ) : (
          <Text style={{ fontSize: 13, fontWeight: '500', color: clockFg }}>No clock</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingLeft: 12,
    paddingRight: 8,
    borderWidth: 1,
    borderRadius: radius.lg,
  },
  chips: { flexDirection: 'row', alignItems: 'center', gap: 4, overflow: 'hidden' },
  chipWrap: { flexDirection: 'row', alignItems: 'center', gap: 4, flexShrink: 1, minWidth: 0 },
  chip: {
    height: 26,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingLeft: 3,
    paddingRight: 8,
    borderRadius: 13,
    flexShrink: 1,
    minWidth: 0,
  },
  initial: { minWidth: 20, height: 20, borderRadius: 10, paddingHorizontal: 2, alignItems: 'center', justifyContent: 'center' },
  clock: { height: 42, minWidth: 80, paddingHorizontal: 10, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  clockText: {
    fontSize: 22,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
    fontFamily: Platform.select({ ios: 'Menlo', default: 'monospace' }),
  },
});
