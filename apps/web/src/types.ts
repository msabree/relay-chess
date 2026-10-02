export type TEAM_COLOR = 'w' | 'b';

// GAME TYPES
export enum GAME_TYPES {
    // eslint-disable-next-line no-unused-vars
    DAILY = 'daily',
    // eslint-disable-next-line no-unused-vars
    BULLET = 'bullet',
    // eslint-disable-next-line no-unused-vars
    BLITZ = 'blitz',
    // eslint-disable-next-line no-unused-vars
    RAPID = 'rapid',
    // eslint-disable-next-line no-unused-vars
    CLASSIC = 'classic',
    // eslint-disable-next-line no-unused-vars
    UNTIMED = 'untimed',
}

// in game interface
export interface TeamMember {
    id: string; // auto assigned if not logged in
    username: string; // if not logged in same as id
    online: boolean;
    color: TEAM_COLOR;
    isMove: boolean;
}

export interface Spectator {
    id: string; // auto assigned if not logged in
    username: boolean; // if not logged in same as id
    online: boolean;
}

export interface LeaderboardRow {
    _rank: number;
    _userId: string;
    elo?: number;
    wins: number;
    losses: number;
    draws: number;
    currentStreak?: number;
    highestStreak?: number;
}

export interface Leaderboard {
    total: number;
    page: number;
    rows: LeaderboardRow[];
    period?: string;
}

export interface UserPosition {
    rank: number;
    user: LeaderboardRow;
    surrounding: {
        above: LeaderboardRow[];
        below: LeaderboardRow[];
    };
}

export interface TeamInRoom {
    id: string;
    name: string;
    usersInRoom: TeamMember[];
    lastMovedUserId: string;
    captured: string[];
    promotion: string[];
}

export interface ChatMessage {
    id: string;
    message: string;
    username: string;
    userId: string;
}

export interface UserProfile {
    _id: string;
    username: string;
    boardColor: string;
    guest: boolean;
}

export interface GameMove {
    lanMove?: string;
    sanMove?: string;
    move: string;
    userId: string;
    username?: string;
    fen?: string;
    whiteTimeLeft?: number;
    blackTimeLeft?: number;
};

export interface Analysis {
    move: string;
    lanMove: string;
    userId: string;
    username: string;
    fen: string;
    analysis: {
        depth: number;
        multipv: number;
        mate: string;
        bestMove: string;
        centipawns: string;
        winPercent: number;
        accuracyPercent: number;
        feedback: 'best' | 'good' | 'unexpected' | 'mistake' | 'blunder' ;
    }
}

  
export interface GameData {
    _id: string;
    gameType: GAME_TYPES;
    roomId: string;
    userIds: string[];
    whiteTeamUserIds: string[];
    blackTeamUserIds: string[];
    winningColor: 'white' | 'black';
    result: 'checkmate' | 'draw' | 'resign' | 'timeout';
    timestamp: string;
    gameHistory: GameMove[]
    analysis?: Analysis[];
}

export interface LiveGameInfo {
    roomId: string;
    whiteTeam: {
        usernames: string[];
        userIds: string[];
    };
    blackTeam: {
        usernames: string[];
        userIds: string[];
    };
    moveCount: number;
    currentFen: string;
    timeControl: string;
    timer: {
        white: number;
        black: number;
    };
    isPrivate: boolean;
    spectatorCount: number;
    startedAt: string;
    lastMoveAt: string;
    currentTurn: 'w' | 'b';
}

export type APIError = unknown;