import { useTheme } from '@/theme/ThemeProvider';
import React from 'react';
import { Text, View } from 'react-native';

export const initials = (name: string) => {
  const words = name.trim().split(/[\s_-]+/).filter(Boolean);
  if (words.length >= 2 && /^[A-Za-z]/.test(words[1]!)) return (words[0]![0]! + words[1]![0]!).toUpperCase();
  return (name[0] ?? '?').toUpperCase();
};

/** Yellow initials chip, like the web header. */
export function Avatar({ name, size = 30 }: { name: string; size?: number }) {
  const { c } = useTheme();
  return (
    <View
      style={{
        minWidth: size,
        height: size,
        borderRadius: size / 2,
        paddingHorizontal: 4,
        backgroundColor: c.accent,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ color: c.accentFg, fontSize: size * 0.4, fontWeight: '600' }}>{initials(name)}</Text>
    </View>
  );
}
