/*
 * GoalManager
 * - Manages goal checking, completion, and scoring
 * - Handles periodic goal validation and updates
 * - Integrates with GroundDivisionManager, PlayerManager, and ScoreManager
 */

import type { GroundDivisionManager, PlayerRegionKey, TilePoint } from "./GroundDivisionManager";
import type { PlayerManager } from "./PlayerManager";
import type { BingoBoard, Goal } from "../types";
import { config } from "../config";
import { ScoreManager } from "./ScoreManager";
import { GameManager } from "./GameManager";
import { subscriptions } from "../subscriptions/manager";

export class GoalManager {
    private ground: GroundDivisionManager;
    private players: PlayerManager;
    private board: BingoBoard | null = null;
    private isServer: boolean = false;
    private tickCounter: number = 0;

    constructor(ground: GroundDivisionManager, players: PlayerManager) {
        this.ground = ground;
        this.players = players;
        this.isServer = network.mode === 'server' || network.mode === 'none';
    }

    /**
     * Initialize goal checking with a bingo board
     */
    public initializeGoalChecking(board: BingoBoard): void {
        this.board = board;
        
        if (this.isServer) {
            console.log("[GoalManager] Initializing server-side goal checking");
            this.startGoalChecking();
        } else {
            console.log("[GoalManager] Client mode - goal management completely disabled");
            // Clients should not run any goal management - they just display the UI
            // The server handles all goal checking and scoring
        }
    }

    /**
     * Start periodic goal checking (server only)
     */
    private startGoalChecking(): void {
        if (!this.isServer) {
            console.log("[GoalManager] Not a server - goal checking disabled");
            return;
        }

        console.log("[GoalManager] Starting periodic goal checking every 100 ticks");
        console.log("[GoalManager] Setting up tick subscription for goal checking");
        
        subscriptions.upsert("goalChecking", () =>
            context.subscribe("interval.tick", () => {
                this.tickCounter++;
                if (this.tickCounter % 100 === 0) {
                    console.log("[GoalManager] Tick 100 reached - checking goals");
                    this.checkAllGoals();
                    this.tickCounter = 0;
                }
            })
        );
        
        console.log("[GoalManager] Goal checking subscription set up successfully");
    }

    /**
     * Check all goals for completion (server only)
     */
    private checkAllGoals(): void {
        if (!this.isServer || !this.board) {
            return;
        }

        console.log("[GoalManager] Checking all goals for completion");

        try {
            this.board.forEach((goal, index) => {
                const goalKey = `goal_${goal.slot}`;

                if (goal.status === "incomplete" && goal.checkCondition()) {
                    if (config.gameMode === "coop") {
                        // Coop mode - complete immediately
                        this.completeGoal(goal, goalKey, index);
                    } else {
                        // PVP/Lockout: check if any player can complete
                        const gameManager = GameManager.getInstance();
                        const stateManager = gameManager.getPlayerStateManager();
                        const allPlayers = gameManager.getAllPlayers();
                        
                        for (const player of allPlayers) {
                            if (stateManager.isGoalCompletedForPlayer(goal, player.id)) {
                                this.completeGoal(goal, goalKey, index, player.id);
                                break; // Only one player can complete a goal
                            }
                        }
                    }
                }
            });
        } catch (error) {
            console.log("[GoalManager] Error checking goals:", error);
        }
    }

    /**
     * Complete a goal and update scores
     */
    private completeGoal(goal: Goal, goalKey: string, index: number, playerId?: string): void {
        if (!this.isServer) {
            console.log("[GoalManager] Not a server - cannot complete goals");
            return;
        }

        console.log(`[GoalManager] Completing goal: ${goal.name}`);

        // Send to external system if socket is available
        const selectGoalAction = JSON.stringify({
            action: "selectGoal",
            slot: goal.slot,
            color: "red",
            room: config.roomNameInput
        }) + "\n";
        
        if (config.socket) {
            console.log(`[GoalManager] Sending selectGoal action: ${selectGoalAction}`);
            config.socket.write(selectGoalAction);
        }

        // Mark goal as completed
        goal.status = "completed";
        this.setGoalCompletionStatus(goalKey, true, goal.name, () => {
            this.checkForBingo();
        });

        // Update player scores
        const scoreManager = ScoreManager.getInstance();
        const gameManager = GameManager.getInstance();
        const allPlayers = gameManager.getAllPlayers();
        
        if (config.gameMode === "coop") {
            // Coop mode - all players get points
            for (const player of allPlayers) {
                scoreManager.updatePlayerScore(player.id, 1);
            }
        } else if (playerId) {
            // PVP/Lockout mode - specific player gets points
            scoreManager.updatePlayerScore(playerId, 1);
        }

        console.log(`[GoalManager] Goal ${goal.slot || "unslotted"} - ${goal.name} completed`);
        this.updateGoalUI(index);
    }

    /**
     * Set goal completion status in game state
     */
    private setGoalCompletionStatus(goalKey: string, completed: boolean, goalName?: string, callback?: () => void): void {
        context.executeAction(
            "setGoalCompletion",
            { args: { goalName, goalKey, completed } },
            (result) => {
                if (result.error) {
                    console.log(`[GoalManager] Failed to set goal completion: ${result.errorMessage}`);
                } else {
                    console.log(`[GoalManager] Goal completion status updated: ${goalKey} = ${completed}`);
                }
                if (callback) {
                    callback();
                }
            }
        );
    }

    /**
     * Update goal UI (placeholder - would need to be implemented)
     */
    private updateGoalUI(index: number): void {
        // This would call the UI update function
        // For now, just log the update
        console.log(`[GoalManager] Updating UI for goal at index ${index}`);
    }

    /**
     * Check for bingo completion
     */
    private checkForBingo(): void {
        if (!this.board) return;
        
        // This would implement bingo line checking logic
        console.log("[GoalManager] Checking for bingo completion");
        // TODO: Implement bingo line detection
    }

    /**
     * Stop goal checking (server only)
     */
    public stopGoalChecking(): void {
        if (this.isServer) {
            subscriptions.dispose("goalChecking");
            console.log("[GoalManager] Server goal checking stopped");
        } else {
            console.log("[GoalManager] Client mode - no goal checking to stop");
        }
    }

    // Legacy methods for backward compatibility
    public canPlayerAffectGoalAtTile(playerId: string, tile: TilePoint): boolean {
        const playerRegion = this.players.getRegionForPlayer(playerId);
        if (!playerRegion) return false;
        const tileRegion = this.ground.getRegionForTile(tile);
        return tileRegion === playerRegion;
    }

    public canPlayerAffectGoalAtWorld(playerId: string, world: { x: number; y: number }): boolean {
        const tile = this.ground.worldToTile(world);
        return this.canPlayerAffectGoalAtTile(playerId, tile);
    }

    public getTileRegion(tile: TilePoint): PlayerRegionKey | null {
        return this.ground.getRegionForTile(tile);
    }

    /**
     * Get debug information
     */
    public getDebugInfo(): any {
        return {
            isServer: this.isServer,
            hasBoard: !!this.board,
            tickCounter: this.tickCounter,
            boardSize: this.board ? this.board.length : 0
        };
    }
}