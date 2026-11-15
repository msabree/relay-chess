import { Logo, LogoMark } from '@/components/ui/Logo';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { Path, Svg } from 'react-native-svg';
import { scheduleOnRN } from 'react-native-worklets';

/*
 * Launch animation: "the relay".
 *   1. Starts on the native splash frame (yellow R on black), so the hand-off is invisible.
 *   2. The R gives way to a 2x2 board: Team Yellow (bottom) vs Team Black (top).
 *   3. The move passes in true relay order, Yellow 1 -> Black 1 -> Yellow 2 -> Black 2:
 *      teams alternate, and so do teammates. Each pawn hops when it's their move.
 *   4. The wordmark rises in, then everything fades into the app.
 */

const INK = '#0E0F11'; // same as the native splash background
const YELLOW = '#FFC800';
const DARK_SQ = '#17191C';
const LIGHT_SQ = '#2A2E33';
const TOTAL = 2300;
const SQ = 64;
const MARK = 120; // same width as the native splash image

// cburnett pawn (45x45), the same piece set the board uses
const PAWN =
  'M22.5 9c-2.21 0-4 1.79-4 4 0 .89.29 1.71.78 2.38C17.33 16.5 16 18.59 16 21c0 2.03.94 3.84 2.41 5.03-3 1.06-7.41 5.55-7.41 13.47h23c0-7.92-4.41-12.41-7.41-13.47 1.47-1.19 2.41-3 2.41-5.03 0-2.41-1.33-4.5-3.28-5.62.49-.67.78-1.49.78-2.38 0-2.21-1.79-4-4-4z';

/** Squares in reading order (TL, TR, BL, BR) and the relay step each one plays. */
const SQUARES = [
  { team: 'black', light: true, relay: 1 }, // Black 1
  { team: 'black', light: false, relay: 3 }, // Black 2
  { team: 'yellow', light: false, relay: 0 }, // Yellow 1 moves first
  { team: 'yellow', light: true, relay: 2 }, // Yellow 2
] as const;

const easeOut = Easing.out(Easing.cubic);

/** Eased 0..1 progress of the clock between a and b (ms). */
function seg(t: number, a: number, b: number) {
  'worklet';
  const x = Math.min(1, Math.max(0, (t - a) / (b - a)));
  return easeOut(x);
}

export function SplashAnimation({ onDone }: { onDone: () => void }) {
  const reduced = useReducedMotion();
  const t = useSharedValue(reduced ? 2000 : 0);

  const started = useRef(false);
  const start = () => {
    if (started.current) return;
    started.current = true;
    SplashScreen.hideAsync().catch(() => {});
    t.value = withTiming(TOTAL, { duration: reduced ? 300 : TOTAL, easing: Easing.linear }, (finished) => {
      if (finished) scheduleOnRN(onDone);
    });
  };

  // Safety net: never block the app if layout or animation doesn't run.
  useEffect(() => {
    const id = setTimeout(onDone, TOTAL + 1500);
    return () => clearTimeout(id);
  }, [onDone]);

  const overlay = useAnimatedStyle(() => ({ opacity: 1 - seg(t.value, 2050, TOTAL) }));
  const mark = useAnimatedStyle(() => ({
    opacity: 1 - seg(t.value, 200, 380),
    transform: [{ scale: 1 - 0.4 * seg(t.value, 200, 380) }],
  }));
  const board = useAnimatedStyle(() => ({
    opacity: seg(t.value, 330, 430),
    transform: [
      { translateY: -28 * seg(t.value, 1600, 1850) },
      { scale: (0.85 + 0.15 * seg(t.value, 300, 520)) * (1 - 0.18 * seg(t.value, 1600, 1850)) },
    ],
  }));
  const word = useAnimatedStyle(() => ({
    opacity: seg(t.value, 1650, 1850),
    transform: [{ translateY: 14 * (1 - seg(t.value, 1650, 1850)) }],
  }));
  const tagline = useAnimatedStyle(() => ({
    opacity: seg(t.value, 1750, 1950),
    transform: [{ translateY: 10 * (1 - seg(t.value, 1750, 1950)) }],
  }));

  return (
    <Animated.View
      style={[StyleSheet.absoluteFill, styles.root, overlay]}
      onLayout={start}
      accessibilityLabel="Relay Chess"
      pointerEvents="none"
    >
      <StatusBar style="light" />
      <Animated.View style={[styles.center, mark]}>
        <LogoMark size={(MARK * 709) / 638} color={YELLOW} />
      </Animated.View>

      {/* board shares the exact center with the R, so the hand-off doesn't jump */}
      <View style={styles.center}>
        <Animated.View style={[styles.frame, board]}>
          {SQUARES.map((s, i) => (
            <RelaySquare key={i} index={i} t={t} {...s} />
          ))}
        </Animated.View>
      </View>
      <View style={styles.below}>
        <Animated.View style={word}>
          <Logo height={24} color="#F2F2EE" accent={YELLOW} />
        </Animated.View>
        <Animated.View style={tagline}>
          <Text style={styles.tagline}>2v2 chess with friends</Text>
        </Animated.View>
      </View>
    </Animated.View>
  );
}

function RelaySquare({
  index,
  team,
  light,
  relay,
  t,
}: {
  index: number;
  team: 'black' | 'yellow';
  light: boolean;
  relay: number;
  t: SharedValue<number>;
}) {
  const popAt = 350 + index * 60;
  const moveAt = 800 + relay * 200;

  // pop in with a little overshoot
  const square = useAnimatedStyle(() => {
    const p = seg(t.value, popAt, popAt + 200);
    const overshoot = Math.sin(p * Math.PI) * 0.08;
    return { transform: [{ scale: p + overshoot }] };
  });
  // the move arrives: ring lights up, pawn hops
  const ring = useAnimatedStyle(() => {
    const on = seg(t.value, moveAt - 1, moveAt + 40);
    const off = seg(t.value, moveAt + 170, moveAt + 220);
    return { opacity: on * (1 - off) };
  });
  const pawn = useAnimatedStyle(() => {
    const up = seg(t.value, moveAt, moveAt + 80);
    const down = seg(t.value, moveAt + 80, moveAt + 180);
    return { transform: [{ translateY: -10 * (up - down) }] };
  });

  return (
    <Animated.View style={[styles.square, { backgroundColor: light ? LIGHT_SQ : DARK_SQ }, square]}>
      <Animated.View style={[StyleSheet.absoluteFill, styles.ring, ring]} />
      <Animated.View style={pawn}>
        <Svg width={44} height={44} viewBox="0 0 45 45">
          <Path
            d={PAWN}
            fill={team === 'yellow' ? YELLOW : INK}
            stroke={team === 'yellow' ? INK : YELLOW}
            strokeWidth={1.5}
            strokeLinecap="round"
          />
        </Svg>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { backgroundColor: INK, zIndex: 1000, elevation: 1000 },
  center: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  frame: {
    width: SQ * 2 + 6,
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 1,
    borderWidth: 2,
    borderColor: YELLOW,
    borderRadius: 10,
    overflow: 'hidden',
  },
  square: { width: SQ, height: SQ, alignItems: 'center', justifyContent: 'center' },
  ring: { margin: 4, borderWidth: 3, borderColor: YELLOW, borderRadius: 8 },
  below: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    alignItems: 'center',
    marginTop: SQ + 12, // just under where the board settles
  },
  tagline: { marginTop: 10, color: '#A8ADB3', fontSize: 14, letterSpacing: 0.3 },
});
