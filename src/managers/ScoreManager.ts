import { updateScore } from "../bingo/notifications/scoreboard";
import { GameManager } from "./GameManager";

export class ScoreManager {
    private static instance: ScoreManager;
    private playerScores: { [playerId: string]: number } = {};
    private isServer: boolean = false;

    private constructor() {
        this.isServer = network.mode === 'server' || network.mode === 'none';
    }

    public static getInstance(): ScoreManager {
        if (!ScoreManager.instance) {
            ScoreManager.instance = new ScoreManager();
        }
        return ScoreManager.instance;
    }

    /**
     * Initialize score manager - only works on server
     */
    public initialize(): void {
        if (!this.isServer) {
            console.log("[ScoreManager] Not a server - score management disabled");
            return;
        }

        console.log("[ScoreManager] Initializing server-side score management");
        this.resetAllScores();
    }

    /**
     * Update a player's score - only works on server
     */
    public updatePlayerScore(playerId: string, scoreChange: number): void {
        if (!this.isServer) {
            console.log(`[ScoreManager] Not a server - ignoring score update for player ${playerId}`);
            return;
        }

        const currentScore = this.playerScores[playerId] || 0;
        const newScore = currentScore + scoreChange;
        this.playerScores[playerId] = newScore;

        console.log(`[ScoreManager] Player ${playerId} score: ${currentScore} -> ${newScore} (+${scoreChange})`);

        // Update the visual scoreboard
        this.updateScoreboard(playerId, newScore);

        // Store in game state for synchronization
        this.storeScoreInGameState(playerId, newScore);
    }

    /**
     * Get a player's current score
     */
    public getPlayerScore(playerId: string): number {
        return this.playerScores[playerId] || 0;
    }

    /**
     * Get all player scores
     */
    public getAllScores(): { [playerId: string]: number } {
        return { ...this.playerScores };
    }

    /**
     * Reset all scores to zero
     */
    public resetAllScores(): void {
        if (!this.isServer) {
            console.log("[ScoreManager] Not a server - cannot reset scores");
            return;
        }

        console.log("[ScoreManager] Resetting all player scores");
        this.playerScores = {};
        
        // Reset scoreboard display
        const gameManager = GameManager.getInstance();
        const allPlayers = gameManager.getAllPlayers();
        
        for (const player of allPlayers) {
            this.updateScoreboard(player.id, 0);
            this.storeScoreInGameState(player.id, 0);
        }
    }

    /**
     * Update the visual scoreboard
     */
    private updateScoreboard(playerId: string, score: number): void {
        try {
            // Convert player ID to player number for scoreboard
            const playerNumber = this.getPlayerNumber(playerId);
            if (playerNumber !== null) {
                updateScore(playerNumber, score);
            }
        } catch (error) {
            console.log(`[ScoreManager] Error updating scoreboard for player ${playerId}:`, error);
        }
    }

    /**
     * Store score in game state for client synchronization
     */
    private storeScoreInGameState(playerId: string, score: number): void {
        try {
            const scoreKey = `player_${playerId}_score`;
            context.executeAction('setStorage', { 
                args: { key: scoreKey, value: score } 
            }, (result) => {
                if (result.error) {
                    console.log(`[ScoreManager] Failed to store score for player ${playerId}:`, result.errorMessage);
                }
            });
        } catch (error) {
            console.log(`[ScoreManager] Error storing score for player ${playerId}:`, error);
        }
    }

    /**
     * Convert player ID to player number for scoreboard display
     */
    private getPlayerNumber(playerId: string): number | null {
        const gameManager = GameManager.getInstance();
        const allPlayers = gameManager.getAllPlayers();
        
        for (let i = 0; i < allPlayers.length; i++) {
            if (allPlayers[i].id === playerId) {
                return i;
            }
        }
        
        return null;
    }

    /**
     * Load scores from game state (for server restart)
     */
    public loadScoresFromGameState(): void {
        if (!this.isServer) {
            return;
        }

        console.log("[ScoreManager] Loading scores from game state");
        const gameManager = GameManager.getInstance();
        const allPlayers = gameManager.getAllPlayers();
        
        for (const player of allPlayers) {
            const scoreKey = `player_${player.id}_score`;
            const storedScore = context.getParkStorage().get(scoreKey, 0);
            this.playerScores[player.id] = storedScore;
            
            // Update scoreboard display
            this.updateScoreboard(player.id, storedScore);
        }
    }

    /**
     * Get debug information
     */
    public getDebugInfo(): any {
        return {
            isServer: this.isServer,
            playerScores: this.playerScores,
            totalPlayers: Object.keys(this.playerScores).length
        };
    }
}
