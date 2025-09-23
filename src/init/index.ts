import { config } from "src/config";
import { initializePvpGame } from "./modes/pvp";
import { initializeCoopGame } from "./modes/coop";
import { initializeLockoutGame } from "./modes/lockout";

export function initializeGame(): void {
    switch (config.gameMode) {
        case "pvp":
            initializePvpGame();
            break;
        case "coop":
            initializeCoopGame();
            break;
        case "lockout":
            initializeLockoutGame();
            break;
    }
    
}