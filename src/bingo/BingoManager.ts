import { Bingo } from "./Bingo";
import { BingoBoard, Player } from "../types";
import { config } from "../config";
import { logger } from "../logger";
import { setGoalCompletionStatus, updateGoalUI, triggerBingo } from "./main";
import { updateScore, createScoreboard, clearScoreboard } from "./notifications/scoreboard";

export class BingoManager {
  private bingo: Bingo;
  private static instance: BingoManager;

  private constructor() {
    this.bingo = new Bingo();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): BingoManager {
    if (!BingoManager.instance) {
      BingoManager.instance = new BingoManager();
    }
    return BingoManager.instance;
  }

  /**
   * Initialize the bingo game with a board
   */
  public initializeGame(board: BingoBoard, gameMode: "coop" | "pvp" | "lockout" = config.gameMode): void {
    this.bingo.setGameMode(gameMode);
    this.bingo.setBoard(board);
    
    // No automatic player registration - players must use /register COLOR command
  }


  /**
   * Complete a goal with specific colors (for debug shortkeys)
   */
  public completeGoalWithColors(goalSlot: string, colors: string[]): boolean {
    const goalKey = `goal_${goalSlot}`;
    const board = this.bingo.getState().board;
    
    // Find goal using ES5 compatible method
    let goal: any = null;
    for (let i = 0; i < board.length; i++) {
      if (board[i].slot === goalSlot) {
        goal = board[i];
        break;
      }
    }
    
    if (!goal) {
      logger.warn(`Goal with slot ${goalSlot} not found`);
      return false;
    }

    // Check game mode and existing completion status
    const state = this.bingo.getState();
    const gameConfig = this.getGameModeConfig();
    
    // If goal is already completed and we're in lockout mode, reject
    if (goal.status === "completed" && !gameConfig.allowMultipleSelections) {
      logger.warn(`Goal ${goalSlot} already completed in lockout mode`);
      return false;
    }

    // Get existing colors and merge with new ones
    const existingColors = goal.colors === "blank" ? [] : goal.colors.split(/[ ,]+/).filter(Boolean);
    const allColors = this.unionUnique(existingColors, colors);
    
    console.log(`Debug: Existing colors: [${existingColors.join(", ")}]`);
    console.log(`Debug: New colors: [${colors.join(", ")}]`);
    console.log(`Debug: All colors: [${allColors.join(", ")}]`);
    console.log(`Debug: Game mode: ${state.gameMode}, Allow multiple: ${gameConfig.allowMultipleSelections}`);

    // Update the goal in our bingo state FIRST
    goal.status = "completed";
    goal.colors = allColors.join(" ");

    // Update player completed goals in Bingo class
    // In lockout mode, only the first player gets credit
    // In PVP/Coop mode, all players in the colors array get credit
    const playersToUpdate = gameConfig.allowMultipleSelections ? colors : [colors[0]];
    
    for (let i = 0; i < playersToUpdate.length; i++) {
      const player = this.getPlayerByColor(playersToUpdate[i]);
      if (player) {
        // Add goal slot to player's completed goals if not already there
        let found = false;
        for (let j = 0; j < player.completedGoals.length; j++) {
          if (player.completedGoals[j] === goalSlot) {
            found = true;
            break;
          }
        }
        if (!found) {
          player.completedGoals.push(goalSlot);
          console.log(`Debug: Added goal ${goalSlot} to player ${player.name} (${player.color})`);
        }
      }
    }

    // Update goal completion status
    setGoalCompletionStatus(goalKey, true, goal.name, () => {
      // Store colors in park storage for persistence
      const colorsKey = `${goalKey}_colors`;
      context.getParkStorage().set(colorsKey, JSON.stringify(allColors));

      // Update UI
      const goalIndex = this.bingo.getState().board.indexOf(goal);
      if (goalIndex >= 0) {
        updateGoalUI(goalIndex, this.bingo.getState().board);
      }

      // Check for bingos
      const completedBingos = this.bingo.checkForBingos();
      completedBingos.forEach(bingoLine => {
        triggerBingo(bingoLine);
      });

      // Update scoreboard for players who completed goals (in PVP/Lockout modes)
      const gameConfig = this.getGameModeConfig();
      console.log(`Debug: Game mode: ${state.gameMode}, Score tracking: ${gameConfig.scoreTracking}`);
      if (gameConfig.scoreTracking) {
        console.log("Debug: Updating scoreboard for players who completed goals...");
        // Only update the players who actually completed this goal
        for (let i = 0; i < playersToUpdate.length; i++) {
          const player = this.getPlayerByColor(playersToUpdate[i]);
          if (player) {
            this.updatePlayerScoreboard(player.id);
          }
        }
      } else {
        console.log("Debug: Score tracking disabled, skipping scoreboard update");
      }

      logger.info(`Goal ${goalSlot} completed with colors: [${allColors.join(", ")}]`);
    });

    return true;
  }

  /**
   * Get current game mode configuration
   */
  private getGameModeConfig(): any {
    const state = this.bingo.getState();
    
    const gameModeConfigs = {
      "coop": {
        allowMultipleSelections: true,
        maxPlayers: 4,
        mapDivision: false,
        scoreTracking: false
      },
      "pvp": {
        allowMultipleSelections: true,
        maxPlayers: 4,
        mapDivision: true,
        scoreTracking: true
      },
      "lockout": {
        allowMultipleSelections: false,
        maxPlayers: 4,
        mapDivision: true,
        scoreTracking: true
      }
    };
    
    return gameModeConfigs[state.gameMode as keyof typeof gameModeConfigs] || gameModeConfigs["coop"];
  }

  /**
   * Merge arrays with uniqueness (ES5 compatible)
   */
  private unionUnique(existing: string[], incoming: string[]): string[] {
    const seen: { [key: string]: boolean } = {};
    const result: string[] = [];
    
    function addIfNew(value: string) {
      const key = value.toLowerCase();
      if (!seen[key]) {
        seen[key] = true;
        result.push(value);
      }
    }
    
    for (let i = 0; i < existing.length; i++) {
      addIfNew(existing[i]);
    }
    for (let j = 0; j < incoming.length; j++) {
      addIfNew(incoming[j]);
    }
    
    return result;
  }

  /**
   * Clear all goals (for debug shortkeys)
   */
  public clearAllGoals(): void {
    console.log("Debug: Clearing all goals...");
    
    // Use the Bingo class to reset the core state
    this.bingo.resetGame();
    
    // Clear park storage
    this.clearParkStorage();
    
    // Update UI
    this.updateUIAfterReset();

    // Reset scoreboard (always reset scores to 0 when clearing goals)
    this.updateAllPlayerScoreboards();

    logger.info("All goals cleared successfully");
  }

  /**
   * Reset the entire board (full reset)
   */
  public resetBoard(): void {
    console.log("Debug: Full board reset...");
    
    // Use the Bingo class to reset everything
    this.bingo.resetBoard();
    
    // Clear park storage
    this.clearParkStorage();
    
    // Update UI
    this.updateUIAfterReset();

    // Reset scoreboard (always reset scores to 0 when resetting board)
    this.updateAllPlayerScoreboards();

    logger.info("Board completely reset");
  }

  /**
   * Clear park storage for all goals
   */
  private clearParkStorage(): void {
    for (let i = 1; i <= 25; i++) {
      const goalKey = `goal_${i}`;
      const colorsKey = `${goalKey}_colors`;
      
      context.getParkStorage().set(goalKey, false);
      context.getParkStorage().set(colorsKey, "[]");
    }
  }

  /**
   * Update UI after reset
   */
  private updateUIAfterReset(): void {
    try {
      const window = ui.getWindow("bingo-board");
      if (window) {
        const board = this.bingo.getState().board;
        
        // Update each goal's UI to show incomplete state
        for (let i = 0; i < board.length; i++) {
          const btn = window.findWidget<ButtonWidget>(`slot${i + 1}`);
          const label = window.findWidget<LabelWidget>(`slot${i + 1}_text`);
          
          if (btn && label) {
            // Reset button to incomplete state (same as initial render)
            btn.isPressed = false;
            btn.border = true;
            
            // Reset label text to original goal name (remove checkmarks)
            const goal = board[i];
            if (goal) {
              // Reset the goal's colors to blank
              goal.colors = "blank";
              
              // Set label text to just the goal name (no checkmarks)
              label.text = goal.name;
              label.textAlign = "centred";
              
              // Reset label position to center it properly
              const buttonSize = 100;
              const labelYOffset = Math.floor((buttonSize - 12) / 2);
              label.y = btn.y + labelYOffset;
              label.height = 12;
            }
          }
        }
        console.log("Debug: UI updated to show all goals as incomplete");
      } else {
        console.log("Debug: Bingo board window not found, cannot update UI");
      }
    } catch (uiErr) {
      console.log("Debug: Error updating UI:", uiErr);
    }
  }

  /**
   * Get player by color name
   */
  public getPlayerByColor(color: string): Player | null {
    const players = this.bingo.getActivePlayers();
    for (let i = 0; i < players.length; i++) {
      if (players[i].color.toLowerCase() === color.toLowerCase()) {
        return players[i];
      }
    }
    return null;
  }

  /**
   * Get all players
   */
  public getAllPlayers(): Player[] {
    return this.bingo.getActivePlayers();
  }

  /**
   * Get bingo instance for direct access
   */
  public getBingo(): Bingo {
    return this.bingo;
  }

  /**
   * Get debug information
   */
  public getDebugInfo(): string {
    return this.bingo.getDebugInfo();
  }

  /**
   * Register a player
   */
  public registerPlayer(playerId: string, playerName: string, color: string): boolean {
    return this.bingo.registerPlayer(playerId, playerName, color);
  }

  /**
   * Unregister a player
   */
  public unregisterPlayer(playerId: string): boolean {
    return this.bingo.unregisterPlayer(playerId);
  }

  /**
   * Select a goal for a player
   */
  public selectGoal(goalSlot: string, playerId: string): boolean {
    return this.bingo.selectGoal(goalSlot, playerId);
  }

  /**
   * Get player statistics
   */
  public getPlayerStats(playerId: string): { completedGoals: number; totalGoals: number } | null {
    return this.bingo.getPlayerStats(playerId);
  }

  /**
   * Check for bingo lines
   */
  public checkForBingos(): string[] {
    return this.bingo.checkForBingos();
  }

  /**
   * Set game mode
   */
  public setGameMode(mode: "coop" | "pvp" | "lockout"): void {
    this.bingo.setGameMode(mode);
  }

  /**
   * Start the game
   */
  public startGame(): void {
    this.bingo.startGame();
  }

  /**
   * Reset the game
   */
  public resetGame(): void {
    this.bingo.resetGame();
  }

  /**
   * Update scoreboard for a specific player based on their completed goals
   */
  public updatePlayerScoreboard(playerId: string): void {
    const player = this.bingo.getPlayer(playerId);
    if (!player) {
      logger.warn(`Player ${playerId} not found for scoreboard update`);
      return;
    }

    const stats = this.bingo.getPlayerStats(playerId);
    if (!stats) {
      logger.warn(`Could not get stats for player ${playerId}`);
      return;
    }

    // Map player ID to scoreboard player number (0-3)
    const playerNumber = this.getPlayerNumberForScoreboard(playerId);
    if (playerNumber === -1) {
      logger.warn(`Player ${playerId} not mapped to scoreboard position`);
      return;
    }

    // Update the scoreboard with completed goals count
    updateScore(playerNumber, stats.completedGoals);
    logger.info(`Updated scoreboard for player ${playerId} (${player.color}): ${stats.completedGoals} goals`);
  }

  /**
   * Update scoreboard for all active players
   */
  public updateAllPlayerScoreboards(): void {
    const activePlayers = this.bingo.getActivePlayers();
    console.log(`Debug: Updating scoreboard for ${activePlayers.length} active players`);
    for (let i = 0; i < activePlayers.length; i++) {
      console.log(`Debug: Updating scoreboard for player ${activePlayers[i].id} (${activePlayers[i].color})`);
      this.updatePlayerScoreboard(activePlayers[i].id);
    }
  }

  /**
   * Create the scoreboard (for PVP/Lockout modes)
   */
  public createScoreboard(): void {
    try {
      createScoreboard();
      logger.info("Scoreboard created successfully");
    } catch (error) {
      logger.error("Failed to create scoreboard:", error);
    }
  }

  /**
   * Clear the scoreboard
   */
  public clearScoreboard(): void {
    try {
      clearScoreboard();
      logger.info("Scoreboard cleared successfully");
    } catch (error) {
      logger.error("Failed to clear scoreboard:", error);
    }
  }

  /**
   * Map player ID to scoreboard player number (0-3)
   */
  private getPlayerNumberForScoreboard(playerId: string): number {
    // Map based on player color to maintain consistency
    const player = this.bingo.getPlayer(playerId);
    if (!player) return -1;

    switch (player.color.toLowerCase()) {
      case "red": return 2;    // Bottom-left
      case "blue": return 3;   // Bottom-right
      case "green": return 0;  // Top-left
      case "yellow": return 1; // Top-right
      default: return -1;
    }
  }

  /**
   * Get scoreboard player number for a color
   */
  public getScoreboardPlayerNumber(color: string): number {
    switch (color.toLowerCase()) {
      case "red": return 2;    // Bottom-left
      case "blue": return 3;   // Bottom-right
      case "green": return 0;  // Top-left
      case "yellow": return 1; // Top-right
      default: return -1;
    }
  }
}
