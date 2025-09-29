/*
 * GameManager Tests
 * Tests for the core GameManager functionality
 */

import { describe, it } from "../TestRunner";
import { TestHelpers } from "../TestHelpers";
import { GameManager } from "../../managers/GameManager";

export const gameManagerTests = describe("GameManager Tests", [
    it("should initialize game manager", () => {
        const gameManager = GameManager.getInstance();
        TestHelpers.assertNotNull(gameManager, "GameManager should be initialized");
    }),

    it("should set game mode to PVP", () => {
        const gameManager = GameManager.getInstance();
        gameManager.setGameMode("pvp");
        
        const debugInfo = gameManager.getDebugInfo();
        TestHelpers.assert(debugInfo.includes("pvp") || debugInfo.includes("enabled"), 
            "Game mode should be set to PVP with building restrictions enabled");
    }),

    it("should set game mode to Lockout", () => {
        const gameManager = GameManager.getInstance();
        gameManager.setGameMode("lockout");
        
        const debugInfo = gameManager.getDebugInfo();
        TestHelpers.assert(debugInfo.includes("lockout") || debugInfo.includes("enabled"), 
            "Game mode should be set to Lockout with building restrictions enabled");
    }),

    it("should set game mode to Coop", () => {
        const gameManager = GameManager.getInstance();
        gameManager.setGameMode("coop");
        
        const debugInfo = gameManager.getDebugInfo();
        TestHelpers.assert(debugInfo.includes("coop") || debugInfo.includes("disabled"), 
            "Game mode should be set to Coop with building restrictions disabled");
    }),

    it("should register players correctly", () => {
        const gameManager = GameManager.getInstance();
        
        // Clear existing players first
        TestHelpers.clearAllPlayers();
        
        // Register test players
        gameManager.registerPlayer("0", "Test Player 1", "red", "top-left");
        gameManager.registerPlayer("1", "Test Player 2", "blue", "top-right");
        
        const players = gameManager.getAllPlayers();
        TestHelpers.assertEqual(players.length, 2, "Should have 2 registered players");
        TestHelpers.assertEqual(players[0].name, "Test Player 1", "First player should be Test Player 1");
        TestHelpers.assertEqual(players[1].name, "Test Player 2", "Second player should be Test Player 2");
    }),

    it("should handle initialization state", () => {
        const gameManager = GameManager.getInstance();
        
        // Test initializing state
        gameManager.setInitializing(true);
        TestHelpers.assert(gameManager.isGameInitializing(), "Should be in initializing state");
        
        // Test non-initializing state
        gameManager.setInitializing(false);
        TestHelpers.assert(!gameManager.isGameInitializing(), "Should not be in initializing state");
    }),

    it("should provide debug information", () => {
        const gameManager = GameManager.getInstance();
        const debugInfo = gameManager.getDebugInfo();
        
        TestHelpers.assertNotNull(debugInfo, "Debug info should not be null");
        TestHelpers.assert(debugInfo.includes("GameManager Debug Info"), "Debug info should contain header");
        TestHelpers.assert(debugInfo.includes("Players registered"), "Debug info should contain player count");
        TestHelpers.assert(debugInfo.includes("Building restrictions"), "Debug info should contain restriction status");
    })
], TestHelpers.setupTestEnvironment, TestHelpers.teardownTestEnvironment);
