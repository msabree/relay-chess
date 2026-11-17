import { api } from './http';

export interface PublicPlayer {
  id: string;
  username: string;
  verified?: boolean;
}

export interface ProfileGame {
  roomId: string;
  at: string;
  gameType: string;
  reason: string;
  side: 'white' | 'black';
  outcome: 'win' | 'loss' | 'draw';
  team: string[];
  opponents: string[];
  /** final position, and the last move like "e2e4" */
  fen: string;
  lastMove?: string;
}

export interface Profile {
  player: PublicPlayer;
  record: { wins: number; losses: number; draws: number; games: number; capped: boolean };
  partners: { id: string; name: string; games: number; wins: number; verified?: boolean }[];
  games: ProfileGame[];
}

export const getProfile = (id: string, offset = 0, limit = 12) =>
  api.get<Profile>(`/players/${encodeURIComponent(id)}`, { params: { offset, limit } }).then((r) => r.data);

/** Accounts only. Empty strings clear a handle. */
