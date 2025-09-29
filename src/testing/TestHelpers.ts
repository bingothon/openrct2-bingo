/*
 * TestHelpers - Utilities for testing OpenRCT2 plugin functionality
 */

import { GameManager } from "../managers/GameManager";

export class TestHelpers {
    private static gameManager: GameManager | null = null;
    private static originalGameMode: string | null = null;

    /**
     * Setup test environment
     */
    public static async setupTestEnvironment(): Promise<void> {
        console.log("🔧 Setting up test environment...");
        
        // Get or create game manager
        this.gameManager = GameManager.getInstance();
        
        // Store original game mode
        this.originalGameMode = this.gameManager.getCurrentGameMode();
        
        // Force out of initialization mode
        this.gameManager.setInitializing(false);
        
        // Clear any existing players
        this.clearAllPlayers();
        
        console.log("✅ Test environment ready");
    }

    /**
     * Teardown test environment
     */
    public static async teardownTestEnvironment(): Promise<void> {
        console.log("🧹 Cleaning up test environment...");
        
        if (this.gameManager) {
            // Clear all players
            this.clearAllPlayers();
            
            // Restore original game mode if we have it
            if (this.originalGameMode) {
                this.gameManager.setGameMode(this.originalGameMode as any);
            }
        }
        
        console.log("✅ Test environment cleaned up");
    }

    /**
     * Clear all registered players
     */
    public static clearAllPlayers(): void {
        if (this.gameManager) {
            const players = this.gameManager.getAllPlayers();
            players.forEach(player => {
                // Note: PlayerManager might not have a remove method, 
                // so we might need to reset the internal state
                console.log(`Removing player: ${player.name}`);
            });
        }
    }

    /**
     * Register test players
     */
    public static registerTestPlayers(): void {
        if (!this.gameManager) return;
        
        console.log("👥 Registering test players...");
        
        // Register 4 test players for different regions
        this.gameManager.registerPlayer("0", "Test Player 1", "red", "top-left");
        this.gameManager.registerPlayer("1", "Test Player 2", "blue", "top-right");
        this.gameManager.registerPlayer("2", "Test Player 3", "green", "bottom-left");
        this.gameManager.registerPlayer("3", "Test Player 4", "yellow", "bottom-right");
        
        console.log("✅ Test players registered");
    }

    /**
     * Set up PVP mode for testing
     */
    public static setupPvpMode(): void {
        if (!this.gameManager) return;
        
        console.log("⚔️ Setting up PVP mode...");
        this.gameManager.setGameMode("pvp");
        this.gameManager.setInitializing(false);
        
        console.log("✅ PVP mode ready");
    }

    /**
     * Set up Lockout mode for testing
     */
    public static setupLockoutMode(): void {
        if (!this.gameManager) return;
        
        console.log("🔒 Setting up Lockout mode...");
        this.gameManager.setGameMode("lockout");
        this.gameManager.setInitializing(false);
        
        console.log("✅ Lockout mode ready");
    }

    /**
     * Set up Coop mode for testing
     */
    public static setupCoopMode(): void {
        if (!this.gameManager) return;
        
        console.log("🤝 Setting up Coop mode...");
        this.gameManager.setGameMode("coop");
        this.gameManager.setInitializing(false);
        
        console.log("✅ Coop mode ready");
    }

    /**
     * Simulate a landraise action
     */
    public static simulateLandraise(x: number, y: number, playerId: number = 0): any {
        return {
            action: "landraise",
            args: {
                x: x,
                y: y,
                x1: x - 16,
                y1: y - 16,
                x2: x + 16,
                y2: y + 16,
                selectionType: 0,
                flags: -2147483648
            },
            player: playerId,
            type: 24,
            isClientOnly: false
        };
    }

    /**
     * Simulate a building action
     */
    public static simulateBuildingAction(action: string, x: number, y: number, playerId: number = 0): any {
        return {
            action: action,
            args: {
                x: x,
                y: y
            },
            player: playerId,
            type: 24,
            isClientOnly: false
        };
    }

    /**
     * Get coordinates for a specific region
     */
    public static getRegionCoordinates(region: string): { x: number, y: number } {
        const coordinates: { [key: string]: { x: number, y: number } } = {
            "top-left": { x: 1000, y: 1000 },      // Top-left region
            "top-right": { x: 2000, y: 1000 },     // Top-right region
            "bottom-left": { x: 1000, y: 2000 },   // Bottom-left region
            "bottom-right": { x: 2000, y: 2000 }   // Bottom-right region
        };
        
        return coordinates[region] || { x: 1000, y: 1000 };
    }

    /**
     * Wait for a specified number of milliseconds
     */
    public static async wait(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Assert that a condition is true
     */
    public static assert(condition: boolean, message: string): void {
        if (!condition) {
            throw new Error(`Assertion failed: ${message}`);
        }
    }

    /**
     * Assert that two values are equal
     */
    public static assertEqual(actual: any, expected: any, message?: string): void {
        if (actual !== expected) {
            throw new Error(`Assertion failed: ${message || `Expected ${expected}, got ${actual}`}`);
        }
    }

    /**
     * Assert that a value is not null/undefined
     */
    public static assertNotNull(value: any, message?: string): void {
        if (value === null || value === undefined) {
            throw new Error(`Assertion failed: ${message || "Expected value to not be null/undefined"}`);
        }
    }

    /**
     * Get debug information about current game state
     */
    public static getDebugInfo(): string {
        if (!this.gameManager) return "GameManager not available";
        return this.gameManager.getDebugInfo();
    }
}
