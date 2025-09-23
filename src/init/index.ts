import { config } from "src/config";
import { initializePvpGame } from "./modes/pvp";
import { initializeCoopGame } from "./modes/coop";

export function initializeGame(): void {
    if (config.gameMode === "pvp") {
        initializePvpGame();
    } else {
        initializeCoopGame();
    }
}