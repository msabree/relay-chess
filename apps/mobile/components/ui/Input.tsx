import { useTheme } from '@/theme/ThemeProvider';
import { radius } from '@/theme/tokens';
import React, { useState } from 'react';
import { TextInput, type TextInputProps } from 'react-native';

/** Web's input: bg-bg, border-line, yellow border on focus. */
export function Input({ style, onFocus, onBlur, ...props }: TextInputProps) {
  const { c } = useTheme();
  const [focused, setFocused] = useState(false);
  return (
    <TextInput
      placeholderTextColor={c.fgSubtle}
      selectionColor={c.accent}
      {...props}
      onFocus={(e) => {
        setFocused(true);
        onFocus?.(e);
      }}
      onBlur={(e) => {
        setFocused(false);
        onBlur?.(e);
      }}
      style={[
        {
          height: 44,
          borderRadius: radius.sm,
          borderWidth: 1,
          borderColor: focused ? c.accent : c.line,
          backgroundColor: c.bg,
          color: c.fg,
          paddingHorizontal: 12,
          fontSize: 15,
        },
        style,
      ]}
    />
  );
}
