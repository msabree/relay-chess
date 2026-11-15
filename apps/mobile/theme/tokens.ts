/**
 * Relay Chess palette: black and yellow. Same tokens as the web app
 * (apps/web/src/styles/globals.css), converted from HSL.
 */
export const palette = {
  light: {
    bg: '#F8F6F1', // warm paper
    surface: '#FFFFFF',
    raised: '#EFEDE6',
    line: '#DFDCD2',
    fg: '#141414',
    fgMuted: '#56524D',
    fgSubtle: '#746D67',
    accent: '#FFC800', // signal yellow, used as a fill
    accentFg: '#141414', // text on yellow
    accentInk: '#855B00', // yellow-family text that reads on paper
    danger: '#BA261C',
    success: '#218355',
    logoAccent: '#D9A900',
  },
  dark: {
    bg: '#0E0F11', // near black
    surface: '#17191C',
    raised: '#202327',
    line: '#2F3337',
    fg: '#F2F2EE',
    fgMuted: '#A8ADB3',
    fgSubtle: '#838991',
    accent: '#FFC800',
    accentFg: '#141414',
    accentInk: '#FFCD1A',
    danger: '#F5827A',
    success: '#51C890',
    logoAccent: '#FFC800',
  },
} as const;

export type Colors = { [K in keyof typeof palette.light]: string };

/** Hex color with alpha, like Tailwind's bg-accent/10. */
export const alpha = (hex: string, a: number) =>
  `${hex}${Math.round(a * 255)
    .toString(16)
    .padStart(2, '0')}`;

export const radius = { sm: 8, md: 10, lg: 14, xl: 18 } as const;
