/*
 * Testing Index - Main entry point for all tests
 */

import { testRunner } from "./TestRunner";
import { gameManagerTests } from "./tests/GameManager.test";
import { buildingRestrictionsTests } from "./tests/BuildingRestrictions.test";
import { gameModeIntegrationTests } from "./tests/GameModeIntegration.test";

/**
 * Run all tests
 */
export async function runAllTests(): Promise<void> {
    console.log("🚀 Starting OpenRCT2 Bingo Plugin Test Suite");
    console.log("=" * 60);
    
    const allTests = [
        gameManagerTests,
        buildingRestrictionsTests,
        gameModeIntegrationTests
    ];
    
    await testRunner.runSuites(allTests);
}

/**
 * Run specific test suite
 */
export async function runTestSuite(suiteName: string): Promise<void> {
    console.log(`🧪 Running test suite: ${suiteName}`);
    console.log("=" * 40);
    
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
        default:
            console.error(`❌ Unknown test suite: ${suiteName}`);
            console.log("Available suites: gamemanager, buildingrestrictions, gamemode");
            return;
    }
    
    await testRunner.runSuite(suite);
}

/**
 * Run tests by category
 */
export async function runTestsByCategory(category: string): Promise<void> {
    console.log(`🔍 Running tests by category: ${category}`);
    console.log("=" * 40);
    
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
        case "all":
            suites = [gameManagerTests, buildingRestrictionsTests, gameModeIntegrationTests];
            break;
        default:
            console.error(`❌ Unknown category: ${category}`);
            console.log("Available categories: unit, integration, restrictions, all");
            return;
    }
    
    await testRunner.runSuites(suites);
}

// Export test suites for individual access
export {
    gameManagerTests,
    buildingRestrictionsTests,
    gameModeIntegrationTests
};
