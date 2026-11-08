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
  }
];

export const DEMO_VIDEO_ID = 'ZqJTfKS_rWg';
// Muted autoplay loop; loop needs the id repeated in `playlist`.
export const DEMO_VIDEO = `https://www.youtube-nocookie.com/embed/${DEMO_VIDEO_ID}?autoplay=1&mute=1&loop=1&playlist=${DEMO_VIDEO_ID}&playsinline=1&rel=0`;
export const SITE_URL = 'https://relaychess.com';
