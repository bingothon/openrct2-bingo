export type Goal = {
    name: string;
    slot: string | undefined;
    colors: string;
    status: "completed" | "incomplete";
    checkCondition: () => boolean;
    currentCondition?: () => string | number | undefined;
  };
  
export type BingoSyncBoardData = {
    name: string;
    slot: string;
    colors: string;
  };
  
export type BingoBoard = Goal[];

// Configuration types
export interface GameTime {
  day: number;
  month: number;
  year: number;
}

export interface PlayerColors {
  player1: number;
  player2: number;
  player3: number;
  player4: number;
}

export interface PlayerColorNames {
  player1: string;
  player2: string;
  player3: string;
  player4: string;
}

export interface Config {
  readonly pluginVersion: string;
  readonly defaultSeed: number;
  userNameInput: string;
  roomNameInput: string;
  roomIdInput: string;
  roomPasswordInput: string;
  connected: boolean;
  gameTime: GameTime;
  daysElapsed: number;
  started: boolean;
  socket: Socket | undefined;
  gameMode: "coop" | "pvp" | "lockout";
  playerColors: PlayerColors;
  playerColorNames: PlayerColorNames;
  debug: boolean;
}

