export type Color = 'w' | 'b';

export interface Player {
  id: string;
  name: string;
  connected: boolean;
}

export interface TimeControl {
  initialMs: number;
  incrementMs: number;
}

export type EndReason =
  | 'checkmate'
  | 'resign'
  | 'timeout'
  | 'stalemate'
  | 'insufficient-material'
  | 'threefold-repetition'
  | 'fifty-move-rule'
  | 'agreement'
  | 'abandoned'
  | 'aborted';

export interface Result {
  /** null for draws and aborted games */
  winner: Color | null;
  reason: EndReason;
  /** player who resigned or aborted, when relevant */
  by?: string;
}

export interface PlayedMove {
  from: string;
  to: string;
  promotion?: string;
  san: string;
  lan: string;
  color: Color;
  playerId: string;
  /** position after the move */
  fen: string;
  at: number;
}

/** waiting: seats can change. playing: starts with the first move. */
export type Status = 'waiting' | 'playing' | 'over';

export interface GameState {
  id: string;
  /** teams can be uneven; each needs at least one player to start */
  maxPerTeam: number;
  timeControl: TimeControl | null;
  status: Status;
  /** players in seat order; seat order is relay order */
  teams: Record<Color, Player[]>;
  moves: PlayedMove[];
  fen: string;
  /** remaining time per side, as of turnStartedAt */
  clocks: Record<Color, number> | null;
  turnStartedAt: number | null;
  /** seat index that plays the next move for each color */
  rotation: Record<Color, number>;
  drawOfferBy: Color | null;
  result: Result | null;
}

export type GameErrorCode =
  | 'not-waiting'
  | 'not-playing'
  | 'not-seated'
  | 'team-full'
  | 'teams-empty'
  | 'not-your-turn'
  | 'illegal-move'
  | 'cannot-abort';

export type Outcome = { ok: true; state: GameState } | { ok: false; error: GameErrorCode };

export interface MoveInput {
  from: string;
  to: string;
  promotion?: string;
}
