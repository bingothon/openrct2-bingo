import { config } from "../config";
import { showGameDurationDialog } from "./showGameDurationDialog";
import { GameManager } from "../managers/GameManager";

/**
 * Handles game mode selection
 */
export function selectGameMode(mode: "coop" | "pvp" | "lockout") {
    config.gameMode = mode;
    console.log(`Selected ${mode.toUpperCase()} mode`);
    
    // Update the GameManager with the new game mode
    const gameManager = GameManager.getInstance();
    gameManager.setGameMode(mode);
    console.log(`GameManager updated to ${mode.toUpperCase()} mode`);
    
    ui.getWindow("game-mode")?.close();
    showGameDurationDialog();
}


