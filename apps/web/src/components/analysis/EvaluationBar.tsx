interface EvaluationBarProps {
  winPercent: number;
  mate?: string;
  isWhiteMove: boolean;
  className?: string;
}

export const EvaluationBar = ({ winPercent, mate, isWhiteMove, className = '' }: EvaluationBarProps) => {
  // Convert winPercent to perspective of current player
  const perspectivePercent = isWhiteMove ? winPercent : 100 - winPercent;
  
  // Determine if there's a mate
  const hasMate = mate && mate !== '' && mate !== '0';
  const mateValue = hasMate ? parseInt(mate) : 0;
  const isWinning = hasMate ? mateValue > 0 : perspectivePercent > 50;
  
  // Calculate bar position (0-100%)
  const barPosition = hasMate 
    ? (mateValue > 0 ? 100 : 0)
    : perspectivePercent;

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {/* Bar container */}
      <div className="relative h-8 bg-white/5 rounded-full overflow-hidden border border-white/10">
        {/* White side (left) */}
        <div 
          className="absolute left-0 top-0 h-full bg-gradient-to-r from-gray-100 to-gray-300 transition-all duration-500"
          style={{ width: `${barPosition}%` }}
        />
        
        {/* Black side (right) */}
        <div 
          className="absolute right-0 top-0 h-full bg-gradient-to-l from-gray-800 to-gray-900 transition-all duration-500"
          style={{ width: `${100 - barPosition}%` }}
        />
        
        {/* Center line */}
        <div className="absolute left-1/2 top-0 h-full w-px bg-white/30 transform -translate-x-1/2" />
        
        {/* Current position indicator */}
        <div 
          className="absolute top-0 h-full w-1 bg-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.8)] transition-all duration-500 z-10"
          style={{ left: `${barPosition}%`, transform: 'translateX(-50%)' }}
        />
      </div>
      
      {/* Labels */}
      <div className="flex justify-between items-center text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-gray-200" />
          <span className="text-gray-300 font-medium">{"White"}</span>
        </div>
        
        <div className="text-center">
          {hasMate ? (
            <span className={`font-bold ${isWinning ? 'text-cyan-400' : 'text-gray-400'}`}>
              {Math.abs(mateValue)} {Math.abs(mateValue) === 1 ? "move" : "moves"}
            </span>
          ) : (
            <span className={`font-bold ${isWinning ? 'text-cyan-400' : 'text-gray-400'}`}>
              {Math.round(perspectivePercent)}%
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-gray-300 font-medium">{"Black"}</span>
          <div className="w-3 h-3 rounded-full bg-gray-800" />
        </div>
      </div>
    </div>
  );
};

