// =============================
// 🔹 Relay Chess Engine Helpers
// =============================

// Extracts numeric value after a keyword (e.g., "cp 53")
const getValueForKey = (infoString: string, key: string): string => {
  const match = infoString.match(new RegExp(`${key}\\s+(-?\\d+)`));
  return match ? match[1] : '';
};

// Converts Stockfish centipawns to win probability
const getWinPercent = (centipawns: number): number => {
  return 50 + 50 * (2 / (1 + Math.exp(-0.00368208 * centipawns)) - 1);
};

// Computes accuracy based on change in win probability
export const getAccuracyPercent = (before: number, after: number): number => {
  const raw = 103.1668 * Math.exp(-0.04354 * (before - after)) - 3.1669;
  const accuracy = Math.max(0, Math.min(raw, 100));
  return Math.round(accuracy * 100) / 100; // round to 2 decimals
};

// Feedback tiers (more chess-realistic)
export const getMoveFeedback = (accuracy: number): string => {
  if (accuracy >= 98) return 'best';
  if (accuracy >= 85) return 'good';
  if (accuracy >= 70) return 'inaccuracy';
  if (accuracy >= 45) return 'mistake';
  return 'blunder';
};

// =============================
// 🔹 Default Opening Analysis
// =============================
export const OPENING_FEN_ANALYSIS = {
  depth: 18,
  multipv: 1,
  mate: '',
  bestMove: 'e2e4',
  centipawns: '53',
  winPercent: '54.86',
  accuracyPercent: '99.9999',
  feedback: 'best',
};

// =============================
// 🔹 Core Analysis Logic
// =============================
export interface MoveObject {
  fen: string;
  analysis?: Analysis;
}

export interface Analysis {
  depth: number;
  multipv: number;
  mate: string | number;
  bestMove: string;
  centipawns: string | number;
  winPercent: string | number;
  accuracyPercent: string | number;
  feedback: string;
}

export const analyzeGame = (moveObject: MoveObject, worker: Worker, depth = 18): Promise<MoveObject> => {
  const moveClone = { ...moveObject };

  return new Promise((resolve) => {
    const analysis: Analysis = {
      depth,
      multipv: 1,
      mate: '',
      bestMove: '',
      centipawns: '',
      winPercent: '',
      accuracyPercent: '',
      feedback: '',
    };

    let lastInfo = '';

    const handleMessage = (event: MessageEvent) => {
      const data = event.data;

      if (typeof data === 'string') {
        if (data.includes('info') && data.includes('depth')) {
          lastInfo = data;
        }

        if (data.startsWith('bestmove')) {
          const info = lastInfo;
          const bestMove = data.split(' ')[1] || '';
          const cpStr = getValueForKey(info, 'cp');
          const mate = getValueForKey(info, 'mate');
          const centipawns = cpStr ? parseInt(cpStr, 10) : 0;
          const winPercent = cpStr === '' ? 100 : getWinPercent(centipawns);

          analysis.bestMove = bestMove;
          analysis.mate = mate;
          analysis.centipawns = cpStr;
          analysis.winPercent = winPercent.toFixed(2);
          analysis.feedback = getMoveFeedback(100); // placeholder if you later add accuracy calc
          moveClone.analysis = analysis;

          // cleanup to avoid memory leak
          worker.removeEventListener('message', handleMessage);
          resolve(moveClone);
        }
      }
    };

    worker.addEventListener('message', handleMessage);

    // Run Stockfish commands
    worker.postMessage('ucinewgame');
    worker.postMessage(`position fen ${moveClone.fen}`);
    worker.postMessage(`go depth ${depth}`);
  });
};
