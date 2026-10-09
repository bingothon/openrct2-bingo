/*
 * GoalManager
 * - Manages goal checking, completion, and scoring
 * - Handles periodic goal validation and updates
 * - Integrates with GroundDivisionManager, PlayerManager, and ScoreManager
 */

import type { GroundDivisionManager, PlayerRegionKey, TilePoint } from "./GroundDivisionManager";
import type { PlayerManager, RegisteredPlayer } from "./PlayerManager";
import type { BingoBoard, Goal } from "../types";
import { config } from "../config";
import { ScoreManager } from "./ScoreManager";
import { GameManager } from "./GameManager";
import { subscriptions } from "../subscriptions/manager";
import { buildRegionScopes } from "../bingo/goalScopes";
import { updateGoalUI } from "../bingo/main";
import { countClaims, getClinchWinner, getLeaders, hasBingo } from "../bingo/lockout";
import { sendGameMessage } from "../subscriptions/server/helpers";
import { syncRegionSpawns } from "../bingo/regionSpawns";
import { linkBingoSyncRoom } from "../bingo/bingosync-handler";

export class GoalManager {
    private ground: GroundDivisionManager;
    private players: PlayerManager;
    private board: BingoBoard | null = null;
    private isServer: boolean = false;
    private tickCounter: number = 0;
    private gameOver: boolean = false;

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
        this.restoreCompletions();
        // Managed servers create their BingoSync room for this board (no-op otherwise)
        if (this.isServer) {
            linkBingoSyncRoom(board);
        }
        
        if (this.isServer) {
            if (config.gameMode !== "coop") {
                // Scores come from the board, so a restart shows the right numbers again
                this.syncScoresFromBoard();
            }

            if (context.getParkStorage().get("gameOver", false)) {
                this.gameOver = true;
                console.log("[GoalManager] Game is already over - not checking goals");
                return;
            }

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
                    // PvP/Lockout: new guests only arrive in picked regions
                    syncRegionSpawns();
                    this.checkAllGoals();
                    this.tickCounter = 0;
                }
            })
        );
        
        // Lockout/PvP end when the time runs out (unless a clinch or bingo ended them before)
        subscriptions.upsert("goalTimer", () =>
            context.subscribe("interval.day", () => this.checkTimer())
        );

        console.log("[GoalManager] Goal checking subscription set up successfully");
    }

    /**
     * PvP/Lockout: every colour's score is the number of goals it completed
     */
    private syncScoresFromBoard(): void {
        if (!this.board) return;
        ScoreManager.getInstance().setScoresFromClaims(countClaims(this.board));
    }

    private getPlayerColours(): string[] {
        return GameManager.getInstance().getAllPlayers().map((player) => player.colour);
    }

    /**
     * Lockout: end the game as soon as the leader can no longer be caught
     */
    private checkClinch(): void {
        if (!this.board || config.gameMode !== "lockout") return;

        const winner = getClinchWinner(this.board, this.getPlayerColours());
        if (winner) {
            const claims = countClaims(this.board)[winner];
            this.endGame(`${winner.toUpperCase()} wins with ${claims} goals - nobody can catch up anymore!`);
        }
    }

    /**
     * Lockout/PvP: when the game duration is over without a clinch or bingo, the colour with
     * the most goals wins
     */
    private checkTimer(): void {
        if (!this.board || this.gameOver || config.gameMode === "coop") return;

        const duration = context.getParkStorage().get("duration", 0);
        if (duration <= 0 || date.yearsElapsed < duration) return;

        const leaders = getLeaders(this.board, this.getPlayerColours());
        if (leaders.colours.length === 1) {
            this.endGame(`Time's up! ${leaders.colours[0].toUpperCase()} wins with ${leaders.claims} goals!`);
        } else if (leaders.colours.length > 1) {
            const tied = leaders.colours.map((colour) => colour.toUpperCase()).join(" and ");
            this.endGame(`Time's up! It's a draw between ${tied} with ${leaders.claims} goals each!`);
        } else {
            this.endGame("Time's up! No players registered, no winner.");
        }
    }

    /**
     * Stop scoring and announce the result. Stored so a server restart doesn't resume the game.
     */
    private endGame(message: string): void {
        if (this.gameOver) return;
        this.gameOver = true;

        console.log(`[GoalManager] Game over: ${message}`);
        context.executeAction("setStorage", { args: { key: "gameOver", value: true } });
        context.executeAction("setStorage", { args: { key: "gameResult", value: message } });
        this.stopGoalChecking();

        for (let i = 0; i < 3; i++) {
            sendGameMessage(message);
        }
    }

    /**
     * Restore who completed which goal from park storage (e.g. after a server restart)
     */
    private restoreCompletions(): void {
        if (!this.board) return;
        const parkStorage = context.getParkStorage();
        this.board.forEach((goal) => {
            try {
                const colours = JSON.parse(parkStorage.get(`goal_${goal.slot}_colors`, "[]"));
                if (Array.isArray(colours) && colours.length > 0) {
                    goal.completedBy = colours;
                    goal.colors = colours.join(" ");
                }
            } catch (error) {
                // Ignore malformed data - the goal just starts without completions
            }
        });
    }

    /**
     * Check all goals for completion (server only)
     * - coop: park-wide check, everyone scores
     * - lockout: per player (their region only), the first player to complete a goal takes it
     * - pvp: per player, every player can complete every goal once and scores for it
     */
    private checkAllGoals(): void {
        if (!this.isServer || !this.board) {
            return;
        }

        const board = this.board;
        const mode = config.gameMode;

        if (mode === "coop") {
            board.forEach((goal, index) => {
                try {
                    if (goal.status === "incomplete" && goal.checkCondition()) {
                        this.completeGoal(goal, index, null);
                    }
                } catch (error) {
                    console.log(`[GoalManager] Error checking goal ${goal.name}:`, error);
                }
            });
            return;
        }

        const players = GameManager.getInstance().getAllPlayers();
        if (players.length === 0) {
            return;
        }

        // One pass over the map per check, shared by all goals
        const scopes = buildRegionScopes(this.ground);

        board.forEach((goal, index) => {
            if (this.gameOver || !goal.checkPlayer || (mode === "lockout" && goal.status === "completed")) {
                return;
            }

            for (let i = 0; i < players.length; i++) {
                const player = players[i];
                if (goal.completedBy && goal.completedBy.indexOf(player.colour) !== -1) {
                    continue;
                }

                if (this.gameOver) {
                    return;
                }

                try {
                    if (goal.checkPlayer(scopes[player.region])) {
                        this.completeGoal(goal, index, player);
                        if (mode === "lockout") {
                            break; // the first player takes the goal
                        }
                    }
                } catch (error) {
                    console.log(`[GoalManager] Error checking goal ${goal.name} for ${player.colour}:`, error);
                }
            }
        });
    }

    /**
     * Complete a goal and update scores. player is null in coop (everyone scores).
     */
    private completeGoal(goal: Goal, index: number, player: RegisteredPlayer | null): void {
        if (!this.isServer || !this.board) {
            return;
        }

        const goalKey = `goal_${goal.slot}`;
        const colour = player ? player.colour : "red";
        console.log(`[GoalManager] Goal ${goal.slot} "${goal.name}" completed by ${player ? colour : "everyone"}`);

        // Send to external system if socket is available
        if (config.socket) {
            const selectGoalAction = JSON.stringify({
                action: "selectGoal",
                slot: goal.slot,
                color: colour,
                room: config.roomIdInput
            }) + "\n";
            config.socket.write(selectGoalAction);
        }

        goal.status = "completed";
        if (player) {
            goal.completedBy = (goal.completedBy || []).concat([player.colour]);
            goal.colors = goal.completedBy.join(" ");
            context.executeAction("setStorage", {
                args: { key: `${goalKey}_colors`, value: JSON.stringify(goal.completedBy) }
            });
        }
        this.setGoalCompletionStatus(goalKey, true, goal.name, () => {
            this.checkForBingo();
        });

        const scoreManager = ScoreManager.getInstance();
        if (player) {
            this.syncScoresFromBoard();
        } else {
            // Coop mode - all players get points
            const allPlayers = GameManager.getInstance().getAllPlayers();
            for (const registered of allPlayers) {
                scoreManager.updatePlayerScore(registered.id, 1);
            }
        }

        // Host with a UI (non-headless server) shows the board too
        if (typeof ui !== "undefined") {
            updateGoalUI(index, this.board);
        }

        if (player && config.gameMode === "lockout") {
            this.checkClinch();
        } else if (player && config.gameMode === "pvp" && hasBingo(this.board, player.colour)) {
            this.endGame(`BINGO! ${player.colour.toUpperCase()} wins with a full line!`);
        }
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
            subscriptions.dispose("goalTimer");
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