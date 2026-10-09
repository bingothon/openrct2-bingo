import { Config } from './types';

const config: Config = {
  // Debug commands (/setscore, /test, ...) and debug logs only exist in development builds
  debug: __BUILD_CONFIGURATION__ === "development",
  pluginVersion: "1.0.1",
  defaultSeed: 12345,
  userNameInput: "openrct2",
  roomNameInput: "OpenRCT2 Bingo",
  roomIdInput: "", 
  roomPasswordInput: "",
  connected: false,
  gameTime: {
    day: 0,
    month: 0,
    year: 2,
  },
  daysElapsed: 0,
  started: false,
  socket: undefined,
  gameMode: "pvp", // "coop", "pvp", or "lockout"
  
  // Player colors for PVP scoreboard (OpenRCT2 color values)
  startingCash: 1000000, // $100,000
  playerStartingBudget: 250_000 * 10, // $250,000 per player
  // One new research item every 3 in-game days: the ~140 items take ~1.7 of the ~245-day years
  inventionIntervalDays: 3,
  renewRidesIntervalDays: 100,
  playerColors: {
    player1: 28, // COLOUR_BRIGHT_RED
    player2: 6,  // COLOUR_BRIGHT_BLUE (changed from LIGHT_BLUE)
    player3: 14, // COLOUR_BRIGHT_GREEN
    player4: 18  // COLOUR_YELLOW
  },
  
  // Player color names for reference
  playerColorNames: {
    player1: "Bright Red",
    player2: "Bright Blue", 
    player3: "Bright Green",
    player4: "Yellow"
  }
};

export { config };