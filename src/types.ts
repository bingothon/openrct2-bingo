import type { GoalScope } from "./bingo/goalScopes";

export type Goal = {
    name: string;
    slot: string | undefined;
    colors: string;
    status: "completed" | "incomplete";
    /** Coop check: the whole park */
    checkCondition: () => boolean;
    currentCondition?: () => string | number | undefined;
    /** PvP/Lockout check: only the player's region. Goals without it are coop-only. */
    checkPlayer?: (scope: GoalScope) => boolean;
    /** PvP/Lockout progress in the player's region (shown when clicking the goal) */
    playerProgress?: (scope: GoalScope) => string | number;
    /** Name shown in PvP/Lockout when it differs from the coop name */
    playerName?: string;
    /** Only offered in PvP/Lockout */
    playerOnly?: boolean;
    /** PvP: colours of the players that completed the goal */
    completedBy?: string[];
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
  /** Coop: park cash at the start of a game (money units, tenths of a dollar) */
  startingCash: number;
  /** PvP/Lockout: budget per player (money units, tenths); the park starts with one per colour */
  playerStartingBudget: number;
  /** Research: one new ride is invented every this many in-game days (a year has ~245 days) */
  inventionIntervalDays: number;
  /** Rides are renewed (reset to new) every this many in-game days, so they don't age */
  renewRidesIntervalDays: number;
  playerColorNames: PlayerColorNames;
  debug: boolean;
}

