import { BingoManager } from "./BingoManager";
import { GameManager } from "../managers/GameManager";
import { configureBoard } from "../ui/helpers";
import { getSeed } from "../utils";
import { config } from "../config";

/**
 * Initialize the bingo system with the new BingoManager and GameManager
 */
export function initializeBingoSystem(): { bingoManager: BingoManager; gameManager: GameManager } {
  const bingoManager = BingoManager.getInstance();
  const gameManager = GameManager.getInstance();
  
  // Get the current board
  const seed = getSeed();
  const board = configureBoard(seed);
  
  // Initialize the bingo game
  bingoManager.initializeGame(board);
  
  // Initialize the game manager with ground division and player management
  gameManager.initializeGame();
  
  // Set the game mode to configure building restrictions
  gameManager.setGameMode(config.gameMode);
  
  // Initialize goal checking with the new GoalManager
  console.log("[Integration] Getting GoalManager instance...");
  const goalManager = gameManager.getGoalManager();
  console.log("[Integration] GoalManager instance obtained, initializing goal checking...");
  goalManager.initializeGoalChecking(board);
  console.log("[Integration] GoalManager initialization completed");
  
  console.log("[Integration] Bingo system initialized with managers");
  console.log("[Integration] Game mode:", config.gameMode);
  console.log("[Integration] Debug info:", gameManager.getDebugInfo());
  console.log("[Integration] Goal manager debug info:", goalManager.getDebugInfo());
  
  return { bingoManager, gameManager };
}

/**
 * Get the bingo manager instance
 */
export function getBingoManager(): BingoManager {
  return BingoManager.getInstance();
}

/**
 * Get the game manager instance
 */
export function getGameManager(): GameManager {
  return GameManager.getInstance();
}
