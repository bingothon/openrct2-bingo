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
  createPlayerSectionsAction
} from "./index";

export function registerActions() {
  const seedAction = updateBoardSeedAction();
  context.registerAction(seedAction.name, seedAction.query, seedAction.execute);

  const dataAction = updateBoardDataAction();
  context.registerAction(dataAction.name, dataAction.query, dataAction.execute);

  const seedSetAction = setSeedAction();
  context.registerAction(seedSetAction.name, seedSetAction.query, seedSetAction.execute);

  const goalCompletionAction = setGoalCompletionAction();
  context.registerAction(goalCompletionAction.name, goalCompletionAction.query, goalCompletionAction.execute);

  const bingoAction = notifyBingoAction();
  context.registerAction(bingoAction.name, bingoAction.query, bingoAction.execute);

  const cashAction = addCashAction();
  context.registerAction(cashAction.name, cashAction.query, cashAction.execute);

  const moveAction = moveToAction();
  context.registerAction(moveAction.name, moveAction.query, moveAction.execute);

  const connectionAction = connectionDetailsAction();
  context.registerAction(connectionAction.name, connectionAction.query, connectionAction.execute);

  const clearAllTiles = clearAllTilesAction();
  context.registerAction(clearAllTiles.name, clearAllTiles.query, clearAllTiles.execute);

  const setCash = setCashAction();
  context.registerAction(setCash.name, setCash.query, setCash.execute);

  const inventAction = inventNextItemAction();
  context.registerAction(inventAction.name, inventAction.query, inventAction.execute);

  const resetResearch = resetResearchAction();
  context.registerAction(resetResearch.name, resetResearch.query, resetResearch.execute);

  const parkMessage = parkMessageAction();
  context.registerAction(parkMessage.name, parkMessage.query, parkMessage.execute);

  const networkMessage = networkMessageAction();
  context.registerAction(networkMessage.name, networkMessage.query, networkMessage.execute);

  const flatLand = flatAllLandAction();
  context.registerAction(flatLand.name, flatLand.query, flatLand.execute);

  const clearAllRides = clearAllRidesAction();
  context.registerAction(clearAllRides.name, clearAllRides.query, clearAllRides.execute);

  const removeAllLitter = removeAllLitterAction();
  context.registerAction(removeAllLitter.name, removeAllLitter.query, removeAllLitter.execute);

  const setStorage = setStorageAction();
  context.registerAction(setStorage.name, setStorage.query, setStorage.execute);

  const createScoreboard = createScoreboardAction();
  context.registerAction(createScoreboard.name, createScoreboard.query, createScoreboard.execute);

  const clearScoreboard = clearScoreboardAction();
  context.registerAction(clearScoreboard.name, clearScoreboard.query, clearScoreboard.execute);

  const updateScore = updateScoreAction();
  context.registerAction(updateScore.name, updateScore.query, updateScore.execute);

  const createPlayerSections = createPlayerSectionsAction();
  context.registerAction(createPlayerSections.name, createPlayerSections.query, createPlayerSections.execute);

  console.log("Actions registered.");
}


