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
  socket: undefined
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
};

export { config };