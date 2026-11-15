import { useTheme } from '@/theme/ThemeProvider';
import React from 'react';
import { Platform, Text as RNText, type TextProps } from 'react-native';

type Variant = 'display' | 'title' | 'heading' | 'body' | 'small' | 'caption' | 'mono';
type Tone = 'default' | 'muted' | 'subtle' | 'accent' | 'danger' | 'success' | 'onAccent';

const variants = {
  display: { fontSize: 34, lineHeight: 38, fontWeight: '600', letterSpacing: -0.6 },
  title: { fontSize: 24, lineHeight: 30, fontWeight: '600', letterSpacing: -0.3 },
  heading: { fontSize: 17, lineHeight: 22, fontWeight: '600' },
  body: { fontSize: 16, lineHeight: 23 },
  small: { fontSize: 14, lineHeight: 20 },
  caption: { fontSize: 12, lineHeight: 16 },
  mono: { fontSize: 15, lineHeight: 20, fontFamily: Platform.select({ ios: 'Menlo', default: 'monospace' }), fontVariant: ['tabular-nums'] },
} as const;

/** Themed text. `tone` maps to the web's text-fg / text-fg-muted / text-accent-ink... */
export function Text({
  variant = 'body',
  tone = 'default',
  style,
  ...props
}: TextProps & { variant?: Variant; tone?: Tone }) {
  const { c } = useTheme();
  const color = {
    default: c.fg,
    muted: c.fgMuted,
    subtle: c.fgSubtle,
    accent: c.accentInk,
    danger: c.danger,
    success: c.success,
    onAccent: c.accentFg,
  }[tone];
  return <RNText {...props} style={[variants[variant], { color }, style]} />;
}
