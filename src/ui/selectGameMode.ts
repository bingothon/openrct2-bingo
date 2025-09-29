import { config } from "../config";
import { showGameDurationDialog } from "./showGameDurationDialog";
import { GameManager } from "../managers/GameManager";

/**
 * Handles game mode selection
 */
export function selectGameMode(mode: "coop" | "pvp" | "lockout") {
    config.gameMode = mode;
    console.log(`Selected ${mode.toUpperCase()} mode`);
    
    // Store game mode in synchronized game state so server can read it
    context.executeAction('setStorage', { args: { key: 'gameMode', value: mode } });
    console.log(`Game mode ${mode} stored in game state for server synchronization`);
    
    // Update the GameManager with the new game mode
    const gameManager = GameManager.getInstance();
    gameManager.setGameMode(mode);
    console.log(`GameManager updated to ${mode.toUpperCase()} mode`);
    
    ui.getWindow("game-mode")?.close();
    showGameDurationDialog();
}


