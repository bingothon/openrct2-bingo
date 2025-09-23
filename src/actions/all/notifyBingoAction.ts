import { notifyTextBingo } from "../../bingo/notifications/text";
import { notifyGroundBingo } from "../../bingo/notifications/ground";

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


