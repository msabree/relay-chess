export interface UserRecord {
  id: string;
  email: string;
  username: string;
  boardColor?: string;
  createdAt: Date;
}

export interface WinLossDraw {
  wins: number;
  losses: number;
  draws: number;
}

/** Same shape as the legacy `leaderboard` collection, so existing data keeps working. */
export interface LeaderboardEntry extends WinLossDraw {
  userId: string;
  username: string;
  gamesPlayed: number;
  currentStreak: number;
  highestStreak: number;
  daily: Record<string, WinLossDraw>;
  weekly: Record<string, WinLossDraw>;
  monthly: Record<string, WinLossDraw>;
}

/** One move in the legacy `gameHistory` shape the analysis page reads. */
export interface HistoryMove {
  move: string;
  sanMove: string;
  lanMove: string;
  userId: string;
  username: string;
  fen: string;
}

/**
 * Finished game. Superset of the legacy `games` document: old fields are kept
 * so existing records and the analysis page keep working.
 */
export interface GameRecord {
  roomId: string;
  gameType: 'blitz' | 'rapid' | 'classic' | 'untimed';
  /** legacy coarse result */
  result: 'checkmate' | 'draw' | 'resign' | 'timeout';
  /** detailed reason from @relay-chess/game */
  reason: string;
  winningColor: 'white' | 'black' | null;
  timeControl: { initialMs: number; incrementMs: number } | null;
  whiteTeam: { id: string; name: string }[];
  blackTeam: { id: string; name: string }[];
  whiteTeamUserIds: string[];
  blackTeamUserIds: string[];
  userIds: string[];
  gameHistory: HistoryMove[];
  timestamp: Date;
  analysis?: unknown;
}

export interface ContactMessage {
  name: string;
  email: string;
  message: string;
  userId?: string;
  sentAt: Date;
}

export interface Store {
  readonly kind: 'memory' | 'mongo';
  findUserById(id: string): Promise<UserRecord | null>;
  findUserByEmail(email: string): Promise<UserRecord | null>;
  createUser(user: Omit<UserRecord, 'id'>): Promise<UserRecord>;
  updateUser(id: string, patch: Partial<Pick<UserRecord, 'username' | 'boardColor'>>): Promise<UserRecord | null>;
  /** case-insensitive */
  findUserByUsername(username: string): Promise<UserRecord | null>;
  searchUsers(prefix: string, limit: number): Promise<{ id: string; username: string }[]>;

  saveGame(game: GameRecord): Promise<void>;
  getGame(roomId: string): Promise<GameRecord | null>;
  listGames(userId: string, limit: number): Promise<GameRecord[]>;
  setAnalysis(roomId: string, analysis: unknown): Promise<void>;

  getLeaderboardEntry(userId: string): Promise<LeaderboardEntry | null>;
  putLeaderboardEntry(entry: LeaderboardEntry): Promise<void>;
  /** every entry; the leaderboard is small enough to rank in memory */
  allLeaderboardEntries(): Promise<LeaderboardEntry[]>;

  saveContact(msg: ContactMessage): Promise<void>;
  close(): Promise<void>;
}
