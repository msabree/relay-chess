import { useTheme } from '@/theme/ThemeProvider';
import React from 'react';
import { View } from 'react-native';

/** Little white/black square that marks a team, like web. */
export function ColorSwatch({ color, size = 14 }: { color: 'w' | 'b' | null; size?: number }) {
  const { c } = useTheme();
  const bg = color === 'w' ? '#FFFFFF' : color === 'b' ? '#08090A' : c.fgSubtle;
  const ring = color === 'w' ? '#A3A9B0' : color === 'b' ? '#5A6068' : c.fgSubtle;
  return <View style={{ width: size, height: size, borderRadius: 3, backgroundColor: bg, borderWidth: 1, borderColor: ring }} />;
}
