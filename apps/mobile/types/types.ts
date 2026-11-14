export type TEAM_COLOR = 'w' | 'b';

/** A player as the game screen shows them. */
export interface TeamMember {
  id: string;
  username: string;
  online: boolean;
  color: TEAM_COLOR;
  isMove: boolean;
}

export interface Spectator {
  id: string;
  username: string;
  online: boolean;
}

export interface TeamInRoom {
  id: string;
  name: string;
  usersInRoom: TeamMember[];
  lastMovedUserId: string;
  captured: string[];
  promotion: string[];
}

export interface ChatMessage {
  id: string;
  message: string;
  userId: string;
  username: string;
}

export interface UserProfile {
  _id: string;
  username: string;
}

export interface GameMove {
  move: string;
  userId: string;
  username?: string;
  lanMove?: string;
  sanMove?: string;
  fen?: string;
}

export type APIError = unknown;

export interface LeaderboardRow {
  _rank: number;
  userId: string;
  username: string;
  wins: number;
  losses: number;
  draws: number;
  gamesPlayed: number;
}

export interface Leaderboard {
  total: number;
  page: number;
  rows: LeaderboardRow[];
  period: 'daily' | 'weekly';
  /** ISO time when this board resets */
  resetsAt: string;
}

export interface UserPosition {
  rank: number;
  user: LeaderboardRow;
}
