/** HTTP API and socket.io share one origin (apps/server). */
export const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL ?? 'http://localhost:4000';
export const TEAM_COLOR_WHITE = 'w';
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

// CHESS POINTS
export const PAWN_POINTS = 1;
export const KNIGHT_POINTS = 3;
export const BISHOP_POINTS = 3;
export const ROOK_POINTS = 5;
export const QUEEN_POINTS = 9;

// CONNECTION-TYPES (THINK OF THESE LIKE RESTFUL ROUTES)

// REAL-TIME EVENTS
export const GAME_OVER = 'game-over';

// STATIC ROOMS

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

export const DEMO_VIDEO = 'https://relay-chess.s3.amazonaws.com/RelayChess.mp4';
export const SITE_URL = 'https://relaychess.com';

// GOOGLE ANALYTICS
export const GOOGLE_ANALYTICS_ID = process.env.NEXT_PUBLIC_GA_ID ?? '';
export const ANALYTICS_TEST_MODE = process.env.NODE_ENV !== 'production';
export const SELECTED_GAME_MODE = 'Selected Game Mode';
export const CREATED_PRIVATE_GAME = 'Created Private Game';
export const STARTED_SOLO_GAME = 'Started Solo Game';
export const VIEWED_LEADERBOARD = 'Viewed Leaderboard';
export const CLICKED_SIGN_IN = 'Clicked Sign In';
export const CLICKED_REVIEW_GAME = 'Clicked Review Game';
export const CLICKED_DISLIKED_GAMEPLAY = 'Clicked Disliked Gameplay';