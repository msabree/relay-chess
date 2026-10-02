import dynamic from 'next/dynamic';
const Users = dynamic(() => import('lucide-react').then(mod => mod.Users), { ssr: false });
const Target = dynamic(() => import('lucide-react').then(mod => mod.Target), { ssr: false });
const Award = dynamic(() => import('lucide-react').then(mod => mod.Award), { ssr: false });

interface SynergyMetricsProps {
  whiteTeamUserIds: string[];
  blackTeamUserIds: string[];
  gameHistory: Array<{
    userId: string;
    username: string;
    move: string;
  }>;
  analysis: Array<{
    analysis: {
      accuracyPercent: number;
      winPercent: number;
    };
  }> | undefined;
  winningColor: 'white' | 'black';
}

export const SynergyMetrics = ({
  whiteTeamUserIds,
  blackTeamUserIds,
  gameHistory,
  analysis,
  winningColor
}: SynergyMetricsProps) => {
  const calculateTeamMetrics = (teamUserIds: string[]) => {
    if (!analysis || gameHistory.length === 0) {
      return { accuracy: 0, synergy: 0, moveCount: 0, players: [] };
    }

    const teamMoves = analysis
      .map((move, index) => ({
        move,
        history: gameHistory[index],
      }))
      .filter(({ history }) => 
        teamUserIds.some(id => history?.userId === id || history?.username?.includes(id))
      );

    if (teamMoves.length === 0) {
      return { accuracy: 0, synergy: 0, moveCount: 0, players: [] };
    }

    // Calculate average accuracy
    const totalAccuracy = teamMoves.reduce(
      (sum, { move }) => sum + (move.analysis.accuracyPercent || 0),
      0
    );
    const accuracy = Math.round(totalAccuracy / teamMoves.length);

    // Calculate synergy (how well moves complement each other)
    const accuracies = teamMoves.map(({ move }) => move.analysis.accuracyPercent || 0);
    const avg = accuracies.reduce((a, b) => a + b, 0) / accuracies.length;
    const variance = accuracies.reduce((sum, acc) => sum + Math.pow(acc - avg, 2), 0) / accuracies.length;
    const synergy = Math.max(0, Math.min(100, 100 - Math.sqrt(variance) * 2));

    // Find "Savior" - player who made the biggest recovery after a teammate's mistake
    let maxRecovery = 0;
    let saviorMove = null;
    let saviorPlayer = '';

    for (let i = 1; i < teamMoves.length; i++) {
      const prevMove = teamMoves[i - 1];
      const currentMove = teamMoves[i];
      const prevWinPercent = prevMove.move.analysis.winPercent;
      const currentWinPercent = currentMove.move.analysis.winPercent;
      
      // Check if previous move was a mistake (low accuracy) and current move recovered
      if (prevMove.move.analysis.accuracyPercent < 50 && currentWinPercent > prevWinPercent) {
        const recovery = currentWinPercent - prevWinPercent;
        if (recovery > maxRecovery) {
          maxRecovery = recovery;
          saviorMove = currentMove;
          saviorPlayer = currentMove.history?.username || 'Unknown';
        }
      }
    }

    // Get unique players
    const players = Array.from(new Set(teamMoves.map(({ history }) => history?.username || 'Unknown')));

    return {
      accuracy,
      synergy: Math.round(synergy),
      moveCount: teamMoves.length,
      players,
      savior: saviorMove ? { player: saviorPlayer, recovery: Math.round(maxRecovery) } : null
    };
  };

  const whiteMetrics = calculateTeamMetrics(whiteTeamUserIds);
  const blackMetrics = calculateTeamMetrics(blackTeamUserIds);

  const getSynergyLabel = (val: number) => {
    if (val >= 80) return { label: "Elite", color: 'from-green-500 to-emerald-500' };
    if (val >= 60) return { label: "Strong", color: 'from-blue-500 to-cyan-500' };
    if (val >= 40) return { label: "Good", color: 'from-yellow-500 to-orange-500' };
    return { label: "Weak", color: 'from-red-500 to-pink-500' };
  };

  const AccuracyPulse = ({ value, label, isWinning }: { value: number; label: string; isWinning: boolean }) => (
    <div className={`relative flex flex-col items-center justify-center p-6 bg-white/5 rounded-2xl border transition-all group ${
      isWinning ? 'border-cyan-500/50 shadow-[0_0_30px_rgba(6,182,212,0.3)]' : 'border-white/10'
    }`}>
      <div className={`text-5xl font-black italic tracking-tighter text-transparent bg-clip-text ${
        isWinning 
          ? 'bg-gradient-to-r from-cyan-400 to-blue-500' 
          : 'bg-gradient-to-r from-gray-400 to-gray-600'
      }`}>
        {value}%
      </div>
      <div className="text-[10px] uppercase tracking-widest opacity-50 font-bold mt-1">{label}</div>
      {isWinning && (
        <div className="absolute inset-0 bg-cyan-500/5 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
      )}
    </div>
  );

  const SynergyCard = ({ metrics, teamName, isWinning }: { 
    metrics: typeof whiteMetrics; 
    teamName: string; 
    isWinning: boolean;
  }) => {
    const synergyLabel = getSynergyLabel(metrics.synergy);
    
    return (
      <div className={`glass-effect border rounded-2xl p-6 backdrop-blur-xl ${
        isWinning ? 'border-cyan-500/30 shadow-[0_0_20px_rgba(6,182,212,0.2)]' : 'border-white/10'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-lg bg-gradient-to-br ${synergyLabel.color}`}>
              <Users className="h-5 w-5 text-white" />
            </div>
            <div>
              <h4 className="text-white font-bold">{teamName === "White" ? "White Team" : "Black Team"}</h4>
              <p className="text-xs text-gray-400">{metrics.players.join(' & ')}</p>
            </div>
          </div>
          <div className="text-right">
            <div className={`text-2xl font-black bg-gradient-to-r ${synergyLabel.color} bg-clip-text text-transparent`}>
              {metrics.synergy}%
            </div>
            <div className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">
              {synergyLabel.label}
            </div>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">{"Duo Score"}</span>
            <span className="text-white font-bold">{metrics.accuracy}%</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">{"Moves"}</span>
            <span className="text-white font-bold">{metrics.moveCount}</span>
          </div>
        </div>

        {metrics.savior && (
          <div className="mt-4 pt-4 border-t border-white/10">
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4 text-yellow-400" />
              <div className="flex-1">
                <div className="text-xs text-gray-400 uppercase tracking-wide">{"The Savior"}</div>
                <div className="text-sm font-bold text-yellow-400">{metrics.savior.player}</div>
                <div className="text-xs text-gray-500">{`Recovered +${metrics.savior.recovery}% after teammate's mistake`}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Team Accuracy Comparison */}
      <div className="grid grid-cols-2 gap-4">
        <AccuracyPulse 
          value={whiteMetrics.accuracy} 
          label={"White Team"} 
          isWinning={winningColor === 'white'}
        />
        <AccuracyPulse 
          value={blackMetrics.accuracy} 
          label={"Black Team"} 
          isWinning={winningColor === 'black'}
        />
      </div>

      {/* Synergy Cards */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Target className="h-5 w-5 text-cyan-400" />
          <h3 className="text-white font-bold text-lg">{"Team Synergy"}</h3>
        </div>
        <SynergyCard 
          metrics={whiteMetrics} 
          teamName={"White"} 
          isWinning={winningColor === 'white'}
        />
        <SynergyCard 
          metrics={blackMetrics} 
          teamName={"Black"} 
          isWinning={winningColor === 'black'}
        />
      </div>
    </div>
  );
};
