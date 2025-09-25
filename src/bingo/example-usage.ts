/**
 * Example usage of the Bingo class system
 * This file demonstrates how to use the new BingoManager for board selections
 */

import { BingoManager } from "./BingoManager";
import { initializeBingoSystem } from "./integration";

// Example 1: Basic initialization
export function exampleBasicUsage() {
  // Initialize the bingo system
  const bingoManager = initializeBingoSystem();
  
  // Register players
  bingoManager.registerPlayer("player1", "Alice", "red");
  bingoManager.registerPlayer("player2", "Bob", "blue");
  bingoManager.registerPlayer("player3", "Charlie", "green");
  bingoManager.registerPlayer("player4", "Diana", "yellow");
  
  console.log("Bingo system initialized with 4 players");
}

// Example 2: Game mode switching
export function exampleGameModeSwitching() {
  const bingoManager = BingoManager.getInstance();
  
  // Switch to PVP mode
  bingoManager.setGameMode("pvp");
  console.log("Switched to PVP mode - map will be divided into regions");
  
  // Switch to Lockout mode
  bingoManager.setGameMode("lockout");
  console.log("Switched to Lockout mode - only one player can select each goal");
  
  // Switch back to Coop mode
  bingoManager.setGameMode("coop");
  console.log("Switched to Coop mode - multiple players can select same goals");
}

// Example 3: Goal selection and tracking
export function exampleGoalSelection() {
  const bingoManager = BingoManager.getInstance();
  
  // Register some players
  bingoManager.registerPlayer("alice", "Alice", "red");
  bingoManager.registerPlayer("bob", "Bob", "blue");
  
  // Alice selects goal 1
  const success1 = bingoManager.selectGoal("1", "alice");
  console.log(`Alice selecting goal 1: ${success1 ? "Success" : "Failed"}`);
  
  // Bob also selects goal 1 (works in coop/pvp, fails in lockout)
  const success2 = bingoManager.selectGoal("1", "bob");
  console.log(`Bob selecting goal 1: ${success2 ? "Success" : "Failed"}`);
  
  // Get player statistics
  const aliceStats = bingoManager.getPlayerStats("alice");
  const bobStats = bingoManager.getPlayerStats("bob");
  
  console.log(`Alice completed ${aliceStats?.completedGoals} goals`);
  console.log(`Bob completed ${bobStats?.completedGoals} goals`);
}

// Example 4: Bingo detection
export function exampleBingoDetection() {
  const bingoManager = BingoManager.getInstance();
  
  // Complete a full row (goals 1-5)
  bingoManager.selectGoal("1", "alice");
  bingoManager.selectGoal("2", "alice");
  bingoManager.selectGoal("3", "alice");
  bingoManager.selectGoal("4", "alice");
  bingoManager.selectGoal("5", "alice");
  
  // Check for bingos
  const completedBingos = bingoManager.checkForBingos();
  console.log(`Completed bingo lines: ${completedBingos.join(", ")}`);
}

// Example 5: Debug information
export function exampleDebugInfo() {
  const bingoManager = BingoManager.getInstance();
  
  // Get debug information
  const debugInfo = bingoManager.getDebugInfo();
  console.log("Debug Info:", debugInfo);
  
  // Get all players
  const players = bingoManager.getAllPlayers();
  console.log("All players:", players.map(p => `${p.name} (${p.color})`));
  
  // Get player by color
  const redPlayer = bingoManager.getPlayerByColor("red");
  if (redPlayer) {
    console.log(`Red player: ${redPlayer.name}`);
  }
}

// Example 6: Integration with existing debug shortkeys
export function exampleDebugIntegration() {
  const bingoManager = BingoManager.getInstance();
  
  // Complete a goal with multiple colors (like the debug shortkeys do)
  bingoManager.completeGoalWithColors("1", ["red", "blue", "green"]);
  console.log("Goal 1 completed with red, blue, and green colors");
  
  // Clear all goals
  bingoManager.clearAllGoals();
  console.log("All goals cleared");
}

// Example 7: Map region assignment (for PVP/Lockout modes)
export function exampleMapRegions() {
  const bingoManager = BingoManager.getInstance();
  
  // Set to PVP mode to enable map division
  bingoManager.setGameMode("pvp");
  
  // Register players (they'll get map regions assigned)
  bingoManager.registerPlayer("player1", "Player 1", "red");
  bingoManager.registerPlayer("player2", "Player 2", "blue");
  bingoManager.registerPlayer("player3", "Player 3", "green");
  bingoManager.registerPlayer("player4", "Player 4", "yellow");
  
  // Check player regions
  const players = bingoManager.getAllPlayers();
  players.forEach(player => {
    if (player.mapRegion) {
      console.log(`${player.name} (${player.color}) assigned to ${player.mapRegion.name} region: (${player.mapRegion.x1},${player.mapRegion.y1}) to (${player.mapRegion.x2},${player.mapRegion.y2})`);
    }
  });
}
