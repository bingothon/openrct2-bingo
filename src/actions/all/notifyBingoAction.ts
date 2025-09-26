import { notifyTextBingo } from "../../bingo/notifications/text";
import { notifyGroundBingo } from "../../bingo/notifications/ground";
import { config } from "../../config";

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
      
      // Debug: Log current game mode
      console.log(`[notifyBingoAction] Current game mode: ${config.gameMode}`);
      
      // Only show ground notifications for COOP mode
      if (config.gameMode === "coop") {
        console.log("COOP mode: Showing ground bingo notification");
        notifyGroundBingo();
      } else {
        console.log(`${config.gameMode.toUpperCase()} mode: Skipping ground bingo notification`);
      }

      return { error: 0 };
    }
  };
}


