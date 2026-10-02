import React from 'react';
import useLiveGames from '@/hooks/useLiveGames';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import { getTimerLabel } from '@/components/TimerSelection';
import { formatTimeRemaining, formatRelativeTime } from '@/utils/date';
import { formatAnonUsername } from '@/utils/strings';

const Eye = dynamic(() => import('lucide-react').then(mod => mod.Eye), { ssr: false });
const Clock = dynamic(() => import('lucide-react').then(mod => mod.Clock), { ssr: false });
const Move = dynamic(() => import('lucide-react').then(mod => mod.Move), { ssr: false });
const Play = dynamic(() => import('lucide-react').then(mod => mod.Play), { ssr: false });

const LiveGamesList = () => {
  const { liveGames, isConnected } = useLiveGames();
  const router = useRouter();
  const handleSpectateGame = (roomId: string) => {
    router.push(`/games/${roomId}`);
  };

  const formatPlayers = (usernames: string[]) =>
    usernames.length > 0
      ? usernames.map(u => formatAnonUsername(u)).join(', ')
      : "Anonymous";

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-3xl font-bold text-white">
            {"Live Games"}
          </h1>
          {isConnected && (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
              <span className="text-sm text-gray-400">{"Live"}</span>
            </div>
          )}
        </div>
        <p className="text-gray-400">
          {"Watch games in progress and learn from top players"}
        </p>
      </div>

      {!isConnected ? (
        <div className="glass-effect border border-white/10 rounded-2xl p-12 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-gray-500"></div>
            <span className="text-gray-400">{"Connecting..."}</span>
          </div>
        </div>
      ) : liveGames.length === 0 ? (
        <div className="glass-effect border border-white/10 rounded-2xl p-12 text-center">
          <Eye className="w-16 h-16 mx-auto mb-4 text-gray-500" />
          <p className="text-gray-400 text-lg mb-2">
            {"No active games at the moment"}
          </p>
          <p className="text-gray-500 text-sm">
            {"Start a game to see it here!"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {liveGames.map((game) => (
            <button
              key={game.roomId}
              onClick={() => handleSpectateGame(game.roomId)}
              className="glass-effect border border-white/10 rounded-xl p-6 hover:border-cyan-400/50 hover:bg-white/5 transition-all duration-200 text-left group"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full border-2 ${
                    game.currentTurn === 'w' 
                      ? 'bg-white border-white' 
                      : 'bg-gray-800 border-gray-600'
                  }`} />
                  <span className="text-sm text-gray-400">
                    {`${game.currentTurn === 'w' ? 'White' : 'Black'} to move`}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-cyan-400">
                  <Eye className="w-4 h-4" />
                  <span className="text-sm font-medium">{game.spectatorCount}</span>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="text-white font-semibold mb-1 text-sm">
                    {`White: ${formatPlayers(game.whiteTeam.usernames)}`}
                  </div>
                  <div className="text-gray-500 text-xs mb-1 text-center">{"vs"}</div>
                  <div className="text-white font-semibold text-sm">
                    {`Black: ${formatPlayers(game.blackTeam.usernames)}`}
                  </div>
                </div>

                <div className="flex items-center gap-4 text-sm text-gray-400 pt-2 border-t border-white/5">
                  <div className="flex items-center gap-1.5">
                    <Move className="w-4 h-4" />
                    <span>{`${game.moveCount} moves`}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4" />
                    <span className="text-xs">{getTimerLabel(game.timeControl, "No Timer")}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-white/5">
                  <div className="flex items-center gap-2">
                    <span className="text-white/60">W:</span>
                    <span>{formatTimeRemaining(game.timer.white)}</span>
                    <span className="text-white/60">B:</span>
                    <span>{formatTimeRemaining(game.timer.black)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{formatRelativeTime(game.lastMoveAt)}</span>
                  <div className="flex items-center gap-1 text-cyan-400 group-hover:text-cyan-300 transition-colors">
                    <Play className="w-3 h-3" />
                    <span className="font-medium">{"Watch"}</span>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LiveGamesList;
