/*
 * Testing Index - Main entry point for all tests
 */

import { testRunner } from "./TestRunner";
import { gameManagerTests } from "./tests/GameManager.test";
import { buildingRestrictionsTests } from "./tests/BuildingRestrictions.test";
import { gameModeIntegrationTests } from "./tests/GameModeIntegration.test";
import { scoreManagerTests } from "./tests/ScoreManager.test";

/**
 * Run all tests
 */
export async function runAllTests(): Promise<void> {
    console.log("🚀 Starting OpenRCT2 Bingo Plugin Test Suite");
    console.log("=".repeat(60));
    
    const allTests = [
        gameManagerTests,
        buildingRestrictionsTests,
        gameModeIntegrationTests,
        scoreManagerTests
    ];
    
    await testRunner.runSuites(allTests);
}

/**
 * Run specific test suite
 */
export async function runTestSuite(suiteName: string): Promise<void> {
    console.log(`🧪 Running test suite: ${suiteName}`);
    console.log("=".repeat(40));
    
    let suite;
    switch (suiteName.toLowerCase()) {
        case "gamemanager":
        case "game-manager":
            suite = gameManagerTests;
            break;
        case "buildingrestrictions":
        case "building-restrictions":
            suite = buildingRestrictionsTests;
            break;
        case "gamemode":
        case "game-mode":
        case "integration":
            suite = gameModeIntegrationTests;
            break;
        case "scoremanager":
        case "score-manager":
            suite = scoreManagerTests;
            break;
        default:
            console.error(`❌ Unknown test suite: ${suiteName}`);
            console.log("Available suites: gamemanager, buildingrestrictions, gamemode, scoremanager");
            return;
    }
    
    await testRunner.runSuite(suite);
}

/**
 * Run tests by category
 */
export async function runTestsByCategory(category: string): Promise<void> {
    console.log(`🔍 Running tests by category: ${category}`);
    console.log("=".repeat(40));
    
    let suites;
    switch (category.toLowerCase()) {
        case "unit":
            suites = [gameManagerTests];
            break;
        case "integration":
            suites = [gameModeIntegrationTests];
            break;
        case "restrictions":
            suites = [buildingRestrictionsTests];
            break;
        case "scores":
            suites = [scoreManagerTests];
            break;
        case "all":
            suites = [gameManagerTests, buildingRestrictionsTests, gameModeIntegrationTests, scoreManagerTests];
            break;
        default:
            console.error(`❌ Unknown category: ${category}`);
            console.log("Available categories: unit, integration, restrictions, scores, all");
            return;
    }
    
    await testRunner.runSuites(suites);
}

// Export test suites for individual access
export {
    gameManagerTests,
    buildingRestrictionsTests,
    gameModeIntegrationTests,
    scoreManagerTests
};
