import { useMemo } from 'react';
interface MoveAnalysis {
  analysis?: {
    feedback?: 'best' | 'good' | 'unexpected' | 'mistake' | 'blunder' | '';
    winPercent?: number;
    mate?: string;
  };
}

interface UseAnalysisFormattingProps {
  analysis: MoveAnalysis[] | undefined;
  currentMoveIndex: number;
}

export const useAnalysisFormatting = ({
  analysis,
  currentMoveIndex
}: UseAnalysisFormattingProps) => {
  const moveMessage = useMemo(() => {
    if (!analysis || !analysis[currentMoveIndex]) return '';

    const currentMove = analysis[currentMoveIndex];
    const feedback = currentMove?.analysis?.feedback ?? '';

    if (feedback === 'best' && currentMoveIndex === 0) {
      return "This is the recommended opening.";
    }
    if (feedback === 'best') {
      return "This is the recommended move.";
    }
    if (feedback === 'good') {
      return "This is a good move.";
    }
    if (feedback === 'unexpected') {
      return "Inaccurate move.";
    }
    if (feedback === 'mistake') {
      return "This is a mistake.";
    }
    if (feedback === 'blunder') {
      return "This is a blunder!";
    }

    return '';
  }, [analysis, currentMoveIndex]);

  const winPercentage = useMemo(() => {
    if (!analysis || !analysis[currentMoveIndex]) return '50%';

    const currentMove = analysis[currentMoveIndex];
    const winPercent = currentMove?.analysis?.winPercent ?? 50;
    const mate = currentMove?.analysis?.mate;

    let winPercentWhite = currentMoveIndex % 2 === 0 ? 100 - winPercent : winPercent;
    const isWhiteMove = currentMoveIndex % 2 !== 0;
    const currentlyLosing = parseInt(mate ?? '0') < 0;

    if (isWhiteMove && currentlyLosing) {
      winPercentWhite = 0;
    } else if (!isWhiteMove && currentlyLosing) {
      winPercentWhite = 100;
    }

    const percent = parseInt(winPercentWhite.toString());
    const blackPercent = parseInt((100 - winPercentWhite).toString());
    return winPercentWhite > 50
      ? `White win ${percent}%`
      : `Black win ${blackPercent}%`;
  }, [analysis, currentMoveIndex]);

  const getMateInfo = useMemo(() => {
    if (!analysis || !analysis[currentMoveIndex]) return null;

    const mate = analysis[currentMoveIndex]?.analysis?.mate;
    if (!mate || mate === '' || mate === '0') return null;

    return {
      moves: Math.abs(parseInt(mate)),
      isWinning: parseInt(mate) > 0
    };
  }, [analysis, currentMoveIndex]);

  const getCurrentMoveData = useMemo(() => {
    if (!analysis || !analysis[currentMoveIndex]) return null;

    return analysis[currentMoveIndex];
  }, [analysis, currentMoveIndex]);

  return {
    moveMessage,
    winPercentage,
    mateInfo: getMateInfo,
    currentMoveData: getCurrentMoveData
  };
};
