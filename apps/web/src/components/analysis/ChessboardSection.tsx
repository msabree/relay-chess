import dynamic from 'next/dynamic';
import { forwardRef } from 'react';
import { Chessboard } from 'react-chessboard';
import { Arrow, CustomSquareProps } from 'react-chessboard/dist/chessboard/types';
import { EvaluationBar } from '@/components/analysis/EvaluationBar';

const Check = dynamic(() => import('lucide-react').then(mod => mod.Check), { ssr: false });
const HelpCircle = dynamic(() => import('lucide-react').then(mod => mod.HelpCircle), { ssr: false });
const AlertTriangle = dynamic(() => import('lucide-react').then(mod => mod.AlertTriangle), { ssr: false });
const X = dynamic(() => import('lucide-react').then(mod => mod.X), { ssr: false });
const ChevronLeft = dynamic(() => import('lucide-react').then(mod => mod.ChevronLeft), { ssr: false });
const ChevronRight = dynamic(() => import('lucide-react').then(mod => mod.ChevronRight), { ssr: false });

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Timer from '@/components/Timer';

interface ChessboardSectionProps {
  position: string;
  orientation: 'black' | 'white';
  gameResult: string;
  blackTimer?: number;
  whiteTimer?: number;
  currentSquare?: string;
  feedback?: string;
  mate?: string;
  winPercent?: number;
  currentMoveIndex: number;
  totalMoves: number;
  onPreviousMove: () => void;
  onNextMove: () => void;
  createArrows: () => Arrow[];
}

export const ChessboardSection = ({
  position,
  orientation,
  gameResult,
  blackTimer,
  whiteTimer,
  currentSquare,
  feedback,
  mate,
  winPercent,
  currentMoveIndex,
  totalMoves,
  onPreviousMove,
  onNextMove,
  createArrows
}: ChessboardSectionProps) => {
  if (!position) return null;

  const isWhiteMove = currentMoveIndex % 2 !== 0;

  return (
    <div className="w-full lg:w-[40%] space-y-6">
      <Card className="glass-effect border border-line backdrop-blur-xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-fg text-center text-lg font-semibold">
            {gameResult}
          </CardTitle>
        </CardHeader>

        <CardContent>
          {(blackTimer && blackTimer !== 0) && (
            <div className="mb-4">
              <Timer timeRemaining={new Date(blackTimer * 1000).toISOString().substring(14, 19)} />
            </div>
          )}

          <Chessboard
            customDarkSquareStyle={{ backgroundColor: '#60688e' }}
            customLightSquareStyle={{ backgroundColor: '#d3d7ec' }}
            customBoardStyle={{ borderRadius: '8px', border: '1px solid #272D4D' }}
            boardOrientation={orientation}
            customArrows={createArrows()}
            position={position}
            customSquare={forwardRef<HTMLDivElement, CustomSquareProps>(
              function CustomSquare(props, ref) {
                const { children, square, style } = props;
                return (
                  <div ref={ref} style={{ ...style, position: 'relative' }}>
                    {children}
                    {square === currentSquare && (
                      <div className="absolute top-0 right-0 flex items-center justify-center h-3.5 w-3.5">
                        {(feedback === 'best' || feedback === 'good') && <Check className="h-3.5 w-3.5 text-success" />}
                        {(feedback === 'unexpected') && <HelpCircle className="h-3.5 w-3.5 text-fg-muted" />}
                        {(feedback === 'mistake') && <AlertTriangle className="h-3.5 w-3.5 text-accent-ink" />}
                        {(feedback === 'blunder') && <X className="h-3.5 w-3.5 text-danger" />}
                      </div>
                    )}
                  </div>
                );
              }
            )}
          />

          {/* Evaluation Bar */}
          {winPercent !== undefined && (
            <div className="mt-4">
              <EvaluationBar
                winPercent={winPercent}
                mate={mate}
                isWhiteMove={isWhiteMove}
              />
            </div>
          )}

          {(whiteTimer && whiteTimer !== 0) && (
            <div className="mt-4">
              <Timer timeRemaining={new Date(whiteTimer * 1000).toISOString().substring(14, 19)} />
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center mt-4">
            <Button
              variant="ghost"
              className="flex items-center space-x-2 text-fg-muted hover:text-accent-ink hover:bg-accent/10 glass-effect border border-line"
              onClick={onPreviousMove}
              disabled={currentMoveIndex === 0}
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="text-sm">{"Previous"}</span>
            </Button>

            <span className="text-fg-muted text-sm font-medium">
              {`Move ${currentMoveIndex + 1} of ${totalMoves}`}
            </span>

            <Button
              variant="ghost"
              className="flex items-center space-x-2 text-fg-muted hover:text-accent-ink hover:bg-accent/10 glass-effect border border-line"
              onClick={onNextMove}
              disabled={currentMoveIndex === totalMoves - 1}
            >
              <span className="text-sm">{"Next"}</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
