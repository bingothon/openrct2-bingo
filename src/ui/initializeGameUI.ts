import { subscribeToInventions, subscribeToRenewRides, subscribeToWeather } from "../subscriptions/game";
// import { subscribeToServerInitialization } from "../subscriptions/server"; // LEGACY - removed to prevent duplicate initialization
import { getSeed } from "../utils";
import { configureBoard } from "./helpers";
// Goal checking is now handled by GoalManager
import { openBingoBoard } from "./openBingoBoard";
import { showConnectDialog } from "./showConnectDialog";
// import { showGameDurationDialog } from "./showGameDurationDialog"; // LEGACY - no longer used
import { initializeBingoSystem } from "../bingo/integration";

/**
 * Sets up game UI and subscriptions after mode and duration selection
 */
export function setupGameUI() {
  console.log("Setting up game UI after mode and duration selection...");
  
  // Set up game systems
  subscribeToInventions();
  subscribeToRenewRides();
  subscribeToWeather();
  // subscribeToServerInitialization(showGameDurationDialog); // LEGACY - removed to prevent duplicate initialization

  // Initialize game board and UI
  const seed = getSeed();
  const board = configureBoard(seed);
  
  // Initialize the BingoManager with the board
  initializeBingoSystem();
  
  // Goal checking is now handled by GoalManager in initializeBingoSystem()
  openBingoBoard(board);
  
  // Only show connect dialog in local/single-player mode
  if (network.mode === "none") {
    showConnectDialog();
  }
  
  console.log("Game UI setup completed successfully.");
}


