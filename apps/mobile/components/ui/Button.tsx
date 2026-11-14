import { useTheme } from '@/theme/ThemeProvider';
import { radius } from '@/theme/tokens';
import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';

export type ButtonVariant = 'primary' | 'dark' | 'secondary' | 'ghost' | 'danger';

interface ButtonProps {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: 'md' | 'lg';
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
  loading?: boolean;
  accessibilityLabel?: string;
}

/**
 * Web's buttons: primary is the yellow fill, dark is the inverted (bg-fg) one,
 * secondary is outlined, ghost is text only.
 */
export default function Button({
  children,
  onPress,
  variant = 'primary',
  size = 'md',
  style,
  disabled = false,
  loading = false,
  accessibilityLabel,
}: ButtonProps) {
  const { c } = useTheme();
  const look = {
    primary: { bg: c.accent, fg: c.accentFg, border: c.accent },
    dark: { bg: c.fg, fg: c.bg, border: c.fg },
    secondary: { bg: 'transparent', fg: c.fg, border: c.line },
    ghost: { bg: 'transparent', fg: c.fgMuted, border: 'transparent' },
    danger: { bg: 'transparent', fg: c.danger, border: c.line },
  }[variant];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: disabled || loading }}
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        size === 'lg' ? styles.lg : styles.md,
        { backgroundColor: look.bg, borderColor: look.border },
        pressed && { opacity: 0.85 },
        (disabled || loading) && { opacity: 0.5 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={look.fg} />
      ) : typeof children === 'string' ? (
        <Text style={[styles.label, size === 'lg' && styles.labelLg, { color: look.fg }]}>{children}</Text>
      ) : (
        children
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    paddingHorizontal: 16,
  },
  md: { height: 44, borderRadius: radius.sm },
  lg: { height: 52, borderRadius: radius.lg, paddingHorizontal: 22 },
  label: { fontSize: 15, fontWeight: '600' },
  labelLg: { fontSize: 16 },
});
