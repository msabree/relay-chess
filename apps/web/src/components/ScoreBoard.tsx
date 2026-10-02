import React from 'react';
import Pawn from '@/icons/Pawn';
import Knight from '@/icons/Knight';
import Bishop from '@/icons/Bishop';
import Rook from '@/icons/Rook';
import Queen from '@/icons/Queen';
import { TEAM_COLOR } from '@/types';
import { BISHOP_POINTS, KNIGHT_POINTS, PAWN_POINTS, QUEEN_POINTS, ROOK_POINTS } from '@/constants';

interface ScoreBoardProps {
    color: TEAM_COLOR;
    whiteCaptured: string[];
    blackCaptured: string[];
    whitePromoted: string[];
    blackPromoted: string[];
}

const show = (piece: string, count: number) => {
  for(let i = 0; i < count; i++){
    switch(piece){
      case 'p': 
        return <Pawn fill={'#ffffff'} />;
      case 'n': 
        return <Knight fill={'#ffffff'} />;
      case 'b': 
        return <Bishop fill={'#ffffff'} />;
      case 'r': 
        return <Rook fill={'#ffffff'} />;
      case 'q': 
        return <Queen fill={'#ffffff'} />;
      default:
        return null;
    }
  }
};

const computeScore = (captured: string[]) => {
  let score = 0;
  for(let i = 0; i < captured.length; i++){
    const piece = captured[i];
    if(piece === 'p'){
      score += PAWN_POINTS;
    }
    else if(piece === 'n'){
      score += KNIGHT_POINTS;
    }
    else if(piece === 'b'){
      score += BISHOP_POINTS;
    }
    else if(piece === 'r'){
      score += ROOK_POINTS;
    }
    else if(piece === 'q'){
      score += QUEEN_POINTS;
    }
  }

  return score;
};

const ScoreBoard = ({color, whiteCaptured, blackCaptured, whitePromoted = [], blackPromoted = []} : ScoreBoardProps) => {

  const whiteScore = computeScore(whiteCaptured) + computeScore(whitePromoted);
  const blackScore = computeScore(blackCaptured) + computeScore(blackPromoted);

  const captured = color === 'w' ? whiteCaptured : blackCaptured;

  return (
    <div className="flex justify-start items-center gap-1.5 mb-2 mt-2">
      {show('p', captured.filter((piece) => piece === 'p').length)}
      {show('n', captured.filter((piece) => piece === 'n').length)}
      {show('b', captured.filter((piece) => piece === 'b').length)}
      {show('r', captured.filter((piece) => piece === 'r').length)}
      {show('q', captured.filter((piece) => piece === 'q').length)}
      {whiteScore > blackScore && color === 'w' && <div className="text-sm text-white ml-1">+{whiteScore-blackScore}</div>}
      {blackScore > whiteScore && color === 'b' && <div className="text-sm text-white ml-1">+{blackScore-whiteScore}</div>}
    </div>
  );
};

export default ScoreBoard;