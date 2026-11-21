/** HTTP API and socket.io share one origin (apps/server). */
export const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL ?? 'http://localhost:4000';
export const TEAM_COLOR_BLACK = 'b';

export const TIMER_OPTIONS = [
  {
    time: '5,3',
    typeKey: 'blitz' as const
  },
  {
    time: '10,0',
    typeKey: 'rapid' as const
  },
  {
    time: '10,3',
    typeKey: 'rapid' as const
  },
  {
    time: '0,0',
    typeKey: 'untimed' as const
  }
];

/** Public and team queues: one timed, one casual, so the small pool isn't split. */
export const QUEUE_TIMER_OPTIONS = [
  { time: '5,5', typeKey: 'blitz' as const },
  { time: '0,0', typeKey: 'untimed' as const },
];

// BOARD COLORS
export const BOARD_COLOR_SCHEMES = [
  {
    value: 'slate',
    labelKey: 'slate' as const,
    dark: '#7E95A3',
    light: '#DCE1E4'
  },
  {
    value: 'blue-white',
    labelKey: 'blueWhite' as const,
    dark: '#60688e',
    light: '#d3d7ec'
  },
  {
    value: 'green-white',
    labelKey: 'greenWhite' as const,
    dark: '#659f64',
    light: '#e5eae7'
  },
  {
    value: 'red-white',
    labelKey: 'redWhite' as const,
    dark: '#9f2b2b',
    light: '#d4c3c3'
  },
  // Supporter thank-yous: only offered to supporters, and only cosmetic.
  { value: 'walnut', labelKey: 'walnut' as const, dark: '#b58863', light: '#f0d9b5', supporter: true },
  { value: 'lavender', labelKey: 'lavender' as const, dark: '#8a7bb5', light: '#e7e1f3', supporter: true },
  { value: 'coral', labelKey: 'coral' as const, dark: '#cf7464', light: '#f7e4dc', supporter: true },
  { value: 'midnight', labelKey: 'midnight' as const, dark: '#4d5872', light: '#a8b2c5', supporter: true }
] as { value: string; labelKey: string; dark: string; light: string; supporter?: true }[];

/**
 * Supporter arenas: a themed look for your own games (backdrop and board).
 * Only you see it. Backdrops are soft glows over the page color, so they read
 * in light and dark themes alike.
 */
export const ARENAS = [
  {
    value: 'nightclub',
    label: 'Night Club',
    board: { dark: '#5c5f9a', light: '#cdcfea' },
    backdrop:
      'radial-gradient(1100px 600px at 15% -10%, hsl(258 85% 62% / 0.28), transparent 70%), radial-gradient(900px 600px at 100% 110%, hsl(318 85% 60% / 0.22), transparent 70%)',
  },
  {
    value: 'park',
    label: 'Park',
    board: { dark: '#6f8f57', light: '#ebe7cc' },
    backdrop:
      'radial-gradient(1100px 600px at 50% -15%, hsl(95 55% 50% / 0.24), transparent 70%), radial-gradient(900px 500px at 0% 110%, hsl(45 80% 55% / 0.18), transparent 70%)',
  },
  {
    value: 'sunset',
    label: 'Sunset',
    board: { dark: '#c8705a', light: '#f6dfcf' },
    backdrop:
      'radial-gradient(1100px 600px at 85% -10%, hsl(22 95% 58% / 0.28), transparent 70%), radial-gradient(900px 600px at 0% 110%, hsl(340 80% 60% / 0.2), transparent 70%)',
  },
];

export const DEMO_VIDEO_ID = 'fpJZD0dczgw';
// Muted autoplay loop; loop needs the id repeated in `playlist`.
export const DEMO_VIDEO = `https://www.youtube-nocookie.com/embed/${DEMO_VIDEO_ID}?autoplay=1&mute=1&loop=1&playlist=${DEMO_VIDEO_ID}&playsinline=1&rel=0`;
export const SITE_URL = 'https://www.relaychess.com';
export const OG_IMAGE = `${SITE_URL}/og.png`;
