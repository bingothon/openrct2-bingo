import { config } from "../config";
import { startGame } from "../utils";
import { initializeLocalGame } from "./initializeLocalGame";

/**
 * Handles game duration selection
 */
export function selectGameDuration(years: number) {
    config.gameTime.year = years;
    startGame(years);
    ui.getWindow("game-duration")?.close();
    initializeLocalGame();
}


