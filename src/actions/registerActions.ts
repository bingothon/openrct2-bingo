import {
  updateBoardSeedAction,
  updateBoardDataAction,
  setSeedAction,
  setGoalCompletionAction,
  notifyBingoAction,
  addCashAction,
  moveToAction,
  connectionDetailsAction,
  clearAllTilesAction,
  clearAllRidesAction,
  setCashAction,
  inventNextItemAction,
  resetResearchAction,
  parkMessageAction,
  networkMessageAction,
  flatAllLandAction,
  removeAllLitterAction,
  setStorageAction,
  createScoreboardAction,
  clearScoreboardAction,
  updateScoreAction,
  registerPlayerAction,
} from "./index";

type ActionHandler = (event: GameActionEventArgs<any>) => GameActionResult;

/**
 * Callers pass custom action data as `{ args: {...} }`. Since API 68 (see targetApiVersion in
 * plugin.ts) handlers receive GameActionEventArgs whose `args` is that whole object, so unwrap it
 * here: handlers keep reading `event.args.<field>` and also get the acting `event.player`.
 */
function unwrapArgs(handler: ActionHandler): ActionHandler {
  return (event) => {
    const data: any = event.args;
    const args = data && typeof data === "object" && "args" in data ? data.args : data;
    return handler({
      action: event.action,
      args,
      player: event.player,
      type: event.type,
      isClientOnly: event.isClientOnly,
      result: event.result,
    });
  };
}

/*
 * Custom actions have no permission checks in OpenRCT2, and any player could run them with a
 * script. Players may only register themselves and store the game setup choices before the game
 * starts; everything else (goals, scores, cash, clearing the map, ...) is server-only.
 */
const PLAYER_ACTIONS = ["registerPlayer", "setStorage"];
const PLAYER_STORAGE_KEYS = ["gameMode", "duration", "gameOver", "gameResult", "started"];

/** Actions that send further game actions: only the server does that, not every client again */
const SERVER_SIDE_EFFECT_ACTIONS = ["createScoreboard", "clearScoreboard", "updateScore", "clearAllRides", "connectionDetails"];

const isServerPlayer = (player: number) => player === 0 || player === -1;

function checkPermission(name: string, event: GameActionEventArgs<any>): GameActionResult | null {
  if (isServerPlayer(event.player)) return null;

  const denied = (message: string): GameActionResult => ({ error: 1, errorTitle: "Not allowed", errorMessage: message });
  if (PLAYER_ACTIONS.indexOf(name) === -1) {
    return denied("Only the server can do this.");
  }
  if (name === "setStorage") {
    const key = event.args && event.args.key;
    if (PLAYER_STORAGE_KEYS.indexOf(key) === -1 || context.getParkStorage().get("started", false)) {
      return denied("The game settings can only be chosen before the game starts.");
    }
  }
  return null;
}

function registerAction(name: string, query: ActionHandler, execute: ActionHandler): void {
  const guard = (handler: ActionHandler, isExecute: boolean): ActionHandler => (event) => {
    const denied = checkPermission(name, event);
    if (denied) return denied;
    if (isExecute && network.mode === "client" && SERVER_SIDE_EFFECT_ACTIONS.indexOf(name) !== -1) {
      return { error: 0 }; // the server sends the resulting actions to everyone
    }
    return handler(event);
  };
  context.registerAction(name, unwrapArgs(guard(query, false)), unwrapArgs(guard(execute, true)));
}

export function registerActions() {
  const seedAction = updateBoardSeedAction();
  registerAction(seedAction.name, seedAction.query, seedAction.execute);

  const dataAction = updateBoardDataAction();
  registerAction(dataAction.name, dataAction.query, dataAction.execute);

  const seedSetAction = setSeedAction();
  registerAction(seedSetAction.name, seedSetAction.query, seedSetAction.execute);

  const goalCompletionAction = setGoalCompletionAction();
  registerAction(goalCompletionAction.name, goalCompletionAction.query, goalCompletionAction.execute);

  const bingoAction = notifyBingoAction();
  registerAction(bingoAction.name, bingoAction.query, bingoAction.execute);

  const cashAction = addCashAction();
  registerAction(cashAction.name, cashAction.query, cashAction.execute);

  const moveAction = moveToAction();
  registerAction(moveAction.name, moveAction.query, moveAction.execute);

  const connectionAction = connectionDetailsAction();
  registerAction(connectionAction.name, connectionAction.query, connectionAction.execute);

  const clearAllTiles = clearAllTilesAction();
  registerAction(clearAllTiles.name, clearAllTiles.query, clearAllTiles.execute);

  const setCash = setCashAction();
  registerAction(setCash.name, setCash.query, setCash.execute);

  const inventAction = inventNextItemAction();
  registerAction(inventAction.name, inventAction.query, inventAction.execute);

  const resetResearch = resetResearchAction();
  registerAction(resetResearch.name, resetResearch.query, resetResearch.execute);

  const parkMessage = parkMessageAction();
  registerAction(parkMessage.name, parkMessage.query, parkMessage.execute);

  const networkMessage = networkMessageAction();
  registerAction(networkMessage.name, networkMessage.query, networkMessage.execute);

  const flatLand = flatAllLandAction();
  registerAction(flatLand.name, flatLand.query, flatLand.execute);

  const clearAllRides = clearAllRidesAction();
  registerAction(clearAllRides.name, clearAllRides.query, clearAllRides.execute);

  const removeAllLitter = removeAllLitterAction();
  registerAction(removeAllLitter.name, removeAllLitter.query, removeAllLitter.execute);

  const setStorage = setStorageAction();
  registerAction(setStorage.name, setStorage.query, setStorage.execute);

  const createScoreboard = createScoreboardAction();
  registerAction(createScoreboard.name, createScoreboard.query, createScoreboard.execute);

  const clearScoreboard = clearScoreboardAction();
  registerAction(clearScoreboard.name, clearScoreboard.query, clearScoreboard.execute);

  const updateScore = updateScoreAction();
  registerAction(updateScore.name, updateScore.query, updateScore.execute);

  const registerPlayer = registerPlayerAction();
  registerAction(registerPlayer.name, registerPlayer.query, registerPlayer.execute);


  console.log("Actions registered.");
}


