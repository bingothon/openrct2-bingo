import { subscribeToInventions, subscribeToRenewRides } from "../subscriptions/game";
import { subscribeToServerInitialization } from "../subscriptions/server";
import { getSeed } from "../utils";
import { configureBoard } from "./helpers";
import { subscribeToGoalChecks } from "../subscriptions/game";
import { openBingoBoard } from "./openBingoBoard";
import { showConnectDialog } from "./showConnectDialog";
import { showGameDurationDialog } from "./showGameDurationDialog";
import { initializeBingoSystem } from "../bingo/integration";

/**
 * Initializes the game after mode and duration selection
 */
export function initializeLocalGame() {
  console.log("Initializing game after mode and duration selection...");
  
  // Set up game systems
  subscribeToInventions();
  subscribeToRenewRides();
  subscribeToServerInitialization(showGameDurationDialog); // Handles map initialization (trees, paths, etc.)

  // Initialize game board and UI
  const seed = getSeed();
  const board = configureBoard(seed);
  
  // Initialize the BingoManager with the board
  initializeBingoSystem();
  
  subscribeToGoalChecks(board);
  openBingoBoard(board);
  
  // Only show connect dialog in local/single-player mode
  if (network.mode === "none") {
    showConnectDialog();
  }
  
  console.log("Game initialized successfully.");
}


