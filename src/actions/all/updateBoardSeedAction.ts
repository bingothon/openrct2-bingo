import { configureBoard } from "../../ui-helpers";
import { openBingoBoard } from "../../ui";
import { subscribeToGoalChecks } from "../../subscriptions/game";

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


