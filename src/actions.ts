import type { BingoBoard } from "./types";
import { config } from "./config";
import { configureBoard } from "./ui-helpers";
import { openBingoBoard } from "./ui";
import { subscribeToGoalChecks } from "./bingo/main";
import { notifyTextBingo, notifyTextGoal } from "./bingo/notifications/text";
import { notifyGroundBingo } from "./bingo/notifications/ground";
import { bingosyncUI } from "./bingo/bingosync-handler";
const NAMESPACE = config.namespace;
let bingoBeingNotified = false;

/**
 * Action to update the board seed
 */
export function updateBoardSeedAction() {
  return {
    name: "updateBoardSeed",
    query: (event: GameActionEventArgs<{ seed: number }>): GameActionResult => {
      console.log("Querying action with event args:", event.args);
      return { error: 0 };
    },
    execute: (event: GameActionEventArgs<{ seed: number }>): GameActionResult => {
      if (!event.args || event.args.seed === undefined) {
        return { error: 1, errorMessage: "Seed is undefined or event args are missing." };
      }
      const seed = event.args.seed;

      const board = configureBoard(seed);
      subscribeToGoalChecks(board);

      if (typeof ui !== 'undefined') openBingoBoard(board);
      console.log(`Bingo board updated with new seed: ${seed}`);
      return { error: 0 };
    }
  };
}

/**
 * Action to update the board data
 */
export function updateBoardDataAction() {
  return {
    name: "updateBoardData",
    query: (event: GameActionEventArgs<{ board: BingoBoard }>): GameActionResult => {
      console.log("Querying action with event args:", event.args);
      return { error: 0 };
    },
    execute: (event: GameActionEventArgs<{ board: BingoBoard }>): GameActionResult => {
      if (!event.args || !event.args.board) {
        return { error: 1, errorMessage: "Board data is missing." };
      }
      subscribeToGoalChecks(event.args.board);
      openBingoBoard(event.args.board);
      console.log("Bingo board updated with new data.");
      return { error: 0 };
    }
  };
}

/**
 * Action to set the seed
 */
export function setSeedAction() {
  return {
    name: 'setSeed',
    query: (event: GameActionEventArgs<{ seed: number }>): GameActionResult => {
      console.log('Querying action with event args:', event.args);
      return { error: 0 };
    },
    execute: (event: GameActionEventArgs<{ seed?: number }>): GameActionResult => {
      if (!event.args || event.args.seed === undefined) {
        return { error: 1, errorMessage: 'Seed is undefined or event args are missing.' };
      }
      const seed = event.args.seed;
      const parkStorage = context.getParkStorage();
      parkStorage.set(`${NAMESPACE}.bingoSeed`, seed);
      console.log(`New seed set: ${seed}`);
      return { error: 0 };
    }
  };
}

/**
 * Action to set goal completion status
 */
export function setGoalCompletionAction() {
  return {
    name: "setGoalCompletion",
    query: (event: GameActionEventArgs<{ goalKey: string; completed: boolean, goalName?: string }>): GameActionResult => {
      console.log("Querying goal completion action with event args:", event.args);
      return { error: 0 };
    },
    execute: (event: GameActionEventArgs<{ goalKey: string; completed: boolean, goalName?: string }>): GameActionResult => {
      if (!event.args || event.args.goalKey === undefined || event.args.completed === undefined) {
        return { error: 1, errorMessage: "Goal key or completion status is missing." };
      }
      const parkStorage = context.getParkStorage();
      console.log(`Setting goal completion status for ${event.args.goalKey}: ${event.args.completed}`);
      parkStorage.set(event.args.goalKey, event.args.completed);
      if (event.args.goalName) {
        notifyTextGoal(event.args.goalName);
      }
      console.log(`Goal completion status set for ${event.args.goalKey}: ${event.args.completed}`);
      return { error: 0 };
    }
  };
}

export function notifyBingoAction() {
  return {
    name: "notifyBingo",
    query: (event: GameActionEventArgs<{ lineKey: string }>): GameActionResult => {
      console.log("Querying action with event args:", event.args);
      return { error: 0 };
    },
    execute: (event: GameActionEventArgs<{ lineKey: string }>): GameActionResult => {
      if (!event.args || event.args.lineKey === undefined) {
        return { error: 1, errorMessage: "Line key is missing." };
      }
      if (network.mode === "server") {
        notifyTextBingo(event.args.lineKey);
      }
      notifyGroundBingo();

      return { error: 0 };
    }
  };
}

export function addCashAction() {
  return {
    name: "addCash",
    query: (event: GameActionEventArgs<{ cash: number }>): GameActionResult => {
      console.log("Querying action with event args:", event.args);
      return { error: 0 };
    },
    execute: (event: GameActionEventArgs<{ cash: number }>): GameActionResult => {
      if (!event.args || event.args.cash === undefined) {
        return { error: 1, errorMessage: "Cash amount is missing." };
      }

      park.cash += event.args.cash;
      console.log(`Added cash: ${event.args.cash}`);
      return { error: 0 };
    }
  };
}

export function moveToAction() {
  return {
    name: "moveTo",
    query: (event: GameActionEventArgs<{ x: number; y: number }>): GameActionResult => {
      console.log("Querying action with event args:", event.args);
      return { error: 0 };
    },
    execute: (event: GameActionEventArgs<{ x: number; y: number }>): GameActionResult => {
      if (!event.args || event.args.x === undefined || event.args.y === undefined) {
        return { error: 1, errorMessage: "X or Y position is missing." };
      }

      const { x, y } = event.args;
      ui.mainViewport.moveTo({ x: x, y: y });
      console.log(`Moved view to: ${x}, ${y}`);
      return { error: 0 };
    }
  };
}

export function connectionDetailsAction() {
  return {
    name: "connectionDetails",
    query: (event: GameActionEventArgs<{ roomUrl: string; roomPassword: string }>): GameActionResult => {
      console.log("Querying action with event args:", event.args);
      return { error: 0 };
    },
    execute: (event: GameActionEventArgs<{ roomUrl: string; roomPassword: string }>): GameActionResult => {
      context.getParkStorage().set('roomUrl', event.args.roomUrl);
      context.getParkStorage().set('roomPassword', event.args.roomPassword);
      bingosyncUI()
      return { error: 0 };
    }
  };
}

export function clearAllTilesAction() {
  return {
    name: "clearAllTiles",
    query: (event: GameActionEventArgs): GameActionResult => {
      console.log("Querying action with event args:", event.args);
      return { error: 0 };
    },
    execute: (event: GameActionEventArgs): GameActionResult => {
      const mapSize = map.size; // Get the map size in tiles
      const tilesX = mapSize.x; // Total tiles in the X direction
      const tilesY = mapSize.y; // Total tiles in the Y direction

      // List of tiles to exclude
      const excludedTiles = [
        { x: 1, y: 30 },
        { x: 2, y: 30 },
        { x: 3, y: 29 },
        { x: 3, y: 30 },
        { x: 3, y: 31 }
      ];

      console.log(`Clearing map of size ${tilesX}x${tilesY} tiles...`);

      for (let x = 0; x < tilesX; x++) {
        for (let y = 0; y < tilesY; y++) {
          // Skip excluded tiles
          const isExcluded = excludedTiles.some(tile => tile.x === x && tile.y === y);
          if (isExcluded) {
            console.log(`Skipping tile at (${x}, ${y}) as it is in the excluded list.`);
            continue;
          }

          const tile = map.getTile(x, y);
          const tileElements = tile.elements;


          for (let i = 0; i < tileElements.length; i++) {
            if (tileElements[i].type !== "surface") {
              tile.removeElement(i);
            }
          }

        }
      }
      return { error: 0 };
    }
  };
}

export function setCashAction() {
  return {
    name: "setCash",
    query: (event: GameActionEventArgs<{ cash: number }>): GameActionResult => {
      console.log("Querying action with event args:", event.args);
      return { error: 0 };
    },
    execute: (event: GameActionEventArgs<{ cash: number }>): GameActionResult => {
      if (!event.args || event.args.cash === undefined) {
        return { error: 1, errorMessage: "Cash amount is missing." };
      }

      park.cash = event.args.cash;
      console.log(`Set cash to: ${event.args.cash}`);
      return { error: 0 };
    }
  };
}






/**
 * Registers all actions individually
 */
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

  console.log("Actions registered.");
}
