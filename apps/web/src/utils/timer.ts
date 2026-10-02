import { GAME_TYPES } from '@/types';

export const encodeTimer = (timer: string) => {
  switch (timer) {
    case '0,0':
      return 'X';
    case '1,1':
      return 'A';
    case '2,0':
      return 'B';
    case '2,1':
      return 'C';
    case '3,3':
      return 'D';
    case '5,0':
      return 'E';
    case '5,3':
      return 'F';
    case '10,0':
      return 'G';
    case '10,3':
      return 'H';
    default:
      return 'X';
  }
};

export const decodeTimer = (encoding: string) => {
  switch (encoding) {
    case 'X':
      return '0,0';
    case 'A':
      return '1,1';
    case 'B':
      return '2,0';
    case 'C':
      return '2,1';
    case 'D':
      return '3,3';
    case 'E':
      return '5,0';
    case 'F':
      return '5,3';
    case 'G':
      return '10,0';
    case 'H':
      return '10,3';
    default:
      return '0,0';
  }
};

export const validateTimer = (time: number, increment: number) => {
  if(isNaN(time) || isNaN(increment) || time < 0 || increment < 0 || time > 60 || increment > 100){
    return false;
  }
  return true;
};

export const getGameType = (time: number, increment: number) => {
  if(time === 0 && increment === 0){
    return GAME_TYPES.UNTIMED;
  }
  else if(time === 0 || time === 1 || time === 2){
    return GAME_TYPES.BULLET;
  }
  else if(time >= 3 && time < 8){
    return GAME_TYPES.BLITZ;
  }
  else if(time >= 8 && time < 15){
    return GAME_TYPES.RAPID;
  }
  else if(time > 15){
    return GAME_TYPES.CLASSIC;
  }

  // fail safe
  return GAME_TYPES.UNTIMED;
};