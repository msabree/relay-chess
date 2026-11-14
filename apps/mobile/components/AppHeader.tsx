import { Avatar } from '@/components/ui/Avatar';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Logo } from '@/components/ui/Logo';
import { useUser } from '@/hooks/useUser';
import { useTheme } from '@/theme/ThemeProvider';
import { router } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

/** One header for every screen, like web: brand, your player name, menu. */
export function AppHeader() {
  const { c } = useTheme();
  const user = useUser();

  return (
    <View style={[styles.bar, { borderBottomColor: c.line, backgroundColor: c.bg }]}>
      <Pressable accessibilityRole="link" accessibilityLabel="Relay Chess home" onPress={() => router.dismissTo('/')}>
        <Logo height={20} />
      </Pressable>
      <View style={styles.right}>
        {user.data && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Playing as ${user.data.username}. Change name and settings`}
            onPress={() => router.push('/settings')}
            style={({ pressed }) => [styles.me, pressed && { backgroundColor: c.raised }]}
          >
            <Avatar name={user.data.username} size={28} />
            <Text numberOfLines={1} style={[styles.name, { color: c.fg }]}>
              {user.data.username}
            </Text>
          </Pressable>
        )}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Menu"
          onPress={() => router.push('/modals/menu')}
          style={({ pressed }) => [styles.icon, pressed && { backgroundColor: c.raised }]}
        >
          <IconSymbol name="line.3.horizontal" size={22} color={c.fgMuted} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    height: 56,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  right: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  me: { flexDirection: 'row', alignItems: 'center', gap: 8, height: 40, paddingLeft: 6, paddingRight: 10, borderRadius: 8 },
  name: { fontSize: 14, fontWeight: '500', maxWidth: 120 },
  icon: { width: 40, height: 40, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
});
