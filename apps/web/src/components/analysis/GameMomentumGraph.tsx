import { useMemo } from 'react';
interface GameMomentumGraphProps {
  analysis: Array<{
    analysis: {
      winPercent: number;
    };
  }> | undefined;
  currentMoveIndex: number;
  winningColor: 'white' | 'black';
}

export const GameMomentumGraph = ({ analysis, currentMoveIndex, winningColor }: GameMomentumGraphProps) => {
  const dataPoints = useMemo(() => {
    if (!analysis || analysis.length === 0) return [];

    return analysis.map((move, index) => {
      const winPercent = move.analysis.winPercent;
      // Convert to perspective of the winning team
      const perspectivePercent = winningColor === 'white' 
        ? (index % 2 === 0 ? 100 - winPercent : winPercent)
        : (index % 2 === 0 ? winPercent : 100 - winPercent);
      
      return {
        move: index + 1,
        winPercent: perspectivePercent,
        isCurrentMove: index === currentMoveIndex
      };
    });
  }, [analysis, currentMoveIndex, winningColor]);

  const turningPoint = useMemo(() => {
    if (dataPoints.length < 2) return null;
    
    let maxSwing = 0;
    let turningMove = 0;
    
    for (let i = 1; i < dataPoints.length; i++) {
      const swing = Math.abs(dataPoints[i].winPercent - dataPoints[i - 1].winPercent);
      if (swing > maxSwing) {
        maxSwing = swing;
        turningMove = i;
      }
    }
    
    return maxSwing > 10 ? turningMove : null; // Only highlight if swing > 10%
  }, [dataPoints]);

  if (dataPoints.length === 0) return null;

  const maxPercent = Math.max(...dataPoints.map(d => d.winPercent));
  const minPercent = Math.min(...dataPoints.map(d => d.winPercent));
  const range = maxPercent - minPercent || 1;

  return (
    <div className="glass-effect border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-bold text-lg flex items-center gap-2">
          <span className="text-cyan-400">📈</span>
          {"Game Momentum"}
        </h3>
        {turningPoint !== null && (
          <span className="text-xs text-cyan-400 font-semibold bg-cyan-500/10 px-3 py-1 rounded-full">
            {"Turning Point"}: {`Move ${dataPoints[turningPoint].move}`}
          </span>
        )}
      </div>
      
      <div className="relative h-48">
        {/* Gradient fill area */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 200" preserveAspectRatio="none">
          <defs>
            <linearGradient id="momentumGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgba(6, 182, 212, 0.3)" />
              <stop offset="100%" stopColor="rgba(139, 92, 246, 0.1)" />
            </linearGradient>
          </defs>
          
          {/* Area fill */}
          <path
            d={`M 0,200 ${dataPoints.map((point, i) => {
              const x = (i / (dataPoints.length - 1 || 1)) * 400;
              const y = 200 - ((point.winPercent - minPercent) / range) * 200;
              return `L ${x},${y}`;
            }).join(' ')} L 400,200 Z`}
            fill="url(#momentumGradient)"
            className="transition-all duration-300"
          />
          
          {/* Line */}
          <polyline
            points={dataPoints.map((point, i) => {
              const x = (i / (dataPoints.length - 1 || 1)) * 400;
              const y = 200 - ((point.winPercent - minPercent) / range) * 200;
              return `${x},${y}`;
            }).join(' ')}
            fill="none"
            stroke="url(#lineGradient)"
            strokeWidth="3"
            className="transition-all duration-300"
          />
          
          <defs>
            <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#06b6d4" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
          </defs>
          
          {/* Current move indicator */}
          {dataPoints.map((point, i) => {
            if (!point.isCurrentMove) return null;
            const x = (i / (dataPoints.length - 1 || 1)) * 400;
            const y = 200 - ((point.winPercent - minPercent) / range) * 200;
            return (
              <g key={`current-${i}`}>
                <circle
                  cx={x}
                  cy={y}
                  r="8"
                  fill="#06b6d4"
                  className="animate-pulse"
                />
                <circle
                  cx={x}
                  cy={y}
                  r="12"
                  fill="#06b6d4"
                  opacity="0.3"
                  className="animate-ping"
                />
              </g>
            );
          })}
          
          {/* Turning point indicator */}
          {turningPoint !== null && dataPoints[turningPoint] && (() => {
            const point = dataPoints[turningPoint];
            const x = (turningPoint / (dataPoints.length - 1 || 1)) * 400;
            const y = 200 - ((point.winPercent - minPercent) / range) * 200;
            return (
              <g>
                <circle
                  cx={x}
                  cy={y}
                  r="6"
                  fill="#fbbf24"
                  className="animate-pulse"
                />
                <circle
                  cx={x}
                  cy={y}
                  r="10"
                  fill="#fbbf24"
                  opacity="0.4"
                />
              </g>
            );
          })()}
        </svg>
        
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-400 pr-2">
          <span>100%</span>
          <span>50%</span>
          <span>0%</span>
        </div>
      </div>
      
      {/* X-axis labels */}
      <div className="flex justify-between mt-2 text-xs text-gray-400">
        <span>{"Move 1"}</span>
        <span>{`Move ${Math.floor(dataPoints.length / 2)}`}</span>
        <span>{`Move ${dataPoints.length}`}</span>
      </div>
    </div>
  );
};

