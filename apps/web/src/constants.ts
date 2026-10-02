export const CHESS_SERVER_API = process.env.NEXT_PUBLIC_CHESS_SERVER_API ?? '';
export const CHESS_SERVER_SOCKETS = process.env.NEXT_PUBLIC_CHESS_SERVER_SOCKETS ?? '';
export const NEW_GAME_POSITION = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
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
export const LOBBY_CONNECTION_TYPE = 'lobby';
export const MATCHMAKING_CONNECTION_TYPE = 'matchmaking';
export const INVITE_TEAMMATES_CONNECTION_TYPE = 'invite-teammates';
export const CHESS_GAME_CONNECTION_TYPE = 'chess-game';
export const PRIVATE_GAME_CREATION_CONNECTION_TYPE = 'private-game-creation';
export const LIVE_GAMES_CONNECTION_TYPE = 'live-games';

// REAL-TIME EVENTS
export const CHESS_MOVE = 'chess-move';
export const USER_CONNECTED = 'user-connected';
export const USER_LEFT = 'user-left';
export const GAME_OVER = 'game-over';
export const CHAT_MESSAGE = 'chat-message';
export const DECREMENT_TIMER = 'decrement-timer';
export const CHANGE_TEAM = 'change-team';
export const OFFER_REMATCH = 'offer-rematch';
export const GAME_ROOM_NOT_FOUND = 'game-room-not-found';
export const TEAMMATE_LOBBY_CONNECTED = 'teammate-lobby-connected';
export const TEAMMATE_LOBBY_MATCHMAKING_STARTED = 'teammate-lobby-matchmaking-started';
export const MULTIPLAYER_MATCH_FOUND = 'multiplayer-match-found';
export const PRIVATE_GAME_CREATED = 'private-game-created';
export const UPDATE_TIMER = 'update-timer';
export const ONLINE_STATS_UPDATE = 'online-stats-update';
export const LIVE_GAMES_LIST = 'live-games-list';
export const LIVE_GAME_UPDATED = 'live-game-updated';
export const LIVE_GAME_REMOVED = 'live-game-removed';

// STATIC ROOMS
export const MULTIPLAYER_MATCHMAKING_ROOM = 'multiplayer-matchmaking-room';
export const LOBBY_ROOM = 'lobby';
export const LIVE_GAMES_ROOM = 'live-games-room';

// BOARD COLORS
export const BOARD_COLOR_SCHEMES = [
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

// TESTING
export const USE_TEST_USERS = process.env.NEXT_PUBLIC_USE_TEST_USERS === 'true';
export const DEMO_VIDEO = 'https://relay-chess.s3.amazonaws.com/RelayChess.mp4';
export const SITE_URL = 'https://relaychess.com';

// GOOGLE ANALYTICS
export const GOOGLE_ANALYTICS_ID = process.env.NEXT_PUBLIC_GA_ID ?? '';
export const ANALYTICS_TEST_MODE = process.env.NEXT_PUBLIC_CHESS_SERVER_API?.includes('localhost') ?? true;
export const SELECTED_GAME_MODE = 'Selected Game Mode';
export const CREATED_PRIVATE_GAME = 'Created Private Game';
export const STARTED_SOLO_GAME = 'Started Solo Game';
export const VIEWED_LEADERBOARD = 'Viewed Leaderboard';
export const CLICKED_SIGN_IN = 'Clicked Sign In';
export const CLICKED_REVIEW_GAME = 'Clicked Review Game';
export const CLICKED_LIKED_GAMEPLAY = 'Clicked Liked Gameplay';
export const CLICKED_DISLIKED_GAMEPLAY = 'Clicked Disliked Gameplay';