import { useEffect, useState } from 'react';
import { ARENAS, BOARD_COLOR_SCHEMES } from '@/constants';
import { useIsSupporter } from '@/hooks/useSupport';

/** Per-device settings, kept in localStorage. */
function setting(key: string, fallback: string) {
  const listeners = new Set<(v: string) => void>();
  const read = () => {
    try {
      return window.localStorage.getItem(key) ?? fallback;
    } catch {
      return fallback;
    }
  };
  const set = (value: string) => {
    try {
      window.localStorage.setItem(key, value);
    } catch {
      /* ignore */
    }
    listeners.forEach((l) => l(value));
  };
  const use = () => {
    const [value, setValue] = useState(fallback);
    useEffect(() => {
      setValue(read());
      listeners.add(setValue);
      return () => void listeners.delete(setValue);
    }, []);
    return value;
  };
  return { set, use };
}

const board = setting('relaychess.board', BOARD_COLOR_SCHEMES[0].value);
const arena = setting('relaychess.arena', '');

export const setBoardColor = board.set;
export const setArena = arena.set;

/**
 * The board color scheme picked on this device. Supporter colors fall back to
 * the default when a membership ends.
 */
export function useBoardColor() {
  const value = board.use();
  const supporter = useIsSupporter();
  const scheme = BOARD_COLOR_SCHEMES.find((s) => s.value === value);
  return scheme && (!scheme.supporter || supporter) ? scheme : BOARD_COLOR_SCHEMES[0];
}

/** The supporter arena picked on this device, or null (none, or not a supporter). */
export function useArena() {
  const value = arena.use();
  const supporter = useIsSupporter();
  return (supporter && ARENAS.find((a) => a.value === value)) || null;
}
