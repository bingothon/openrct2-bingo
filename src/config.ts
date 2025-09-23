import { Config } from './types';

const config: Config = {
  debug: true,
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
  gameMode: "coop", // "coop", "pvp", or "lockout"
  
  // Player colors for PVP scoreboard (OpenRCT2 color values)
  playerColors: {
    player1: 28, // COLOUR_BRIGHT_RED
    player2: 7,  // COLOUR_LIGHT_BLUE
    player3: 14, // COLOUR_BRIGHT_GREEN
    player4: 18  // COLOUR_YELLOW
  },
  
  // Player color names for reference
  playerColorNames: {
    player1: "Bright Red",
    player2: "Light Blue", 
    player3: "Bright Green",
    player4: "Yellow"
  }
};

export { config };