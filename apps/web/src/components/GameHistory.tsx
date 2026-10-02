import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Chessboard } from 'react-chessboard';
import { useGames } from '@/hooks/useGames';
import { GameData } from '@/types';
import { useUser } from '@/hooks/useUser';
import { Button } from '@/components/ui/button';
import dynamic from 'next/dynamic';
import { Card, CardContent } from '@/components/ui/card';

const Trophy = dynamic(() => import('lucide-react').then(mod => mod.Trophy), { ssr: false });
const Clock = dynamic(() => import('lucide-react').then(mod => mod.Clock), { ssr: false });
const Users = dynamic(() => import('lucide-react').then(mod => mod.Users), { ssr: false });
const ChevronDown = dynamic(() => import('lucide-react').then(mod => mod.ChevronDown), { ssr: false });
const ChevronUp = dynamic(() => import('lucide-react').then(mod => mod.ChevronUp), { ssr: false });
import ReactGA from 'react-ga4';
import { CLICKED_REVIEW_GAME } from '@/constants';

const INITIAL_GAMES_TO_SHOW = 6;
const GAMES_INCREMENT = 6;

const GameHistory = () => {
  const userQuery = useUser();
  const userId = userQuery.data?._id ?? '';
  const gamesHistory = useGames(userId);
  const [gamesToShow, setGamesToShow] = useState(INITIAL_GAMES_TO_SHOW);
  const getResult = (game: GameData) => {
    if(game.winningColor === 'white' && game.whiteTeamUserIds.includes(userId)){
      return { text: "Victory", color: 'text-success' };
    }
    else if(game.winningColor === 'black' && game.blackTeamUserIds.includes(userId)){
      return { text: "Victory", color: 'text-success' };
    }
    else if(game.winningColor === 'white' && game.blackTeamUserIds.includes(userId)){
      return { text: "Defeat", color: 'text-danger' };
    }
    else if(game.winningColor === 'black' && game.whiteTeamUserIds.includes(userId)){
      return { text: "Defeat", color: 'text-danger' };
    }
    else {
      return { text: "Draw", color: 'text-accent-ink' };
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const allGames = useMemo(() => gamesHistory.data ?? [], [gamesHistory.data]);
  const visibleGames = useMemo(() => allGames.slice(0, gamesToShow), [allGames, gamesToShow]);
  const showingAll = gamesToShow >= allGames.length;

  const handleShowMore = () => {
    setGamesToShow(prev => Math.min(prev + GAMES_INCREMENT, allGames.length));
  };

  const handleShowLess = () => {
    setGamesToShow(INITIAL_GAMES_TO_SHOW);
  };

  if (!allGames.length) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full glass-effect border border-line mb-4">
          <Trophy className="h-8 w-8 text-amber-400/50" />
        </div>
        <p className="text-lg text-fg-muted font-semibold mb-2">{"No games played yet"}</p>
        <p className="text-sm text-fg-muted">{"Start a new game to see your history here"}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {visibleGames.map((game) => {
          const result = getResult(game);
          return (
            <Card key={game._id} className="glass-effect border border-line hover:border-accent/30 transition-all duration-300 backdrop-blur-xl">
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-5">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2.5 mb-4">
                      <Clock className="h-4 w-4 text-fg-muted" />
                      <span className="text-sm text-fg-muted">{formatDate(game.timestamp)}</span>
                    </div>
                    <div className="flex items-center gap-2.5 mb-5">
                      <Users className="h-4 w-4 text-fg-muted" />
                      <span className="text-sm text-fg-muted">
                        {`${game.whiteTeamUserIds.length + game.blackTeamUserIds.length} players`}
                      </span>
                    </div>
                    <div className={`text-xl font-bold ${result.color} mb-5`}>
                      {result.text}
                    </div>
                  </div>
                  <div className="w-[100px] h-[100px] rounded-lg overflow-hidden border border-line flex-shrink-0">
                    <Chessboard 
                      position={game.gameHistory[game.gameHistory.length - 1].fen}
                      isDraggablePiece={() => false}
                      onPieceClick={() => false}
                      boardWidth={100}
                      customDarkSquareStyle={{ backgroundColor: '#60688e' }}
                      customLightSquareStyle={{ backgroundColor: '#d3d7ec' }}
                      customBoardStyle={{ border: 'none' }}
                    />
                  </div>
                </div>
                <div className="mt-5 flex justify-end">
                  <Button 
                    variant="ghost" 
                    className="glass-effect border border-line hover:border-accent/50 hover:bg-accent/10 text-fg hover:text-accent-ink transition-all duration-200 px-4 py-2"
                    asChild
                    onClick={() => {
                      ReactGA.event({
                        category: CLICKED_REVIEW_GAME,
                        action: 'Clicked Review Game',
                      });
                    }}
                  >
                    <Link href={`/analysis/${game.roomId}`}>
                    {"Review Game"}
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Show More/Less Button */}
      {allGames.length > INITIAL_GAMES_TO_SHOW && (
        <div className="flex justify-center pt-6">
          <Button
            variant="ghost"
            onClick={showingAll ? handleShowLess : handleShowMore}
            className="glass-effect border border-line hover:border-accent/50 hover:bg-accent/10 text-fg hover:text-accent-ink transition-all duration-200 flex items-center gap-2.5 px-5 py-2.5"
          >
            {showingAll ? (
              <>
                <ChevronUp className="w-4 h-4" />
                {"Show Less"}
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" />
                {`Show More (${allGames.length - gamesToShow} remaining)`}
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
};

export default GameHistory;