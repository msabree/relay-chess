import { useSettings } from '@/lib/settings';
import { DarkTheme, DefaultTheme, ThemeProvider as NavThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { palette, type Colors } from './tokens';

interface Theme {
  c: Colors;
  isDark: boolean;
}

const ThemeContext = createContext<Theme>({ c: palette.light, isDark: false });

/** Light, dark or system (the setting), applied to screens, navigation and the status bar. */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const system = useColorScheme();
  const { theme } = useSettings();
  const isDark = theme === 'system' ? system === 'dark' : theme === 'dark';
  const c = isDark ? palette.dark : palette.light;

  const nav = useMemo(() => {
    const base = isDark ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        primary: c.accent,
        background: c.bg,
        card: c.bg,
        text: c.fg,
        border: c.line,
        notification: c.accent,
      },
    };
  }, [isDark, c]);

  useEffect(() => {
    SystemUI.setBackgroundColorAsync(c.bg).catch(() => {});
  }, [c.bg]);

  const value = useMemo(() => ({ c, isDark }), [c, isDark]);

  return (
    <ThemeContext.Provider value={value}>
      <NavThemeProvider value={nav}>
        {children}
        <StatusBar style={isDark ? 'light' : 'dark'} />
      </NavThemeProvider>
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
