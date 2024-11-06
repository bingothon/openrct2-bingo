import type { BingoBoard } from "./types";
import { config } from "./config";
import { subscribeToGoalChecks } from "./ui-helpers";
const NAMESPACE = config.namespace;

/**
 * Action to update the board seed
 */
export function updateBoardSeedAction(newBoard: (seed: number, parkStorage: Configuration) => BingoBoard, openBingoBoard: (board: BingoBoard) => void) {
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
      const parkStorage = context.getParkStorage();
      const board = newBoard(seed, parkStorage);
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
export function updateBoardDataAction(openBingoBoard: (board: BingoBoard) => void) {
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
export function setSeedAction(context: any) {
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
      context.getParkStorage().set(`${NAMESPACE}.bingoSeed`, seed);
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
      context.getParkStorage().set(event.args.goalKey, event.args.completed);
      console.log(`Goal completion status set for ${event.args.goalKey}: ${event.args.completed}`);
      return { error: 0 };
    }
  };
}

/**
 * Registers all actions
 */
export function registerActions(context: any, newBoard: (seed: number, parkStorage: Configuration) => BingoBoard, openBingoBoard: (board: BingoBoard) => void) {
  const actions = [
    updateBoardSeedAction(newBoard, openBingoBoard),
    updateBoardDataAction(openBingoBoard),
    setSeedAction(context),
    setGoalCompletionAction()  // Register the custom goal completion action
  ];

  actions.forEach(action => {
    context.registerAction(action.name, action.query, action.execute);
  });
}
