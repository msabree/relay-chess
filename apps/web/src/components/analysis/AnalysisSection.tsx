import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Spinner } from '@/components/analysis/Spinner';
import { MoveBadge } from '@/components/analysis/MoveBadge';
import { GameMomentumGraph } from '@/components/analysis/GameMomentumGraph';
import { SynergyMetrics } from '@/components/analysis/SynergyMetrics';
const ClipboardCheck = dynamic(() => import('lucide-react').then(mod => mod.ClipboardCheck), { ssr: false });
const Share = dynamic(() => import('lucide-react').then(mod => mod.Share), { ssr: false });
const Brain = dynamic(() => import('lucide-react').then(mod => mod.Brain), { ssr: false });

interface AnalysisSectionProps {
  data: any;
  analysisRunning: boolean;
  analysisProgress?: number;
  copiedShareLink: boolean;
  currentMoveIndex: number;
  moveMessage: string;
  winPercentage: string;
  mate: string;
  feedback: string;
  roomId: string;
  onRunAnalysis: () => void;
  onCopyShareLink: () => void;
}

export const AnalysisSection = ({
  data,
  analysisRunning,
  analysisProgress,
  copiedShareLink,
  currentMoveIndex,
  moveMessage,
  winPercentage,
  mate,
  feedback,
  roomId,
  onRunAnalysis,
  onCopyShareLink
}: AnalysisSectionProps) => {
  const currentMove = data?.analysis?.[currentMoveIndex];
  const hasAnalysis = data?.analysis && data.analysis.length > 0;

  // Calculate team accuracy for header
  const calculateTeamAccuracy = () => {
    if (!data?.analysis || !data?.whiteTeamUserIds || !data?.blackTeamUserIds) return 0;
    
    const allMoves = data.analysis;
    const totalAccuracy = allMoves.reduce((sum: number, move: any) => {
      return sum + (move.analysis?.accuracyPercent || 0);
    }, 0);
    
    return allMoves.length > 0 ? Math.round(totalAccuracy / allMoves.length) : 0;
  };

  const teamAccuracy = calculateTeamAccuracy();

  return (
    <div className="w-full lg:w-[60%] space-y-6">
      {/* Sleek 2025 Header */}
      {hasAnalysis && (
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-gray-900 to-black p-1">
          {/* The "Glow" background */}
          <div className="absolute -top-24 -left-24 h-48 w-48 bg-accent/20 blur-[80px] animate-pulse" />
          <div className="absolute -bottom-24 -right-24 h-48 w-48 bg-purple-500/20 blur-[80px] animate-pulse" style={{ animationDelay: '1s' }} />
          
          <div className="relative bg-surface rounded-[22px] p-6 border border-line">
            <div className="flex justify-between items-end mb-6">
              <div>
                <h2 className="text-2xl font-black italic tracking-tighter text-fg mb-1">{"GAME REVIEW"}</h2>
                <p className="text-fg/40 text-xs font-medium tracking-widest uppercase">{`Room: ${roomId.slice(0, 8)}`}</p>
              </div>
              <div className="text-right">
                <div className="text-xs font-bold text-accent-ink uppercase tracking-widest mb-1">{"Team Accuracy"}</div>
                <div className="text-3xl font-black text-fg italic">{teamAccuracy}%</div>
              </div>
            </div>
            
            {/* Animated Progress Bar for analysis */}
            {analysisRunning && (
              <div className="w-full bg-fg/5 h-1.5 rounded-full overflow-hidden mb-4">
                <div 
                  className="h-full bg-accent transition-all duration-300 shadow-[0_0_10px_#FFC800]"
                  style={{ width: `${analysisProgress || 0}%` }}
                />
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-3">
              <Button 
                onClick={onCopyShareLink} 
                variant="ghost"
                className="bg-fg/10 hover:bg-fg/15 border border-line rounded-xl py-6 font-bold uppercase text-[10px] tracking-widest transition-all text-fg/90 hover:text-fg"
              >
                {copiedShareLink ? (
                  <>
                    <ClipboardCheck className="h-4 w-4 mr-2" />
                    {"Copied!"}
                  </>
                ) : (
                  <>
                    <Share className="h-4 w-4 mr-2" />
                    {"Share Game"}
                  </>
                )}
              </Button>
              <div className="bg-fg/5 border border-line rounded-xl py-6 text-center">
                <div className="text-xs font-bold text-fg/60 uppercase tracking-widest">{"Insights"}</div>
                <div className="text-[10px] text-fg/40 mt-1 uppercase tracking-widest">{"Computer analysis only"}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Game Momentum Graph - Show when analysis exists */}
      {hasAnalysis && (
        <GameMomentumGraph
          analysis={data.analysis}
          currentMoveIndex={currentMoveIndex}
          winningColor={data?.winningColor || 'white'}
        />
      )}

      {/* Synergy Metrics - Show when analysis exists */}
      {hasAnalysis && data?.whiteTeamUserIds && data?.blackTeamUserIds && (
        <SynergyMetrics
          whiteTeamUserIds={data.whiteTeamUserIds}
          blackTeamUserIds={data.blackTeamUserIds}
          gameHistory={data.gameHistory || []}
          analysis={data.analysis}
          winningColor={data?.winningColor || 'white'}
        />
      )}

      <Card className="glass-effect border border-line backdrop-blur-xl">
        <CardContent className="p-6">
          {!data?.analysis ? (
            <div className="space-y-6">
              <div className="text-fg text-center glass-effect border border-line rounded-lg p-6">
                <Brain className="h-12 w-12 mx-auto mb-4 text-accent-ink" />
                <p className="text-lg mb-2 font-semibold">{"Game Analysis"}</p>
                <p className="text-sm text-fg-muted leading-relaxed">
                  {"Run Stockfish analysis to see move accuracy, blunders, and team synergy for this game."}
                </p>
              </div>
              <div className="flex justify-center">
                {analysisRunning ? (
                  <div className="w-full space-y-4">
                    <div className="flex items-center justify-center space-x-2 text-accent-ink">
                      <Spinner />
                      <span>{"Analyzing Game..."}</span>
                    </div>
                    {analysisProgress !== undefined && (
                      <div className="w-full bg-fg/5 rounded-full h-2 overflow-hidden">
                        <div
                          className="h-full bg-accent transition-all duration-300 shadow-[0_0_10px_#FFC800]"
                          style={{ width: `${analysisProgress}%` }}
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <Button
                    className="bg-accent hover:bg-accent/90 text-accent-fg"
                    onClick={onRunAnalysis}
                  >
                    <Brain className="w-4 h-4 mr-2" />
                    {"Run Computer Analysis"}
                  </Button>
                )}
              </div>
            </div>
          ) : data?.analysis.length === 0 ? (
            <div className="text-center text-fg-muted py-8">
              {"An error occurred. Analysis not available."}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Move Insight Card - Modern Design */}
              <div className="p-6 rounded-3xl bg-gradient-to-br from-gray-900 to-black border border-line shadow-2xl relative overflow-hidden">
                {/* Background glow */}
                <div className="absolute -top-12 -right-12 h-32 w-32 bg-accent/10 blur-[60px]" />
                
                <div className="relative">
                  <div className="text-center mb-4">
                    <span className="text-accent-ink font-semibold">{`${currentMove?.username ?? ''} played ${currentMove?.move ?? ''}`}</span>
                  </div>

                  {/* Move Badge */}
                  <div className="flex justify-center mb-4">
                    <MoveBadge feedback={feedback as any} isOpening={currentMoveIndex === 0} />
                  </div>

                  {/* Win Percentage / Mate Info */}
                  {(moveMessage || mate) && (
                    <div className="text-center space-y-2 mb-4">
                      <div className="text-fg font-medium text-lg">
                        {mate === '' && winPercentage}
                        {mate === '0' && "Game Over"}
                        {mate && mate !== '' && mate !== '0' && (
                          <>{(() => {
                            const count = Math.abs(parseInt(mate));
                            return count === 1 ? `Mate in ${count} move` : `Mate in ${count} moves`;
                          })()}</>
                        )}
                      </div>
                      {moveMessage && (
                        <div className="text-fg-muted text-sm">
                          {moveMessage}
                          <span className="text-xs ml-2 text-fg-subtle">{"- Stockfish Analysis"}</span>
                        </div>
                      )}
                    </div>
                  )}

                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

