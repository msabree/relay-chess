import { BOARD_COLOR_SCHEMES } from '@/constants/Games';
import * as SecureStore from 'expo-secure-store';
import { useSyncExternalStore } from 'react';

/** Per-device settings, kept on the device. */
export type ThemeMode = 'system' | 'light' | 'dark';
export interface Settings {
  theme: ThemeMode;
  board: string;
}

const KEY = 'relaychess.settings';
let state: Settings = { theme: 'system', board: BOARD_COLOR_SCHEMES[0]!.value };
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

// Load once at startup; screens render with defaults until then.
SecureStore.getItemAsync(KEY)
  .then((raw) => {
    if (!raw) return;
    state = { ...state, ...(JSON.parse(raw) as Partial<Settings>) };
    emit();
  })
  .catch(() => {});

export function updateSettings(patch: Partial<Settings>) {
  state = { ...state, ...patch };
  emit();
  SecureStore.setItemAsync(KEY, JSON.stringify(state)).catch(() => {});
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => void listeners.delete(l);
};

export const useSettings = () => useSyncExternalStore(subscribe, () => state);

/** The board color scheme picked on this device. */
export const useBoardColors = () => {
  const { board } = useSettings();
  return BOARD_COLOR_SCHEMES.find((s) => s.value === board) ?? BOARD_COLOR_SCHEMES[0]!;
};
