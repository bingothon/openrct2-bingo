import { BingoManager } from "./BingoManager";
import { configureBoard } from "../ui/helpers";
import { getSeed } from "../utils";

/**
 * Initialize the bingo system with the new BingoManager
 */
export function initializeBingoSystem(): BingoManager {
  const bingoManager = BingoManager.getInstance();
  
  // Get the current board
  const seed = getSeed();
  const board = configureBoard(seed);
  
  // Initialize the bingo game
  bingoManager.initializeGame(board);
  
  return bingoManager;
}

/**
 * Get the bingo manager instance
 */
export function getBingoManager(): BingoManager {
  return BingoManager.getInstance();
}
