/** One move in the `gameHistory` shape the analysis page reads. */
export interface HistoryMove {
  move: string;
  sanMove: string;
  lanMove: string;
  userId: string;
  username: string;
  fen: string;
}

/** A finished game. Kept forever so review links work and games can be counted. */
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

/**
 * A banner document, as you'd write it in the `announcements` collection:
 *   { text: "We're live on Product Hunt", link: "https://...", linkText: "Upvote us",
 *     tone: "info", active: true, startsAt: ISODate(...), endsAt: ISODate(...), order: 0 }
 * Only text and active are required. Live = active and inside startsAt/endsAt (when set).
 */
export interface AnnouncementDoc {
  text: string;
  link?: string;
  linkText?: string;
  tone?: 'info' | 'warning';
  active: boolean;
  startsAt?: Date | null;
  endsAt?: Date | null;
  /** lower shows first */
  order?: number;
}

export interface Store {
  readonly kind: 'memory' | 'mongo';
  /** The Mongo database, when there is one. Accounts live in it too. */
  readonly db?: import('mongodb').Db;

  saveGame(game: GameRecord): Promise<void>;
  getGame(roomId: string): Promise<GameRecord | null>;
  setAnalysis(roomId: string, analysis: unknown): Promise<void>;
  /** How many finished games are stored. May be approximate; must be cheap. */
  countGames(): Promise<number>;

  /** Add one result to a player's score for a period, creating it if needed. */
  addScore(s: Omit<Score, 'wins' | 'losses' | 'draws'> & { outcome: 'win' | 'loss' | 'draw' }): Promise<void>;
  /** Every score in one bucket; small enough to rank in memory. */
  listScores(period: Period, key: string): Promise<Score[]>;

  saveContact(msg: ContactMessage): Promise<void>;
  /** "Tell me when Plus launches". One entry per email (lower case); repeats are ignored. */
  joinPlusWaitlist(email: string, playerId?: string): Promise<void>;
  /** Newest finished games any of these players were in. */
  gamesFor(userIds: string[], limit: number): Promise<GameRecord[]>;
  /** Live banners right now, in order. */
  liveAnnouncements(now: Date): Promise<(AnnouncementDoc & { id: string })[]>;

  /**
   * Player ids of deleted accounts. Their games stay (for the totals), but
   * their tokens stop working and their profile is gone for good.
   */
  retirePlayers(ids: string[]): Promise<void>;
  retiredPlayers(): Promise<string[]>;
  /** Usernames of deleted accounts (lower case): nobody can take them again. */
  retireName(key: string): Promise<void>;
  retiredNames(): Promise<string[]>;
  /** Take these players off the leaderboards. */
  deleteScores(userIds: string[]): Promise<void>;
  close(): Promise<void>;
}
