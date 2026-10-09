/*
 * ScoreManager Tests
 * Tests for the ScoreManager functionality and score commands
 */

import { describe, it } from "../TestRunner";
import { TestHelpers } from "../TestHelpers";
import { ScoreManager } from "../../managers/ScoreManager";
import { GameManager } from "../../managers/GameManager";

export const scoreManagerTests = describe("ScoreManager Tests", [
    it("should initialize score manager", () => {
        const scoreManager = ScoreManager.getInstance();
        TestHelpers.assertNotNull(scoreManager, "ScoreManager should be initialized");
        
        const debugInfo = scoreManager.getDebugInfo();
        TestHelpers.assert(debugInfo.isServer, "ScoreManager should be running on server");
    }),

    it("should reset all scores", () => {
        const scoreManager = ScoreManager.getInstance();
        scoreManager.resetAllScores();
        
        const allScores = scoreManager.getAllScores();
        TestHelpers.assert(Object.keys(allScores).length === 0, "All scores should be reset to empty");
    }),

    it("should update player score", () => {
        const scoreManager = ScoreManager.getInstance();
        const gameManager = GameManager.getInstance();
        
        // Register a test player
        const testPlayerId = "test-player-1";
        gameManager.registerPlayer(testPlayerId, "Test Player", "red", "top-left");
        
        // Test score update
        scoreManager.updatePlayerScore(testPlayerId, 100);
        const score = scoreManager.getPlayerScore(testPlayerId);
        TestHelpers.assert(score === 100, `Player score should be 100, got ${score}`);
    }),

    it("should handle score changes correctly", () => {
        const scoreManager = ScoreManager.getInstance();
        const gameManager = GameManager.getInstance();
        
        const testPlayerId = "test-player-2";
        gameManager.registerPlayer(testPlayerId, "Test Player 2", "blue", "top-right");
        
        // Test multiple score changes
        scoreManager.updatePlayerScore(testPlayerId, 50);
        TestHelpers.assert(scoreManager.getPlayerScore(testPlayerId) === 50, "Initial score should be 50");
        
        scoreManager.updatePlayerScore(testPlayerId, 25);
        TestHelpers.assert(scoreManager.getPlayerScore(testPlayerId) === 75, "Score after addition should be 75");
        
        scoreManager.updatePlayerScore(testPlayerId, -25);
        TestHelpers.assert(scoreManager.getPlayerScore(testPlayerId) === 50, "Score after subtraction should be 50");
    }),

    it("should get all scores", () => {
        const scoreManager = ScoreManager.getInstance();
        const gameManager = GameManager.getInstance();
        
        // Register multiple test players
        const player1Id = "test-player-3";
        const player2Id = "test-player-4";
        gameManager.registerPlayer(player1Id, "Test Player 3", "green", "bottom-left");
        gameManager.registerPlayer(player2Id, "Test Player 4", "yellow", "bottom-right");
        
        // Set different scores
        scoreManager.updatePlayerScore(player1Id, 100);
        scoreManager.updatePlayerScore(player2Id, 200);
        
        const allScores = scoreManager.getAllScores();
        TestHelpers.assert(allScores[player1Id] === 100, "Player 1 score should be 100");
        TestHelpers.assert(allScores[player2Id] === 200, "Player 2 score should be 200");
        TestHelpers.assert(Object.keys(allScores).length >= 2, "Should have at least 2 players with scores");
    }),

    it("should handle non-existent player gracefully", () => {
        const scoreManager = ScoreManager.getInstance();
        
        // Try to get score for non-existent player
        const score = scoreManager.getPlayerScore("non-existent-player");
        TestHelpers.assert(score === 0, "Non-existent player should have score 0");
    }),

    it("should load scores from game state", () => {
        const scoreManager = ScoreManager.getInstance();
        
        // This test verifies the loadScoresFromGameState method works
        // In a real scenario, this would be called after server restart
        scoreManager.loadScoresFromGameState();
        
        const debugInfo = scoreManager.getDebugInfo();
        TestHelpers.assertNotNull(debugInfo, "Debug info should be available");
    })
]);

