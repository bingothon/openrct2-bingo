import { Goal, BingoBoard, Player, MapRegion, GameModeConfig, BingoState } from "../types";
import { config } from "../config";
import { logger } from "../logger";

export class Bingo {
  private state: BingoState;
  private gameModeConfigs: { [key: string]: GameModeConfig } = {};
  private colorMapping: { [key: string]: string } = {}; // color name -> color token

  constructor() {
    this.state = {
      gameMode: config.gameMode,
      players: {},
      activePlayers: [],
      board: [],
      completedBingos: [],
      gameStarted: false,
      seed: config.defaultSeed
    };

    this.initializeGameModeConfigs();
    this.initializeColorMapping();
  }

  /**
   * Initialize game mode configurations
   */
  private initializeGameModeConfigs(): void {
    this.gameModeConfigs = {
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
  }

  /**
   * Initialize color name to token mapping
   */
  private initializeColorMapping(): void {
    this.colorMapping = {
      "red": "RED",
      "blue": "BLUE",
      "green": "GREEN",
      "yellow": "YELLOW",
      "purple": "PURPLE",
      "orange": "ORANGE",
      "white": "WHITE",
      "black": "BLACK"
    };
  }

  /**
   * Get current game mode configuration
   */
  private getGameModeConfig(): GameModeConfig {
    return this.gameModeConfigs[this.state.gameMode] || this.gameModeConfigs["coop"];
  }

  /**
   * Register a new player
   */
  public registerPlayer(playerId: string, playerName: string, color: string): boolean {
    const gameConfig = this.getGameModeConfig();
    
    // Check if we've reached max players
    const playerCount = Object.keys(this.state.players).length;
    if (playerCount >= gameConfig.maxPlayers) {
      logger.warn(`Cannot register player ${playerName}: maximum players (${gameConfig.maxPlayers}) reached`);
      return false;
    }

    // Check if player already exists
    if (this.state.players[playerId]) {
      logger.warn(`Player ${playerId} already registered`);
      return false;
    }

    const colorToken = this.colorMapping[color.toLowerCase()];
    if (!colorToken) {
      logger.warn(`Invalid color ${color} for player ${playerName}`);
      return false;
    }

    const player: Player = {
      id: playerId,
      name: playerName,
      color: color,
      colorToken: colorToken,
      isActive: true,
      completedGoals: []
    };

    // Assign map region for PVP/Lockout modes
    if (gameConfig.mapDivision) {
      player.mapRegion = this.assignMapRegion(playerCount);
    }

    this.state.players[playerId] = player;
    this.state.activePlayers.push(playerId);

    logger.info(`Registered player ${playerName} (${color}) with ID ${playerId}`);
    return true;
  }

  /**
   * Assign map region for PVP/Lockout modes
   */
  private assignMapRegion(playerIndex: number): MapRegion {
    const mapSize = map.size;
    const tileSize = 32;
    const mapWidth = mapSize.x * tileSize;
    const mapHeight = mapSize.y * tileSize;

    // Divide map into 4 quadrants
    const regions: MapRegion[] = [
      { x1: 0, y1: 0, x2: mapWidth / 2 - 1, y2: mapHeight / 2 - 1, name: "Top-Left" },
      { x1: mapWidth / 2, y1: 0, x2: mapWidth - 1, y2: mapHeight / 2 - 1, name: "Top-Right" },
      { x1: 0, y1: mapHeight / 2, x2: mapWidth / 2 - 1, y2: mapHeight - 1, name: "Bottom-Left" },
      { x1: mapWidth / 2, y1: mapHeight / 2, x2: mapWidth - 1, y2: mapHeight - 1, name: "Bottom-Right" }
    ];

    return regions[playerIndex] || regions[0];
  }

  /**
   * Unregister a player
   */
  public unregisterPlayer(playerId: string): boolean {
    if (!this.state.players[playerId]) {
      logger.warn(`Player ${playerId} not found`);
      return false;
    }

    const player = this.state.players[playerId];
    delete this.state.players[playerId];
    
    const activeIndex = this.state.activePlayers.indexOf(playerId);
    if (activeIndex > -1) {
      this.state.activePlayers.splice(activeIndex, 1);
    }

    logger.info(`Unregistered player ${player.name}`);
    return true;
  }

  /**
   * Set the bingo board
   */
  public setBoard(board: BingoBoard): void {
    this.state.board = board;
    logger.info(`Bingo board set with ${board.length} goals`);
  }

  /**
   * Select a goal for a specific player
   */
  public selectGoal(goalSlot: string, playerId: string): boolean {
    const player = this.state.players[playerId];
    if (!player) {
      logger.warn(`Player ${playerId} not found`);
      return false;
    }

    // Find goal using ES5 compatible method
    let goal: Goal | null = null;
    for (let i = 0; i < this.state.board.length; i++) {
      if (this.state.board[i].slot === goalSlot) {
        goal = this.state.board[i];
        break;
      }
    }
    
    if (!goal) {
      logger.warn(`Goal with slot ${goalSlot} not found`);
      return false;
    }

    const gameConfig = this.getGameModeConfig();

    // Check if goal is already completed
    if (goal.status === "completed") {
      // In lockout mode, only one player can select a goal
      if (!gameConfig.allowMultipleSelections) {
        logger.warn(`Goal ${goalSlot} already completed in lockout mode`);
        return false;
      }
    }

    // Mark goal as completed
    goal.status = "completed";
    
    // Add player color to goal colors
    const existingColors = goal.colors === "blank" ? [] : goal.colors.split(/[ ,]+/).filter(Boolean);
    if (existingColors.indexOf(player.color) === -1) {
      existingColors.push(player.color);
    }
    goal.colors = existingColors.join(" ");

    // Track completion for this player
    if (player.completedGoals.indexOf(goalSlot) === -1) {
      player.completedGoals.push(goalSlot);
    }

    logger.info(`Player ${player.name} selected goal ${goalSlot}: ${goal.name}`);
    return true;
  }

  /**
   * Get all players who have completed a specific goal
   */
  public getGoalCompleters(goalSlot: string): Player[] {
    const completers: Player[] = [];
    const playerKeys = Object.keys(this.state.players);
    for (let i = 0; i < playerKeys.length; i++) {
      const player = this.state.players[playerKeys[i]];
      if (player.completedGoals.indexOf(goalSlot) !== -1) {
        completers.push(player);
      }
    }
    return completers;
  }

  /**
   * Get player statistics
   */
  public getPlayerStats(playerId: string): { completedGoals: number; totalGoals: number } | null {
    const player = this.state.players[playerId];
    if (!player) return null;

    return {
      completedGoals: player.completedGoals.length,
      totalGoals: this.state.board.length
    };
  }

  /**
   * Check for bingo lines and return completed lines
   */
  public checkForBingos(): string[] {
    const completedLines: string[] = [];

    // Check rows and columns
    for (let i = 0; i < 5; i++) {
      if (this.isLineCompleted('row', i) && this.state.completedBingos.indexOf(`row_${i}`) === -1) {
        completedLines.push(`row_${i}`);
        this.state.completedBingos.push(`row_${i}`);
      }
      if (this.isLineCompleted('column', i) && this.state.completedBingos.indexOf(`column_${i}`) === -1) {
        completedLines.push(`column_${i}`);
        this.state.completedBingos.push(`column_${i}`);
      }
    }

    // Check diagonals
    if (this.isLineCompleted('diagonal', 0) && this.state.completedBingos.indexOf('diagonal_0') === -1) {
      completedLines.push('diagonal_0');
      this.state.completedBingos.push('diagonal_0');
    }
    if (this.isLineCompleted('diagonal', 1) && this.state.completedBingos.indexOf('diagonal_1') === -1) {
      completedLines.push('diagonal_1');
      this.state.completedBingos.push('diagonal_1');
    }

    return completedLines;
  }

  /**
   * Check if a specific line is completed
   */
  private isLineCompleted(type: 'row' | 'column' | 'diagonal', index: number): boolean {
    const goals: Goal[] = [];

    for (let i = 0; i < 5; i++) {
      switch (type) {
        case 'row':
          goals.push(this.state.board[i * 5 + index]);
          break;
        case 'column':
          goals.push(this.state.board[index * 5 + i]);
          break;
        case 'diagonal':
          goals.push(this.state.board[i * 5 + (index === 0 ? i : 4 - i)]);
          break;
      }
    }

    // ES5 compatible every() implementation
    for (let i = 0; i < goals.length; i++) {
      if (goals[i].status !== "completed") {
        return false;
      }
    }
    return true;
  }

  /**
   * Get all active players
   */
  public getActivePlayers(): Player[] {
    const players: Player[] = [];
    for (let i = 0; i < this.state.activePlayers.length; i++) {
      const player = this.state.players[this.state.activePlayers[i]];
      if (player) {
        players.push(player);
      }
    }
    return players;
  }

  /**
   * Get player by ID
   */
  public getPlayer(playerId: string): Player | null {
    return this.state.players[playerId] || null;
  }

  /**
   * Get current game state
   */
  public getState(): BingoState {
    return { ...this.state };
  }

  /**
   * Set game mode
   */
  public setGameMode(mode: "coop" | "pvp" | "lockout"): void {
    this.state.gameMode = mode;
    logger.info(`Game mode changed to ${mode}`);
  }

  /**
   * Start the game
   */
  public startGame(): void {
    this.state.gameStarted = true;
    logger.info("Bingo game started");
  }

  /**
   * Reset the game
   */
  public resetGame(): void {
    this.state.completedBingos = [];
    this.state.gameStarted = false;
    
    // Reset all goals
    for (let i = 0; i < this.state.board.length; i++) {
      this.state.board[i].status = "incomplete";
      this.state.board[i].colors = "blank";
    }

    // Reset player completed goals
    const playerKeys = Object.keys(this.state.players);
    for (let i = 0; i < playerKeys.length; i++) {
      this.state.players[playerKeys[i]].completedGoals = [];
    }

    logger.info("Bingo game reset");
  }

  /**
   * Reset the entire board (goals, players, bingos, everything)
   */
  public resetBoard(): void {
    // Reset the game state
    this.resetGame();
    
    // Reset all players
    const playerKeys = Object.keys(this.state.players);
    for (let i = 0; i < playerKeys.length; i++) {
      const player = this.state.players[playerKeys[i]];
      player.completedGoals = [];
      player.isActive = true;
    }

    logger.info("Bingo board completely reset");
  }

  /**
   * Get debug information for the current state
   */
  public getDebugInfo(): string {
    const playerKeys = Object.keys(this.state.players);
    const playerInfo: string[] = [];
    
    for (let i = 0; i < playerKeys.length; i++) {
      const player = this.state.players[playerKeys[i]];
      playerInfo.push(`${player.name} (${player.color}): ${player.completedGoals.length} goals`);
    }

    return `Game Mode: ${this.state.gameMode}, Players: [${playerInfo.join(", ")}], Completed Bingos: ${this.state.completedBingos.length}`;
  }
}
