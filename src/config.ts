const config = {
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
  gameMode: "coop", // "coop" or "pvp"
  
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
} as {
  readonly pluginVersion: string;
  readonly defaultSeed: number;
  userNameInput: string;
  roomNameInput: string;
  roomIdInput: string;
  room: string;
  roomPasswordInput: string;
  connected:boolean;
  daysElapsed: number;
  gameTime: {
    day: number;
    month: number;
    year: number;
  };
  started: boolean;
  socket: Socket | undefined;
  gameMode: "coop" | "pvp";
  playerColors: {
    player1: number;
    player2: number;
    player3: number;
    player4: number;
  };
  playerColorNames: {
    player1: string;
    player2: string;
    player3: string;
    player4: string;
  };
};

export { config };