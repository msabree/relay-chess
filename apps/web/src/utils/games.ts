import randomstring from 'randomstring';
import { encodeTimer } from '@/utils/timer';
import { GameMove } from '@/types';
import { TEAM_COLOR_BLACK, TEAM_COLOR_WHITE } from '@/constants';
import { Chess } from 'chess.js';

export const pickRandomSide = () => {
  const teams = [TEAM_COLOR_WHITE, TEAM_COLOR_BLACK];
  const randomTeamIndex = Math.round(Math.random());

  return teams[randomTeamIndex];
}; 

export const generateRoomId = (time: string) => {
  return `${randomstring.generate(14)}${encodeTimer(time)}`;
};

export const generateRoomIdForRematch = (roomId: string) => {
  // the last character of the room id is the timer
  // for rematches we keep the last character the same (same time control)
  const cachedRoomIdSuffix = roomId.slice(-1);
  return `${randomstring.generate(14)}${cachedRoomIdSuffix}`;
};

export const generatePGN = (gameHistory: GameMove[], whiteTeamName: string, blackTeamName: string, date: string) => {
  const movesArray = (gameHistory ?? []).map((move) => move.sanMove);
  let movesAsPGNString = '';
  for(let i = 0; i < movesArray.length; i++){
    if(i % 2 === 0){
      movesAsPGNString += `${Math.floor(i / 2) + 1}.${movesArray[i]} `;
    }
    else{
      movesAsPGNString += `${movesArray[i]} `;
    }
  }

  return `
    [Event "Relay Chess"]
    [Site "https://www.relaychess.com"]
    [White "${whiteTeamName}"]
    [Black "${blackTeamName}"]
    [Date "${new Date(date).toLocaleDateString()}"]
    
    ${movesAsPGNString}
  `;
};

export const checkThreefoldRepetitionFromHistory = (history: string[]) => {
  const game = new Chess();  // Create a new game instance
  // Simulate each move from the history and check for threefold repetition
  for (let i = 0; i < history.length; i++) {
    game.move(history[i]);  // Make the move in the game
      
    // Check if there has been a threefold repetition
    if (game.isThreefoldRepetition()) {
      return true;  // Threefold repetition detected
    }
  }

  return false; 
};