import { config } from "../config";
import { startGame } from "../utils";
import { setupGameUI } from "./initializeGameUI";

/**
 * Handles game duration selection
 */
export function selectGameDuration(years: number) {
    config.gameTime.year = years;
    startGame(years);
    ui.getWindow("game-duration")?.close();
    
    // Only initialize locally if we're the server or in single-player mode
    if (network.mode === 'server' || network.mode === 'none') {
        setupGameUI();
    } else {
        console.log('Client mode - waiting for server to initialize the game');
        // Clients just wait for the server to initialize
        // The server will handle the game initialization
    }
}


