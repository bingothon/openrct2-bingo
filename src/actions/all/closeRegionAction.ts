import { GameManager } from "../../managers/GameManager";
import { COLOR_TO_REGION } from "../../bingo/playerColours";
import { markColourClosed } from "../../bingo/closedRegions";

/**
 * PvP/Lockout: closes a colour whose player left (leavingPlayers.ts). Runs on the server and every
 * client, so everyone drops the registration and sees the colour as closed. The server clears the
 * region itself afterwards.
 */
export function closeRegionAction() {
  return {
    name: "closeRegion",
    query: (event: GameActionEventArgs<{ colour: string }>): GameActionResult =>
      event.args && COLOR_TO_REGION[event.args.colour] ? { error: 0 } : { error: 1, errorMessage: "Unknown colour." },
    execute: (event: GameActionEventArgs<{ colour: string }>): GameActionResult => {
      const entry = event.args && COLOR_TO_REGION[event.args.colour];
      if (!entry) return { error: 1, errorMessage: "Unknown colour." };

      markColourClosed(event.args.colour);
      GameManager.getInstance().getPlayerManager().unregisterPlayerFromRegion(entry.region);
      return { error: 0 };
    },
  };
}
