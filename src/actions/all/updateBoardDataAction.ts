import type { BingoBoard } from "../../types";
import { openBingoBoard } from "../../ui";
import { subscribeToGoalChecks } from "../../subscriptions/game";

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


