import { accuracy, buildReview, feedbackFor, score, type GameRecord, type RecordMove } from '@/lib/analysis';

// 1. e4 (A) e5 (C) 2. Qh5 (B) Ke7?? (D) 3. Qxe5#
const fens = [
  'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1',
  'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2',
  'rnbqkbnr/pppp1ppp/8/4p2Q/4P3/8/PPPP1PPP/RNB1KBNR b KQkq - 1 2',
  'rnbq1bnr/ppppkppp/8/4p2Q/4P3/8/PPPP1PPP/RNB1KBNR w - - 2 3',
  'rnbq1bnr/ppppkppp/8/4Q3/4P3/8/PPPP1PPP/RNB1KBNR b - - 0 3',
];
const moves: RecordMove[] = [
  { sanMove: 'e4', lanMove: 'e2e4', userId: 'a', fen: fens[0]! },
  { sanMove: 'e5', lanMove: 'e7e5', userId: 'c', fen: fens[1]! },
  { sanMove: 'Qh5', lanMove: 'd1h5', userId: 'b', fen: fens[2]! },
  { sanMove: 'Ke7', lanMove: 'e8e7', userId: 'd', fen: fens[3]! },
  { sanMove: 'Qxe5#', lanMove: 'h5e5', userId: 'a', fen: fens[4]! },
];
// Win% for the side to move after each move, as Stockfish would report it.
const evals = [
  { bestMove: 'e7e5', cp: '-40', mate: '', winPercent: 46 },
  { bestMove: 'g1f3', cp: '40', mate: '', winPercent: 54 },
  { bestMove: 'b8c6', cp: '-60', mate: '', winPercent: 45 },
  { bestMove: 'h5e5', cp: '', mate: '1', winPercent: 100 },
  { bestMove: '', cp: '', mate: '0', winPercent: 0 },
];

const game = (analysis = score(moves, evals)): GameRecord => ({
  roomId: 'r',
  reason: 'checkmate',
  winningColor: 'white',
  whiteTeam: [{ id: 'a', name: 'Ann' }, { id: 'b', name: 'Bo' }],
  blackTeam: [{ id: 'c', name: 'Cy' }, { id: 'd', name: 'Di' }],
  whiteTeamUserIds: ['a', 'b'],
  blackTeamUserIds: ['c', 'd'],
  gameHistory: moves,
  analysis,
});

describe('scoring', () => {
  it('accuracy is 100 when nothing is lost and falls as win% drops', () => {
    expect(accuracy(50, 50)).toBeCloseTo(100, 0);
    expect(accuracy(50, 40)).toBeLessThan(70);
    expect(feedbackFor(99)).toBe('best');
    expect(feedbackFor(10)).toBe('blunder');
  });

  it('marks the engine move as best and a mate-allowing move as a blunder', () => {
    const a = score(moves, evals);
    expect(a[0]!.analysis.feedback).toBe('best'); // e4 is the book move
    expect(a[1]!.analysis.feedback).toBe('best'); // engine wanted e5
    expect(a[3]!.analysis.feedback).toBe('blunder'); // Ke7 walks into mate
    expect(a[4]!.analysis.feedback).toBe('best'); // the mate itself
  });
});

describe('review', () => {
  it('names the blunder, the better move, and who carried', () => {
    const r = buildReview(game());
    expect(r.oops?.san).toBe('Ke7');
    expect(r.oops?.playerId).toBe('d');
    expect(r.moves[3]!.better).toBe('Nc6');
    expect([r.moves[3]!.betterFrom, r.moves[3]!.betterTo]).toEqual(['b8', 'c6']);
    expect(r.moves[4]!.white).toBe(100); // mated side to move: White is winning
    expect(r.players.find((p) => p.id === 'd')).toMatchObject({ name: 'Di', moves: 1, blunders: 1 });
    expect(r.carry?.color).toBe('w');
  });

  it('no awards when nobody slipped and there is only one player', () => {
    const solo = { ...game(), whiteTeam: [{ id: 'a', name: 'Ann' }], blackTeam: [], whiteTeamUserIds: ['a'], blackTeamUserIds: [] };
    const r = buildReview({ ...solo, gameHistory: moves.slice(0, 1), analysis: score(moves.slice(0, 1), evals.slice(0, 1)) });
    expect(r.carry).toBeNull();
    expect(r.oops).toBeNull();
  });
});
