const config = {
  pluginVersion: "1.0.1",
  namespace: "BINGO",
  defaultSeed: 12345,
  userNameInput: "openrct2",
  roomNameInput: "OpenRCT2 Bingo",
  roomIdInput: "", 
  roomPasswordInput: "",
  connected: false,
} as {
  readonly pluginVersion: string;
  readonly namespace: string;
  readonly defaultSeed: number;
  userNameInput: string;
  roomNameInput: string;
  roomIdInput: string;
  roomPasswordInput: string;
  connected:boolean;
};

export { config };