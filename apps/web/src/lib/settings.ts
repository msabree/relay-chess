import { useEffect, useState } from 'react';
import { BOARD_COLOR_SCHEMES } from '@/constants';

/** Per-device settings, kept in localStorage. */
const BOARD_KEY = 'relaychess.board';
const listeners = new Set<(v: string) => void>();

const readBoard = () => {
  try {
    return window.localStorage.getItem(BOARD_KEY) ?? BOARD_COLOR_SCHEMES[0].value;
  } catch {
    return BOARD_COLOR_SCHEMES[0].value;
  }
};

export function setBoardColor(value: string) {
  try {
    window.localStorage.setItem(BOARD_KEY, value);
  } catch {
    /* ignore */
  }
  listeners.forEach((l) => l(value));
}

/** The board color scheme picked on this device. */
export function useBoardColor() {
  const [value, setValue] = useState(BOARD_COLOR_SCHEMES[0].value);
  useEffect(() => {
    setValue(readBoard());
    listeners.add(setValue);
    return () => void listeners.delete(setValue);
  }, []);
  return BOARD_COLOR_SCHEMES.find((s) => s.value === value) ?? BOARD_COLOR_SCHEMES[0];
}
