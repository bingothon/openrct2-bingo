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

// Enhanced types for the Bingo class
export interface Player {
  id: string;
  name: string;
  color: string;
  colorToken: string;
  isActive: boolean;
  completedGoals: string[]; // Array of goal slot IDs
  mapRegion?: MapRegion;
}

export interface MapRegion {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  name: string;
}

export interface GameModeConfig {
  allowMultipleSelections: boolean; // PVP allows multiple players to select same goal
  maxPlayers: number;
  mapDivision: boolean; // Whether to divide map into player regions
  scoreTracking: boolean; // Whether to track individual player scores
}

export interface BingoState {
  gameMode: "coop" | "pvp" | "lockout";
  players: { [key: string]: Player }; // Plain object instead of Map
  activePlayers: string[]; // Array of active player IDs
  board: BingoBoard;
  completedBingos: string[]; // Array of completed bingo line keys
  gameStarted: boolean;
  seed: number;
}

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

