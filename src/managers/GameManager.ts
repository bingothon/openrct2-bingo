/*
 * GameManager
 * - Central manager that coordinates GroundDivisionManager, PlayerManager, and GoalManager
 * - Integrates with the existing BingoManager system
 * - Handles player registration, region assignment, and building restrictions
 */

import { GroundDivisionManager, PlayerRegionKey } from "./GroundDivisionManager";
import { PlayerManager, RegisteredPlayer } from "./PlayerManager";
import { GoalManager } from "./GoalManager";
import { subscribeToBuildingRestrictions, unsubscribeFromBuildingRestrictions } from "../subscriptions/game/buildingRestrictions";

export class GameManager {
    private static instance: GameManager;
    private groundDivision: GroundDivisionManager;
    private playerManager: PlayerManager;
    private goalManager: GoalManager;
    private buildingRestrictionsActive: boolean = false;

    private constructor() {
        this.groundDivision = new GroundDivisionManager();
        this.playerManager = new PlayerManager();
        this.goalManager = new GoalManager(this.groundDivision, this.playerManager);
    }

    /**
     * Get singleton instance
     */
    public static getInstance(): GameManager {
        if (!GameManager.instance) {
            GameManager.instance = new GameManager();
        }
        return GameManager.instance;
    }

    /**
     * Initialize the game with default players and regions
     */
    public initializeGame(): void {
        console.log("[GameManager] Initializing game with default players...");
        
        // Register default players with their assigned regions
        this.registerDefaultPlayers();
        
        // Enable building restrictions for PVP and Lockout modes
        this.enableBuildingRestrictions();
        
        console.log("[GameManager] Game initialized successfully");
    }

    /**
     * Register default players for the 4 regions
     */
    private registerDefaultPlayers(): void {
        console.log("[GameManager] Starting to register default players...");
        
        const defaultPlayers = [
            { id: "1", name: "Player 1", color: "red", region: "top-left" as PlayerRegionKey },
            { id: "2", name: "Player 2", color: "green", region: "top-right" as PlayerRegionKey },
            { id: "3", name: "Player 3", color: "blue", region: "bottom-left" as PlayerRegionKey },
            { id: "4", name: "Player 4", color: "yellow", region: "bottom-right" as PlayerRegionKey }
        ];

        console.log(`[GameManager] About to register ${defaultPlayers.length} players...`);
        
        defaultPlayers.forEach(player => {
            console.log(`[GameManager] Registering player: ${player.name} (${player.color}) in ${player.region} region`);
            this.playerManager.registerPlayer(player.id, player.name, player.color, player.region);
            console.log(`[GameManager] Successfully registered ${player.name} (${player.color}) in ${player.region} region`);
        });
        
        // Verify registration
        const registeredPlayers = this.playerManager.getAllPlayers();
        console.log(`[GameManager] Verification: ${registeredPlayers.length} players registered`);
        registeredPlayers.forEach(player => {
            console.log(`[GameManager] Verified: ${player.name} (${player.color}) in ${player.region}`);
        });
    }

    /**
     * Register a player with a specific region
     */
    public registerPlayer(id: string, name: string, color: string, region: PlayerRegionKey): void {
        this.playerManager.registerPlayer(id, name, color, region);
        console.log(`[GameManager] Registered ${name} (${color}) in ${region} region`);
    }

    /**
     * Get all registered players
     */
    public getAllPlayers(): RegisteredPlayer[] {
        return this.playerManager.getAllPlayers();
    }

    /**
     * Get player by ID
     */
    public getPlayer(id: string): RegisteredPlayer | undefined {
        return this.playerManager.getPlayer(id);
    }

    /**
     * Get player's assigned region
     */
    public getPlayerRegion(playerId: string): PlayerRegionKey | null {
        return this.playerManager.getRegionForPlayer(playerId);
    }

    /**
     * Check if a player can build at a specific tile
     */
    public canPlayerBuildAtTile(playerId: string, tile: { x: number; y: number }): boolean {
        return this.goalManager.canPlayerAffectGoalAtTile(playerId, tile);
    }

    /**
     * Check if a player can build at world coordinates
     */
    public canPlayerBuildAtWorld(playerId: string, world: { x: number; y: number }): boolean {
        return this.goalManager.canPlayerAffectGoalAtWorld(playerId, world);
    }

    /**
     * Get the region for a specific tile
     */
    public getTileRegion(tile: { x: number; y: number }): PlayerRegionKey | null {
        return this.groundDivision.getRegionForTile(tile);
    }

    /**
     * Enable building restrictions (for PVP and Lockout modes)
     */
    public enableBuildingRestrictions(): void {
        if (!this.buildingRestrictionsActive) {
            subscribeToBuildingRestrictions(this.groundDivision, this.playerManager);
            this.buildingRestrictionsActive = true;
            console.log("[GameManager] Building restrictions enabled");
        }
    }

    /**
     * Disable building restrictions (for Coop mode)
     */
    public disableBuildingRestrictions(): void {
        if (this.buildingRestrictionsActive) {
            unsubscribeFromBuildingRestrictions();
            this.buildingRestrictionsActive = false;
            console.log("[GameManager] Building restrictions disabled");
        }
    }

    /**
     * Set game mode and configure restrictions accordingly
     */
    public setGameMode(mode: "coop" | "pvp" | "lockout"): void {
        console.log(`[GameManager] Setting game mode to: ${mode}`);
        
        switch (mode) {
            case "coop":
                this.disableBuildingRestrictions();
                break;
            case "pvp":
            case "lockout":
                this.enableBuildingRestrictions();
                break;
        }
    }

    /**
     * Get ground division manager (for direct access if needed)
     */
    public getGroundDivisionManager(): GroundDivisionManager {
        return this.groundDivision;
    }

    /**
     * Get player manager (for direct access if needed)
     */
    public getPlayerManager(): PlayerManager {
        return this.playerManager;
    }

    /**
     * Get goal manager (for direct access if needed)
     */
    public getGoalManager(): GoalManager {
        return this.goalManager;
    }

    /**
     * Get debug information about the current state
     */
    public getDebugInfo(): string {
        const players = this.getAllPlayers();
        const groundState = this.groundDivision.getState();
        
        let info = "=== GameManager Debug Info ===\n";
        info += `Players registered: ${players.length}\n`;
        info += `Map size: ${groundState.mapWidthTiles}x${groundState.mapHeightTiles}\n`;
        info += `Building restrictions: ${this.buildingRestrictionsActive ? 'enabled' : 'disabled'}\n\n`;
        
        info += "Players:\n";
        players.forEach(player => {
            info += `  - ${player.name} (${player.color}): ${player.region}\n`;
        });
        
        info += "\nRegions:\n";
        const regions: PlayerRegionKey[] = ["top-left", "top-right", "bottom-left", "bottom-right"];
        regions.forEach(region => {
            const regionData = this.groundDivision.getRegion(region);
            info += `  - ${region}: (${regionData.x1},${regionData.y1}) to (${regionData.x2},${regionData.y2})\n`;
        });
        
        return info;
    }
}
