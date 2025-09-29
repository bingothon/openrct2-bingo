/*
 * Game Mode Integration Tests
 * Tests for complete game mode functionality
 */

import { describe, it } from "../TestRunner";
import { TestHelpers } from "../TestHelpers";
import { GameManager } from "../../managers/GameManager";

export const gameModeIntegrationTests = describe("Game Mode Integration Tests", [
    it("should complete PVP mode initialization", async () => {
        const gameManager = GameManager.getInstance();
        
        // Setup PVP mode
        TestHelpers.setupPvpMode();
        TestHelpers.registerTestPlayers();
        
        // Verify game state
        const debugInfo = gameManager.getDebugInfo();
        TestHelpers.assert(debugInfo.includes("Players registered"), "Should have registered players");
        TestHelpers.assert(!gameManager.isGameInitializing(), "Should not be in initializing state");
        
        // Verify players are registered
        const players = gameManager.getAllPlayers();
        TestHelpers.assert(players.length >= 2, "Should have at least 2 players registered");
    }),

    it("should complete Lockout mode initialization", async () => {
        const gameManager = GameManager.getInstance();
        
        // Setup Lockout mode
        TestHelpers.setupLockoutMode();
        TestHelpers.registerTestPlayers();
        
        // Verify game state
        const debugInfo = gameManager.getDebugInfo();
        TestHelpers.assert(debugInfo.includes("Players registered"), "Should have registered players");
        TestHelpers.assert(!gameManager.isGameInitializing(), "Should not be in initializing state");
        
        // Verify players are registered
        const players = gameManager.getAllPlayers();
        TestHelpers.assert(players.length >= 2, "Should have at least 2 players registered");
    }),

    it("should complete Coop mode initialization", async () => {
        const gameManager = GameManager.getInstance();
        
        // Setup Coop mode
        TestHelpers.setupCoopMode();
        TestHelpers.registerTestPlayers();
        
        // Verify game state
        const debugInfo = gameManager.getDebugInfo();
        TestHelpers.assert(debugInfo.includes("Players registered"), "Should have registered players");
        TestHelpers.assert(!gameManager.isGameInitializing(), "Should not be in initializing state");
        
        // Verify players are registered
        const players = gameManager.getAllPlayers();
        TestHelpers.assert(players.length >= 2, "Should have at least 2 players registered");
    }),

    it("should handle mode switching", async () => {
        const gameManager = GameManager.getInstance();
        
        // Start with Coop mode
        TestHelpers.setupCoopMode();
        let debugInfo = gameManager.getDebugInfo();
        TestHelpers.assert(debugInfo.includes("coop") || debugInfo.includes("disabled"), 
            "Should start in Coop mode");
        
        // Switch to PVP mode
        TestHelpers.setupPvpMode();
        debugInfo = gameManager.getDebugInfo();
        TestHelpers.assert(debugInfo.includes("pvp") || debugInfo.includes("enabled"), 
            "Should switch to PVP mode");
        
        // Switch to Lockout mode
        TestHelpers.setupLockoutMode();
        debugInfo = gameManager.getDebugInfo();
        TestHelpers.assert(debugInfo.includes("lockout") || debugInfo.includes("enabled"), 
            "Should switch to Lockout mode");
    }),

    it("should maintain player registrations across mode switches", async () => {
        const gameManager = GameManager.getInstance();
        
        // Register players
        TestHelpers.registerTestPlayers();
        let players = gameManager.getAllPlayers();
        const initialPlayerCount = players.length;
        
        // Switch modes
        TestHelpers.setupPvpMode();
        players = gameManager.getAllPlayers();
        TestHelpers.assert(players.length === initialPlayerCount, 
            "Player count should remain the same after mode switch");
        
        TestHelpers.setupLockoutMode();
        players = gameManager.getAllPlayers();
        TestHelpers.assert(players.length === initialPlayerCount, 
            "Player count should remain the same after mode switch");
        
        TestHelpers.setupCoopMode();
        players = gameManager.getAllPlayers();
        TestHelpers.assert(players.length === initialPlayerCount, 
            "Player count should remain the same after mode switch");
    }),

    it("should handle region assignments correctly", async () => {
        const gameManager = GameManager.getInstance();
        
        // Setup PVP mode with test players
        TestHelpers.setupPvpMode();
        TestHelpers.registerTestPlayers();
        
        const players = gameManager.getAllPlayers();
        
        // Verify each player has a unique region
        const regions: string[] = players.map(p => p.region);
        const uniqueRegions = [...new Set(regions)];
        
        TestHelpers.assert(uniqueRegions.length === regions.length, 
            "Each player should have a unique region");
        
        // Verify all expected regions are present
        const expectedRegions: string[] = ["top-left", "top-right", "bottom-left", "bottom-right"];
        const hasAllRegions = expectedRegions.every(region => regions.includes(region));
        TestHelpers.assert(hasAllRegions, "All expected regions should be assigned");
    }),

    it("should handle initialization state correctly", async () => {
        const gameManager = GameManager.getInstance();
        
        // Test initialization state
        gameManager.setInitializing(true);
        TestHelpers.assert(gameManager.isGameInitializing(), "Should be in initializing state");
        
        // Test non-initialization state
        gameManager.setInitializing(false);
        TestHelpers.assert(!gameManager.isGameInitializing(), "Should not be in initializing state");
        
        // Test that mode switching works when not initializing
        TestHelpers.setupPvpMode();
        const debugInfo = gameManager.getDebugInfo();
        TestHelpers.assert(debugInfo.includes("pvp") || debugInfo.includes("enabled"), 
            "Should be able to set PVP mode when not initializing");
    })
], TestHelpers.setupTestEnvironment, TestHelpers.teardownTestEnvironment);
