/** One move in the `gameHistory` shape the analysis page reads. */
export interface HistoryMove {
  move: string;
  sanMove: string;
  lanMove: string;
  userId: string;
  username: string;
  fen: string;
}

/** A finished game, kept for 30 days so review links work. */
export interface GameRecord {
  roomId: string;
  gameType: 'blitz' | 'rapid' | 'classic' | 'untimed';
  /** coarse result */
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

export type Period = 'daily' | 'weekly';

/** A player's score for one day or one week. Expires on its own. */
export interface Score {
  period: Period;
  /** bucket key, e.g. "2026-10-02" or "2026-W40" */
  key: string;
  userId: string;
  name: string;
  wins: number;
  losses: number;
  draws: number;
  /** when the database may delete it */
  expiresAt: Date;
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

  saveGame(game: GameRecord): Promise<void>;
  getGame(roomId: string): Promise<GameRecord | null>;
  setAnalysis(roomId: string, analysis: unknown): Promise<void>;

  /** Add one result to a player's score for a period, creating it if needed. */
  addScore(s: Omit<Score, 'wins' | 'losses' | 'draws'> & { outcome: 'win' | 'loss' | 'draw' }): Promise<void>;
  /** Every score in one bucket; small enough to rank in memory. */
  listScores(period: Period, key: string): Promise<Score[]>;

  saveContact(msg: ContactMessage): Promise<void>;
  close(): Promise<void>;
}
