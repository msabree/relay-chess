import { IconSymbol } from '@/components/ui/IconSymbol';
import { useTheme } from '@/theme/ThemeProvider';
import { radius } from '@/theme/tokens';
import { router, usePathname, type Href } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const LINKS: { href: Href; label: string; icon: React.ComponentProps<typeof IconSymbol>['name'] }[] = [
  { href: '/', label: 'Play', icon: 'house.fill' },
  { href: '/live', label: 'Watch', icon: 'eye' },
  { href: '/leaderboard', label: 'Leaderboard', icon: 'trophy' },
  { href: '/settings', label: 'Settings', icon: 'gearshape' },
];

/** Main menu: the same links as the web header. */
export default function Menu() {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const path = usePathname();

  const go = (href: Href) => {
    router.back();
    if (href === '/') router.dismissTo('/');
    else router.push(href);
  };

  return (
    <Animated.View entering={FadeIn.duration(150)} style={styles.backdrop}>
      <Pressable style={StyleSheet.absoluteFill} accessibilityLabel="Close menu" onPress={() => router.back()} />
      <Animated.View
        entering={SlideInDown.duration(220)}
        style={[styles.sheet, { backgroundColor: c.surface, borderColor: c.line, paddingBottom: insets.bottom + 12 }]}
      >
        <View style={[styles.grabber, { backgroundColor: c.line }]} />
        {LINKS.map((l) => {
          const on = path === l.href;
          return (
            <Pressable
              key={l.label}
              accessibilityRole="link"
              accessibilityState={{ selected: on }}
              onPress={() => go(l.href)}
              style={({ pressed }) => [styles.row, (on || pressed) && { backgroundColor: c.raised }]}
            >
              <IconSymbol name={l.icon} size={22} color={on ? c.accentInk : c.fgMuted} />
              <Text style={[styles.label, { color: c.fg }]}>{l.label}</Text>
            </Pressable>
          );
        })}
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  grabber: { alignSelf: 'center', width: 36, height: 4, borderRadius: 2, marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, height: 52, paddingHorizontal: 12, borderRadius: radius.sm },
  label: { fontSize: 17, fontWeight: '500' },
});
