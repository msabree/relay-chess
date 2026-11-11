import { Chess } from 'chess.js';

/**
 * Game review: run Stockfish over every position, then score each move.
 * Win% is always 0..100. Stored per position from the side to move's view,
 * which is what Stockfish reports; helpers below convert to White's view.
 */

export const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
/** Stockfish's view of the start position (White to move), so we don't spend time on it. */
const START = { winPercent: 54.86, bestMove: 'e2e4' };

export type Feedback = 'best' | 'good' | 'inaccuracy' | 'mistake' | 'blunder';

/** One move from the stored game record. */
export interface RecordMove {
  sanMove?: string;
  move?: string;
  lanMove?: string;
  userId: string;
  username?: string;
  fen: string;
}

/** Stored analysis, one per move, for the position after that move. */
export interface AnalyzedMove extends RecordMove {
  analysis: {
    bestMove: string;
    mate: string | number;
    centipawns: string | number;
    winPercent: string | number;
    accuracyPercent: string | number;
    feedback: string;
  };
}

export interface GameRecord {
  roomId: string;
  reason?: string;
  result?: string;
  winningColor: 'white' | 'black' | null;
  whiteTeam?: { id: string; name: string }[];
  blackTeam?: { id: string; name: string }[];
  whiteTeamUserIds: string[];
  blackTeamUserIds: string[];
  gameHistory: RecordMove[];
  analysis?: AnalyzedMove[];
}

// ---- engine ----

/** Win% for the side to move, from Stockfish's centipawns. */
const winFromCp = (cp: number) => 50 + 50 * (2 / (1 + Math.exp(-0.00368208 * cp)) - 1);

interface Eval {
  bestMove: string;
  cp: string;
  mate: string;
  winPercent: number;
}

const read = (info: string, key: string) => info.match(new RegExp(` ${key} (-?\\d+)`))?.[1] ?? '';

/** Evaluate one position. Mate scores count as 100% (we mate) or 0% (we get mated). */
function evaluate(worker: Worker, fen: string, depth: number): Promise<Eval> {
  return new Promise((resolve) => {
    let last = '';
    const onMessage = (e: MessageEvent) => {
      const line = typeof e.data === 'string' ? e.data : '';
      if (line.startsWith('info') && line.includes(' score ')) last = line;
      if (!line.startsWith('bestmove')) return;
      worker.removeEventListener('message', onMessage);
      const best = line.split(' ')[1] ?? '';
      const cp = read(last, 'cp');
      const mate = read(last, 'mate');
      const winPercent = mate !== '' ? (Number(mate) > 0 ? 100 : 0) : winFromCp(Number(cp || 0));
      resolve({ bestMove: best === '(none)' ? '' : best, cp, mate, winPercent });
    };
    worker.addEventListener('message', onMessage);
    worker.postMessage(`position fen ${fen}`);
    worker.postMessage(`go depth ${depth}`);
  });
}

/**
 * Analyze a whole game in the browser. Calls onProgress with 0..1.
 * Throws 'aborted' if the signal fires (e.g. the page closed).
 */
export async function analyzeGame(
  moves: RecordMove[],
  opts: { depth?: number; onProgress?: (_p: number) => void; signal?: AbortSignal } = {},
): Promise<AnalyzedMove[]> {
  const worker = new Worker('/stockfishEngine.js');
  const abort = () => worker.terminate();
  opts.signal?.addEventListener('abort', abort);
  try {
    worker.postMessage('uci');
    worker.postMessage('ucinewgame');
    const evals: Eval[] = [];
    for (let i = 0; i < moves.length; i++) {
      if (opts.signal?.aborted) throw new Error('aborted');
      evals.push(await evaluate(worker, moves[i]!.fen, opts.depth ?? 12));
      opts.onProgress?.((i + 1) / moves.length);
    }
    return score(moves, evals);
  } finally {
    opts.signal?.removeEventListener('abort', abort);
    worker.terminate();
  }
}

// ---- scoring ----

/** How close a move kept the mover to their best chance (lichess's formula). */
export const accuracy = (before: number, after: number) =>
  Math.max(0, Math.min(100, 103.1668 * Math.exp(-0.04354 * (before - after)) - 3.1669));

export const feedbackFor = (acc: number): Feedback =>
  acc >= 98 ? 'best' : acc >= 85 ? 'good' : acc >= 70 ? 'inaccuracy' : acc >= 45 ? 'mistake' : 'blunder';

/** Turn raw evals (position after each move) into stored analysis with accuracy and feedback. */
export function score(moves: RecordMove[], evals: Eval[]): AnalyzedMove[] {
  return moves.map((m, i) => {
    const prev = i === 0 ? START : evals[i - 1]!;
    const e = evals[i]!;
    const before = prev.winPercent; // mover to move
    const after = 100 - e.winPercent; // opponent to move now
    const acc = accuracy(before, after);
    const fb: Feedback = prev.bestMove && prev.bestMove === m.lanMove ? 'best' : feedbackFor(acc);
    return {
      ...m,
      analysis: {
        bestMove: e.bestMove,
        mate: e.mate,
        centipawns: e.cp,
        winPercent: Math.round(e.winPercent * 100) / 100,
        accuracyPercent: Math.round(acc * 100) / 100,
        feedback: fb,
      },
    };
  });
}

/** True when stored analysis lines up with the game (older saves may not). */
export const hasAnalysis = (g: GameRecord) =>
  Array.isArray(g.analysis) && g.analysis.length > 0 && g.analysis.length === g.gameHistory.length;

// ---- review view ----

export interface ReviewMove {
  index: number;
  san: string;
  color: 'w' | 'b';
  playerId: string;
  /** win% for White after this move */
  white: number;
  accuracy: number;
  feedback: Feedback;
  /** how much the mover's win% dropped, in points */
  drop: number;
  /** better move in SAN, when this one wasn't the best */
  better: string;
  /** that better move as squares, for the arrow */
  betterFrom: string;
  betterTo: string;
}

export interface ReviewPlayer {
  id: string;
  name: string;
  color: 'w' | 'b';
  moves: number;
  accuracy: number;
  blunders: number;
}

export interface Review {
  moves: ReviewMove[];
  players: ReviewPlayer[];
  /** most accurate player, if anyone played enough moves */
  carry: ReviewPlayer | null;
  /** the single worst move of the game, if there was a real mistake */
  oops: ReviewMove | null;
}

const toNum = (v: string | number | undefined) => (v === '' || v === undefined ? NaN : Number(v));

/** Everything the review page shows, from a record that has analysis. */
export function buildReview(g: GameRecord): Review {
  const analysis = g.analysis ?? [];
  const moves: ReviewMove[] = analysis.map((a, i) => {
    const color: 'w' | 'b' = i % 2 === 0 ? 'w' : 'b';
    const stm = toNum(a.analysis.winPercent); // side to move = the other color
    const white = color === 'w' ? 100 - stm : stm;
    const prevFen = i === 0 ? START_FEN : analysis[i - 1]!.fen;
    const prevBest = i === 0 ? START.bestMove : analysis[i - 1]!.analysis.bestMove;
    const prevStm = i === 0 ? START.winPercent : toNum(analysis[i - 1]!.analysis.winPercent);
    const acc = toNum(a.analysis.accuracyPercent);
    const feedback = (['best', 'good', 'inaccuracy', 'mistake', 'blunder'] as const).includes(a.analysis.feedback as Feedback)
      ? (a.analysis.feedback as Feedback)
      : feedbackFor(acc);
    let better = '';
    if (prevBest && prevBest !== a.lanMove && feedback !== 'best' && feedback !== 'good') {
      try {
        better = new Chess(prevFen).move({ from: prevBest.slice(0, 2), to: prevBest.slice(2, 4), promotion: prevBest[4] ?? 'q' }).san;
      } catch {
        better = '';
      }
    }
    return {
      index: i,
      san: a.sanMove ?? a.move ?? '',
      color,
      playerId: a.userId,
      white: Number.isFinite(white) ? white : 50,
      accuracy: Number.isFinite(acc) ? acc : 100,
      feedback,
      drop: Number.isFinite(prevStm) && Number.isFinite(stm) ? Math.max(0, prevStm - (100 - stm)) : 0,
      better,
      betterFrom: better ? prevBest.slice(0, 2) : '',
      betterTo: better ? prevBest.slice(2, 4) : '',
    };
  });

  const roster = [
    ...(g.whiteTeam ?? g.whiteTeamUserIds.map((id) => ({ id, name: '' }))).map((p) => ({ ...p, color: 'w' as const })),
    ...(g.blackTeam ?? g.blackTeamUserIds.map((id) => ({ id, name: '' }))).map((p) => ({ ...p, color: 'b' as const })),
  ];
  const players: ReviewPlayer[] = roster.map((p) => {
    const mine = moves.filter((m) => m.playerId === p.id);
    const name = p.name || g.gameHistory.find((m) => m.userId === p.id)?.username || 'Player';
    return {
      id: p.id,
      name,
      color: p.color,
      moves: mine.length,
      accuracy: mine.length ? Math.round(mine.reduce((s, m) => s + m.accuracy, 0) / mine.length) : 0,
      blunders: mine.filter((m) => m.feedback === 'blunder').length,
    };
  });

  // Needs a few moves to count, otherwise one lucky move wins it.
  const eligible = players.filter((p) => p.moves >= Math.min(3, Math.max(1, Math.floor(moves.length / players.length))));
  const carry = eligible.length > 1 ? eligible.reduce((a, b) => (b.accuracy > a.accuracy ? b : a)) : null;
  const worst = moves.reduce<ReviewMove | null>((a, m) => (!a || m.drop > a.drop ? m : a), null);
  const oops = worst && (worst.feedback === 'blunder' || worst.feedback === 'mistake') ? worst : null;

  return { moves, players, carry, oops };
}
