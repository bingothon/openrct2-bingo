import { updateScore, getScoreboardSlotForColour } from "../bingo/notifications/scoreboard";
import { GameManager } from "./GameManager";

export class ScoreManager {
    private static instance: ScoreManager;
    private playerScores: { [playerId: string]: number } = {};
    // Number currently drawn on the scoreboard per colour, so unchanged boxes aren't repainted
    private shownScores: { [colour: string]: number } = {};
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
     * Set every colour's score from its claimed goals (PvP/Lockout: the board is the source of
     * truth). Only boxes whose number changes are repainted.
     */
    public setScoresFromClaims(claims: { [colour: string]: number }): void {
        if (!this.isServer) {
            return;
        }

        const allPlayers = GameManager.getInstance().getAllPlayers();
        ["red", "blue", "green", "yellow"].forEach((colour) => {
            const score = claims[colour] || 0;
            for (const player of allPlayers) {
                if (player.colour === colour && this.playerScores[player.id] !== score) {
                    this.playerScores[player.id] = score;
                    this.storeScoreInGameState(player.id, score);
                }
            }

            const slot = getScoreboardSlotForColour(colour);
            if (slot !== null && this.shownScores[colour] !== score) {
                this.shownScores[colour] = score;
                updateScore(slot, score);
            }
        });
    }

    /**
     * A registration moved to a new network id (reconnect) - keep its score
     */
    public changePlayerId(oldId: string, newId: string): void {
        if (oldId in this.playerScores) {
            this.playerScores[newId] = this.playerScores[oldId];
            delete this.playerScores[oldId];
            this.storeScoreInGameState(newId, this.playerScores[newId]);
        }
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
                const player = GameManager.getInstance().getPlayer(playerId);
                if (player) this.shownScores[player.colour] = score;
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
     * Convert player ID to scoreboard slot - by the player's colour, not by
     * registration order (the scoreboard layout is defined in scoreboard.ts)
     */
    private getPlayerNumber(playerId: string): number | null {
        const player = GameManager.getInstance().getPlayer(playerId);
        if (!player) {
            return null;
        }

        return ScoreManager.getScoreboardSlotForColour(player.colour);
    }

    /**
     * Scoreboard slot for a colour (red, green, blue, yellow), or null if unknown
     */
    public static getScoreboardSlotForColour(colour: string): number | null {
        return getScoreboardSlotForColour(colour);
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
            // Note: Reading from storage - this is acceptable for read operations
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
