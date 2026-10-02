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
          <h1 className="text-3xl font-bold text-fg">
            {"Live Games"}
          </h1>
          {isConnected && (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-success animate-pulse"></div>
              <span className="text-sm text-fg-muted">{"Live"}</span>
            </div>
          )}
        </div>
        <p className="text-fg-muted">
          {"Watch games in progress and learn from top players"}
        </p>
      </div>

      {!isConnected ? (
        <div className="glass-effect border border-line rounded-2xl p-12 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-gray-500"></div>
            <span className="text-fg-muted">{"Connecting..."}</span>
          </div>
        </div>
      ) : liveGames.length === 0 ? (
        <div className="glass-effect border border-line rounded-2xl p-12 text-center">
          <Eye className="w-16 h-16 mx-auto mb-4 text-fg-subtle" />
          <p className="text-fg-muted text-lg mb-2">
            {"No active games at the moment"}
          </p>
          <p className="text-fg-subtle text-sm">
            {"Start a game to see it here!"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {liveGames.map((game) => (
            <button
              key={game.roomId}
              onClick={() => handleSpectateGame(game.roomId)}
              className="glass-effect border border-line rounded-xl p-6 hover:border-accent/50 hover:bg-fg/5 transition-all duration-200 text-left group"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full border-2 ${
                    game.currentTurn === 'w' 
                      ? 'bg-surface border-line' 
                      : 'bg-raised border-line'
                  }`} />
                  <span className="text-sm text-fg-muted">
                    {`${game.currentTurn === 'w' ? 'White' : 'Black'} to move`}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-accent-ink">
                  <Eye className="w-4 h-4" />
                  <span className="text-sm font-medium">{game.spectatorCount}</span>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="text-fg font-semibold mb-1 text-sm">
                    {`White: ${formatPlayers(game.whiteTeam.usernames)}`}
                  </div>
                  <div className="text-fg-subtle text-xs mb-1 text-center">{"vs"}</div>
                  <div className="text-fg font-semibold text-sm">
                    {`Black: ${formatPlayers(game.blackTeam.usernames)}`}
                  </div>
                </div>

                <div className="flex items-center gap-4 text-sm text-fg-muted pt-2 border-t border-line">
                  <div className="flex items-center gap-1.5">
                    <Move className="w-4 h-4" />
                    <span>{`${game.moveCount} moves`}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4" />
                    <span className="text-xs">{getTimerLabel(game.timeControl, "No Timer")}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-fg-subtle pt-2 border-t border-line">
                  <div className="flex items-center gap-2">
                    <span className="text-fg/60">W:</span>
                    <span>{formatTimeRemaining(game.timer.white)}</span>
                    <span className="text-fg/60">B:</span>
                    <span>{formatTimeRemaining(game.timer.black)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-fg-subtle">
                  <span>{formatRelativeTime(game.lastMoveAt)}</span>
                  <div className="flex items-center gap-1 text-accent-ink group-hover:text-accent-ink transition-colors">
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
