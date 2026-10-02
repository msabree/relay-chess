/* eslint-disable react/display-name */
import { ErrorInfo, useEffect, useState, useMemo, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { Arrow } from 'react-chessboard/dist/chessboard/types';

import { useGame } from '@/hooks/useGame';
import NavigationBar from '@/components/NavigationBar';
import { MoveObject, OPENING_FEN_ANALYSIS, analyzeGame, getAccuracyPercent, getMoveFeedback } from '@/utils/stockfish';
import { saveAnalysis } from '@/apis/games';
import { ErrorBoundary } from 'react-error-boundary';
import { Button } from '@/components/ui/button';
import { useUser } from '@/hooks/useUser';
import { useAnalysisFormatting } from '@/hooks/useAnalysisFormatting';

import { ChessboardSection } from '@/components/analysis/ChessboardSection';
import { AnalysisSection } from '@/components/analysis/AnalysisSection';

function AnalysisErrorFallback() {
  return (
    <div className='flex flex-col items-center text-fg mt-20'>
      <div className='mb-5'>Something went wrong. Our dev team has been notified. Try reloading this page or go to the home page.</div>
      <Button className='mb-5' onClick={() => window.location.href = 'https://relaychess.com'}>{"Home"}</Button>
      <Button onClick={() => window.location.reload()}>{"Reload Site"}</Button>
    </div>
  );
}

export default function GameAnalysis() {
  const roomId = usePathname()?.split('analysis/')[1] ?? '';
  const query = useGame(roomId);
  const { data, refetch } = query;
  const userQuery = useUser();
  const [analysisRunning, setAnalysisRunning] = useState<boolean>(false);
  const [analysisProgress, setAnalysisProgress] = useState<number>(0);
  const [copiedShareLink, setCopiedShareLink] = useState<boolean>(false);
  const [currentMoveIndex, setCurrentMoveIndex] = useState<number>(0);
  const userId = userQuery.data?._id ?? '';
  const [orientation] = useState<'black' | 'white'>('white');

  // Use useMemo for FEN derivation
  const currentFen = useMemo(() => {
    if (data?.analysis?.[currentMoveIndex]?.fen) {
      return data.analysis[currentMoveIndex].fen;
    }
    // Return ending FEN if no analysis yet
    return data?.analysis?.[data.analysis.length - 1]?.fen ?? '';
  }, [data?.analysis, currentMoveIndex]);

  // Use formatting hook
  const { moveMessage, winPercentage } = useAnalysisFormatting({
    analysis: data?.analysis,
    currentMoveIndex
  });

  useEffect(() => {
    return () => {
      // no-op
    };
  }, []);

  // Reset to first move when analysis loads
  useEffect(() => {
    if (data?.analysis?.[0]?.fen) {
      setCurrentMoveIndex(0);
    }
  }, [data?.analysis]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't navigate if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (currentMoveIndex > 0) {
          setCurrentMoveIndex(currentMoveIndex - 1);
        }
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (currentMoveIndex < (data?.gameHistory?.length ?? 0) - 1) {
          setCurrentMoveIndex(currentMoveIndex + 1);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentMoveIndex, data?.gameHistory?.length]);

  const getMove = useCallback((index: number) => {
    return data?.analysis?.[index];
  }, [data?.analysis]);

  const getGameResult = useCallback(() => {
    const winningColor = data?.winningColor === 'white' ? "White" : "Black";

    if (data?.result === 'draw') {
      return "Game ended in a draw";
    }
    else if (data?.result === 'resign') {
      return `${winningColor} won by resignation`;
    }
    else if (data?.result === 'timeout') {
      return `${winningColor} won by timeout`;
    }
    else if (data?.result === 'checkmate') {
      return `${winningColor} won by checkmate`;
    }
    return '';
  }, [data?.result, data?.winningColor]);

  const createArrows = useCallback((): Arrow[] => {
    const currentMove = getMove(currentMoveIndex);
    const previousMove = getMove(currentMoveIndex - 1);

    const currentBestMove = currentMove?.analysis?.bestMove ?? '';
    const previousBestMove = previousMove?.analysis?.bestMove ?? '';

    const outputArrows: Arrow[] = [];

    if (currentBestMove.length === 4) {
      const from = currentBestMove.substring(0, 2);
      const to = currentBestMove.substring(2, 4);
      outputArrows.push([from, to, 'green'] as Arrow);
    }

    if (previousMove && previousBestMove.length === 4 && previousBestMove !== currentMove?.lanMove) {
      const from = previousBestMove.substring(0, 2);
      const to = previousBestMove.substring(2, 4);
      outputArrows.push([from, to, 'red'] as Arrow);
    }

    return outputArrows;
  }, [currentMoveIndex, getMove]);

  const runAnalysis = async () => {
    if (!data) return;
    setAnalysisRunning(true);
    setAnalysisProgress(0);
    const analysisResponses: any[] = [];
    const worker = new window.Worker('/stockfishEngine.js');
    const totalMoves = (data?.gameHistory ?? []).length;

    try {
      for (let i = 0; i < totalMoves; i++) {
        const localAnalysisResponses = await analyzeGame(data.gameHistory[i] as MoveObject, worker);
        analysisResponses.push(localAnalysisResponses);
        setAnalysisProgress(((i + 1) / totalMoves) * 100);
      }

      // Calculate accuracy after analysis
      for (let i = 0; i < analysisResponses.length; i++) {
        const newWinPercent = 100 - analysisResponses[i].analysis.winPercent;
        const previousWinPercent = i === 0 ? OPENING_FEN_ANALYSIS.winPercent : analysisResponses[i - 1].analysis.winPercent;
        analysisResponses[i].analysis.accuracyPercent = getAccuracyPercent(previousWinPercent, newWinPercent);

        const bestMove = i === 0 ? OPENING_FEN_ANALYSIS.bestMove : analysisResponses[i - 1].analysis.bestMove;
        const wasBestMove = bestMove === analysisResponses[i].lanMove;
        analysisResponses[i].analysis.feedback = wasBestMove ? 'best' : getMoveFeedback(analysisResponses[i].analysis.accuracyPercent);
      }

      await saveAnalysis(roomId, analysisResponses);
      refetch();
    } catch (err) {
      console.error('Analysis error:', err);
    } finally {
      setAnalysisRunning(false);
      setAnalysisProgress(0);
      worker.terminate();
    }
  };

  // Derived values
  const whiteTimer = data?.gameHistory[currentMoveIndex]?.whiteTimeLeft;
  const blackTimer = data?.gameHistory[currentMoveIndex]?.blackTimeLeft;
  const winPercent = data?.analysis?.[currentMoveIndex]?.analysis.winPercent ?? 50;
  const mate = data?.analysis?.[currentMoveIndex]?.analysis.mate;
  const currentSquare = data?.gameHistory[currentMoveIndex]?.sanMove?.slice(-2);
  const feedback = data?.analysis?.[currentMoveIndex]?.analysis.feedback ?? '';

  const handlePreviousMove = useCallback(() => {
    if (currentMoveIndex > 0) {
      setCurrentMoveIndex(currentMoveIndex - 1);
    }
  }, [currentMoveIndex]);

  const handleNextMove = useCallback(() => {
    if (currentMoveIndex < (data?.gameHistory?.length ?? 0) - 1) {
      setCurrentMoveIndex(currentMoveIndex + 1);
    }
  }, [currentMoveIndex, data?.gameHistory?.length]);


  const handleCopyShareLink = useCallback(() => {
    navigator.clipboard.writeText(window.location.href ?? '');
    setCopiedShareLink(true);
    setTimeout(() => setCopiedShareLink(false), 2000);
  }, []);

  return (
    <>
      <NavigationBar />
      <main className="min-h-screen py-8">
        <ErrorBoundary fallback={<AnalysisErrorFallback />} onError={(error: unknown, info: ErrorInfo) => {
          console.error('analysis page crashed', error, info);
        }}>
          <div className="container mx-auto px-4">
            <div className="flex flex-col lg:flex-row gap-8">
              <ChessboardSection
                position={currentFen}
                orientation={orientation}
                gameResult={getGameResult()}
                blackTimer={blackTimer}
                whiteTimer={whiteTimer}
                currentSquare={currentSquare}
                feedback={feedback}
                mate={mate}
                winPercent={winPercent}
                currentMoveIndex={currentMoveIndex}
                totalMoves={data?.gameHistory?.length ?? 0}
                onPreviousMove={handlePreviousMove}
                onNextMove={handleNextMove}
                createArrows={createArrows}
              />

              {data && (
                <AnalysisSection
                  data={data}
                  analysisRunning={analysisRunning}
                  analysisProgress={analysisProgress}
                  copiedShareLink={copiedShareLink}
                  currentMoveIndex={currentMoveIndex}
                  moveMessage={moveMessage}
                  winPercentage={winPercentage}
                  mate={mate ?? ''}
                  feedback={feedback}
                  roomId={roomId}
                  onRunAnalysis={runAnalysis}
                  onCopyShareLink={handleCopyShareLink}
                />
              )}
            </div>
          </div>
        </ErrorBoundary>
      </main>
    </>
  );
}
