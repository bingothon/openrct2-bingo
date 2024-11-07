import type { BingoBoard } from "./types";
import { config } from "./config";
import { configureBoard } from "./ui-helpers";
import { openBingoBoard } from "./ui";
import { subscribeToGoalChecks } from "./bingo";
const NAMESPACE = config.namespace;

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
    execute: (event: GameActionEventArgs<{ seed?: number }>): GameActionResult => {
      if (!event.args || event.args.seed === undefined) {
        return { error: 1, errorMessage: "Seed is undefined or event args are missing." };
      }
      const seed = event.args.seed;
      const board = configureBoard(seed);
      subscribeToGoalChecks(board);
      openBingoBoard(board);
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
    query: (event: GameActionEventArgs<{ goalKey: string; completed: boolean }>): GameActionResult => {
      console.log("Querying goal completion action with event args:", event.args);
      return { error: 0 };
    },
    execute: (event: GameActionEventArgs<{ goalKey: string; completed: boolean }>): GameActionResult => {
      if (!event.args || event.args.goalKey === undefined || event.args.completed === undefined) {
        return { error: 1, errorMessage: "Goal key or completion status is missing." };
      }
      const parkStorage = context.getParkStorage();
      parkStorage.set(event.args.goalKey, event.args.completed);
      console.log(`Goal completion status set for ${event.args.goalKey}: ${event.args.completed}`);
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
}
