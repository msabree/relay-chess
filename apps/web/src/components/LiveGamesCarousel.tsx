import React, { useRef, useState } from 'react';
import useLiveGames from '@/hooks/useLiveGames';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { getTimerLabel } from '@/components/TimerSelection';

const Eye = dynamic(() => import('lucide-react').then(mod => mod.Eye), { ssr: false });
const Clock = dynamic(() => import('lucide-react').then(mod => mod.Clock), { ssr: false });
const ChevronLeft = dynamic(() => import('lucide-react').then(mod => mod.ChevronLeft), { ssr: false });
const ChevronRight = dynamic(() => import('lucide-react').then(mod => mod.ChevronRight), { ssr: false });
const Play = dynamic(() => import('lucide-react').then(mod => mod.Play), { ssr: false });
const ArrowRight = dynamic(() => import('lucide-react').then(mod => mod.ArrowRight), { ssr: false });
import { formatTimeRemaining, formatRelativeTime } from '@/utils/date';
import { formatAnonUsername } from '@/utils/strings';

const LiveGamesCarousel = () => {
  const { liveGames, isConnected } = useLiveGames();
  const router = useRouter();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Show max 5 games
  const displayedGames = liveGames.slice(0, 5);

  const handleSpectateGame = (roomId: string) => {
    router.push(`/games/${roomId}`);
  };

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return;
    const container = scrollContainerRef.current;
    const scrollAmount = container.clientWidth;
    container.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    });
  };

  const checkScrollability = () => {
    if (!scrollContainerRef.current) return;
    const container = scrollContainerRef.current;
    setCanScrollLeft(container.scrollLeft > 0);
    setCanScrollRight(
      container.scrollLeft < container.scrollWidth - container.clientWidth - 10
    );
  };

  React.useEffect(() => {
    checkScrollability();
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScrollability);
      window.addEventListener('resize', checkScrollability);
      return () => {
        container.removeEventListener('scroll', checkScrollability);
        window.removeEventListener('resize', checkScrollability);
      };
    }
  }, [liveGames]);

  const formatPlayers = (usernames: string[]) =>
    usernames.length > 0
      ? usernames.slice(0, 2).map(u => formatAnonUsername(u)).join(', ')
      : "Anonymous";

  if (!isConnected || displayedGames.length === 0) {
    return null;
  }

  return (
    <div className="relative w-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold text-white">
            {"Live Games"}
          </h2>
          {isConnected && liveGames.length > 0 && (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
              <span className="text-sm text-gray-400">{`${liveGames.length} active`}</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          {liveGames.length > 5 && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => scroll('left')}
                disabled={!canScrollLeft}
                className={`p-2 rounded-lg glass-effect border border-white/10 transition-all duration-200 ${
                  canScrollLeft
                    ? 'hover:border-cyan-400/50 hover:bg-white/5 text-white cursor-pointer'
                    : 'text-gray-600 cursor-not-allowed opacity-50'
                }`}
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => scroll('right')}
                disabled={!canScrollRight}
                className={`p-2 rounded-lg glass-effect border border-white/10 transition-all duration-200 ${
                  canScrollRight
                    ? 'hover:border-cyan-400/50 hover:bg-white/5 text-white cursor-pointer'
                    : 'text-gray-600 cursor-not-allowed opacity-50'
                }`}
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
          {liveGames.length > 0 && (
            <Link
              href="/live-games"
              className="flex items-center gap-2 px-4 py-2 rounded-lg glass-effect border border-white/10 hover:border-cyan-400/50 hover:bg-white/5 text-white transition-all duration-200 text-sm font-medium"
            >
              <span>{"View All"}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>
      </div>

      <div
        ref={scrollContainerRef}
        className="flex gap-4 overflow-x-auto scrollbar-hide pb-4"
      >
        {displayedGames.map((game) => (
          <button
            key={game.roomId}
            onClick={() => handleSpectateGame(game.roomId)}
            className="flex-shrink-0 w-[280px] glass-effect border border-white/10 rounded-xl p-5 hover:border-cyan-400/50 hover:bg-white/5 transition-all duration-200 text-left group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-full border ${
                  game.currentTurn === 'w' 
                    ? 'bg-white border-white' 
                    : 'bg-gray-800 border-gray-600'
                }`} />
                <span className="text-xs text-gray-400">
                  {`${game.currentTurn === 'w' ? 'White' : 'Black'} to move`}
                </span>
              </div>
              <div className="flex items-center gap-1 text-cyan-400">
                <Eye className="w-3.5 h-3.5" />
                <span className="text-xs font-medium">{game.spectatorCount}</span>
              </div>
            </div>

            <div className="space-y-2.5">
              <div>
                <div className="text-white font-semibold mb-1 text-xs">
                  {`White: ${formatPlayers(game.whiteTeam.usernames)}`}
                </div>
                <div className="text-gray-500 text-[10px] mb-1 text-center">{"vs"}</div>
                <div className="text-white font-semibold text-xs">
                  {`Black: ${formatPlayers(game.blackTeam.usernames)}`}
                </div>
              </div>

              <div className="flex items-center gap-3 text-xs text-gray-400 pt-2 border-t border-white/5">
                <div className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span className="text-[10px]">{getTimerLabel(game.timeControl, "No Timer")}</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-[10px] text-gray-500 pt-2 border-t border-white/5">
                <div className="flex items-center gap-1.5">
                  <span className="text-white/60">W:</span>
                  <span>{formatTimeRemaining(game.timer.white)}</span>
                  <span className="text-white/60">B:</span>
                  <span>{formatTimeRemaining(game.timer.black)}</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-[10px] text-gray-500 pt-1">
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
    </div>
  );
};

export default LiveGamesCarousel;

