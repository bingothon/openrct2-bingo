import { config } from "../config";
import { showGameDurationDialog } from "./showGameDurationDialog";

/**
 * Handles game mode selection
 */
export function selectGameMode(mode: "coop" | "pvp" | "lockout") {
    config.gameMode = mode;
    console.log(`Selected ${mode.toUpperCase()} mode`);
    ui.getWindow("game-mode")?.close();
    showGameDurationDialog();
}


