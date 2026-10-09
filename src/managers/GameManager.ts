/*
 * GameManager
 * - Central manager that coordinates GroundDivisionManager, PlayerManager, and GoalManager
 * - Integrates with the existing BingoManager system
 * - Handles player registration, region assignment, and building restrictions
 */

import { GroundDivisionManager, PlayerRegionKey } from "./GroundDivisionManager";
import { PlayerManager, RegisteredPlayer } from "./PlayerManager";
import { GoalManager } from "./GoalManager";
import { PlayerStateManager, PlayerStateManagerInstance } from "./PlayerStateManager";
import { subscribeToBuildingRestrictions, unsubscribeFromBuildingRestrictions } from "../subscriptions/game/buildingRestrictions";

export class GameManager {
    private static instance: GameManager;
    private groundDivision: GroundDivisionManager;
    private playerManager: PlayerManager;
    private goalManager: GoalManager;
    private playerStateManager: PlayerStateManagerInstance;
    private buildingRestrictionsActive: boolean = false;
    private isInitializing: boolean = false;
    private currentGameMode: "coop" | "pvp" | "lockout" = "coop";

    private constructor() {
        // Initialize persistence system first
        // PlayerPersistenceManager.runMigrationIfNeeded();
        
        this.groundDivision = new GroundDivisionManager();
        this.playerManager = new PlayerManager();
        this.goalManager = new GoalManager(this.groundDivision, this.playerManager);
        this.playerStateManager = new (PlayerStateManager as any)(
            this.groundDivision,
            this.playerManager
        );
        
        console.log("[GameManager] Initialized with persistent player data");
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
     * Initialize the game (no automatic player registration)
     */
    public initializeGame(): void {
        console.log("[GameManager] Initializing game...");
        
        // Set initialization state
        this.isInitializing = true; 
        
        // PlayerStateManager is already initialized in constructor
        console.log("[GameManager] PlayerStateManager ready to track player state");
        
        // Building restrictions will be handled by setGameMode() after initialization
        
        console.log("[GameManager] Game initialized successfully");
        console.log("[GameManager] Players register with the region picker or /register COLOR");
    }


    /**
     * Register a player with a specific region
     */
    public registerPlayer(id: string, name: string, color: string, region: PlayerRegionKey, identity?: string): void {
        this.playerManager.registerPlayer(id, name, color, region, identity);
        console.log(`[GameManager] Registered ${name} (${color}) in ${region} region`);
        
        // Reinitialize PlayerStateManager to include the new player
        this.playerStateManager.initializePlayerStates();
        console.log("[GameManager] PlayerStateManager updated with new player state");
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
        const player = this.playerManager.getPlayer(id);
        return player || undefined;
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
     * Disable building restrictions (for Coop mode or during initialization)
     */
    public disableBuildingRestrictions(): void {
        if (this.buildingRestrictionsActive) {
            unsubscribeFromBuildingRestrictions();
            this.buildingRestrictionsActive = false;
            console.log("[GameManager] Building restrictions disabled");
        }
    }


    /**
     * Check if the game is currently initializing
     */
    public isGameInitializing(): boolean {
        return this.isInitializing;
    }

    /**
     * Force set the initializing state (for debugging)
     */
    public setInitializing(initializing: boolean): void {
        this.isInitializing = initializing;
        console.log(`[GameManager] Force set initializing to: ${initializing}`);
        if (initializing) {
            this.disableBuildingRestrictions();
        } else {
            this.enableBuildingRestrictions();
        }
    }


    /**
     * Get the current game mode (helper method)
     */
    public getCurrentGameMode(): "coop" | "pvp" | "lockout" {
        return this.currentGameMode;
    }

    /**
     * Set game mode and configure restrictions accordingly
     */
    public setGameMode(mode: "coop" | "pvp" | "lockout"): void {
        console.log(`[GameManager] setGameMode called with mode: ${mode}, isInitializing: ${this.isInitializing}, buildingRestrictionsActive: ${this.buildingRestrictionsActive}`);
        
        // Update the current game mode
        this.currentGameMode = mode;
        
        // Don't override restrictions if we're still initializing
        if (this.isInitializing) {
            console.log(`[GameManager] Skipping restriction changes during initialization`);
            return;
        }
        
        // Check if restrictions are already correctly configured for this mode
        const shouldHaveRestrictions = (mode === "pvp" || mode === "lockout");
        const hasCorrectRestrictions = (shouldHaveRestrictions && this.buildingRestrictionsActive) || 
                                      (!shouldHaveRestrictions && !this.buildingRestrictionsActive);
        
        if (hasCorrectRestrictions) {
            console.log(`[GameManager] Building restrictions already correctly configured for ${mode.toUpperCase()} mode`);
            return;
        }
        
        switch (mode) {
            case "coop":
                console.log(`[GameManager] Disabling building restrictions for COOP mode`);
                this.disableBuildingRestrictions();
                break;
            case "pvp":
            case "lockout":
                console.log(`[GameManager] Enabling building restrictions for ${mode.toUpperCase()} mode`);
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
     * Get player state manager (for region-aware goal checking)
     */
    public getPlayerStateManager(): PlayerStateManagerInstance {
        return this.playerStateManager;
    }

    /**
     * Get debug information about the current state
     */
    public getDebugInfo(): string {
        const players = this.getAllPlayers();
        const groundState = this.groundDivision.getState();
        
        let info = "=== GameManager Debug Info ===\n";
        info += `Game mode: ${this.currentGameMode}\n`;
        info += `Players registered: ${players.length}\n`;
        info += `Map size: ${groundState.mapWidthTiles}x${groundState.mapHeightTiles}\n`;
        info += `Building restrictions: ${this.buildingRestrictionsActive ? 'enabled' : 'disabled'}\n\n`;
        
        info += "Players:\n";
        players.forEach(player => {
            info += `  - ${player.name} (${player.colour}): ${player.region}\n`;
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
