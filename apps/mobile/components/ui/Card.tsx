import { useTheme } from '@/theme/ThemeProvider';
import { radius } from '@/theme/tokens';
import React from 'react';
import { View, type ViewProps } from 'react-native';

/** Web's `rounded-2xl border border-line bg-surface`. */
export function Card({ style, ...props }: ViewProps) {
  const { c } = useTheme();
  return (
    <View
      {...props}
      style={[
        { backgroundColor: c.surface, borderColor: c.line, borderWidth: 1, borderRadius: radius.xl, padding: 20 },
        style,
      ]}
    />
  );
}
