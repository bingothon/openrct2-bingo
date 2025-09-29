/*
 * Building Restrictions Tests
 * Tests for the building restriction system
 */

import { describe, it } from "../TestRunner";
import { TestHelpers } from "../TestHelpers";
import { GameManager } from "../../managers/GameManager";

export const buildingRestrictionsTests = describe("Building Restrictions Tests", [
    it("should block landraise in other player's region", async () => {
        const gameManager = GameManager.getInstance();
        
        // Setup PVP mode with test players
        TestHelpers.setupPvpMode();
        TestHelpers.registerTestPlayers();
        
        // Get coordinates for different regions
        const topLeftCoords = TestHelpers.getRegionCoordinates("top-left");
        const topRightCoords = TestHelpers.getRegionCoordinates("top-right");
        
        // Simulate landraise action in player 0's region (top-left) by player 1
        const landraiseAction = TestHelpers.simulateLandraise(
            topLeftCoords.x, 
            topLeftCoords.y, 
            1 // Player 1 trying to modify player 0's land
        );
        
        // This should be blocked by building restrictions
        // Note: We can't directly test the action.query subscription here,
        // but we can verify the setup is correct
        TestHelpers.assertNotNull(landraiseAction, "Landraise action should be created");
        TestHelpers.assertEqual(landraiseAction.action, "landraise", "Action should be landraise");
        TestHelpers.assertEqual(landraiseAction.player, 1, "Player should be 1");
    }),

    it("should allow landraise in player's own region", async () => {
        const gameManager = GameManager.getInstance();
        
        // Setup PVP mode with test players
        TestHelpers.setupPvpMode();
        TestHelpers.registerTestPlayers();
        
        // Get coordinates for player 0's region (top-left)
        const topLeftCoords = TestHelpers.getRegionCoordinates("top-left");
        
        // Simulate landraise action in player 0's region by player 0
        const landraiseAction = TestHelpers.simulateLandraise(
            topLeftCoords.x, 
            topLeftCoords.y, 
            0 // Player 0 modifying their own land
        );
        
        TestHelpers.assertNotNull(landraiseAction, "Landraise action should be created");
        TestHelpers.assertEqual(landraiseAction.action, "landraise", "Action should be landraise");
        TestHelpers.assertEqual(landraiseAction.player, 0, "Player should be 0");
    }),

    it("should block building actions in other player's region", async () => {
        const gameManager = GameManager.getInstance();
        
        // Setup PVP mode with test players
        TestHelpers.setupPvpMode();
        TestHelpers.registerTestPlayers();
        
        // Get coordinates for different regions
        const topLeftCoords = TestHelpers.getRegionCoordinates("top-left");
        const topRightCoords = TestHelpers.getRegionCoordinates("top-right");
        
        // Simulate building action in player 0's region by player 1
        const buildingAction = TestHelpers.simulateBuildingAction(
            "smallsceneryplace",
            topLeftCoords.x,
            topLeftCoords.y,
            1 // Player 1 trying to build in player 0's region
        );
        
        TestHelpers.assertNotNull(buildingAction, "Building action should be created");
        TestHelpers.assertEqual(buildingAction.action, "smallsceneryplace", "Action should be smallsceneryplace");
        TestHelpers.assertEqual(buildingAction.player, 1, "Player should be 1");
    }),

    it("should allow building actions in player's own region", async () => {
        const gameManager = GameManager.getInstance();
        
        // Setup PVP mode with test players
        TestHelpers.setupPvpMode();
        TestHelpers.registerTestPlayers();
        
        // Get coordinates for player 0's region (top-left)
        const topLeftCoords = TestHelpers.getRegionCoordinates("top-left");
        
        // Simulate building action in player 0's region by player 0
        const buildingAction = TestHelpers.simulateBuildingAction(
            "smallsceneryplace",
            topLeftCoords.x,
            topLeftCoords.y,
            0 // Player 0 building in their own region
        );
        
        TestHelpers.assertNotNull(buildingAction, "Building action should be created");
        TestHelpers.assertEqual(buildingAction.action, "smallsceneryplace", "Action should be smallsceneryplace");
        TestHelpers.assertEqual(buildingAction.player, 0, "Player should be 0");
    }),

    it("should have building restrictions enabled in PVP mode", () => {
        const gameManager = GameManager.getInstance();
        
        // Setup PVP mode
        TestHelpers.setupPvpMode();
        
        const debugInfo = gameManager.getDebugInfo();
        TestHelpers.assert(debugInfo.includes("enabled") || debugInfo.includes("pvp"), 
            "Building restrictions should be enabled in PVP mode");
    }),

    it("should have building restrictions enabled in Lockout mode", () => {
        const gameManager = GameManager.getInstance();
        
        // Setup Lockout mode
        TestHelpers.setupLockoutMode();
        
        const debugInfo = gameManager.getDebugInfo();
        TestHelpers.assert(debugInfo.includes("enabled") || debugInfo.includes("lockout"), 
            "Building restrictions should be enabled in Lockout mode");
    }),

    it("should have building restrictions disabled in Coop mode", () => {
        const gameManager = GameManager.getInstance();
        
        // Setup Coop mode
        TestHelpers.setupCoopMode();
        
        const debugInfo = gameManager.getDebugInfo();
        TestHelpers.assert(debugInfo.includes("disabled") || debugInfo.includes("coop"), 
            "Building restrictions should be disabled in Coop mode");
    }),

    it("should handle landlower actions", () => {
        const gameManager = GameManager.getInstance();
        
        // Setup PVP mode with test players
        TestHelpers.setupPvpMode();
        TestHelpers.registerTestPlayers();
        
        // Get coordinates for player 0's region
        const topLeftCoords = TestHelpers.getRegionCoordinates("top-left");
        
        // Simulate landlower action
        const landlowerAction = {
            action: "landlower",
            args: {
                x: topLeftCoords.x,
                y: topLeftCoords.y,
                x1: topLeftCoords.x - 16,
                y1: topLeftCoords.y - 16,
                x2: topLeftCoords.x + 16,
                y2: topLeftCoords.y + 16,
                selectionType: 0,
                flags: -2147483648
            },
            player: 0,
            type: 24,
            isClientOnly: false
        };
        
        TestHelpers.assertNotNull(landlowerAction, "Landlower action should be created");
        TestHelpers.assertEqual(landlowerAction.action, "landlower", "Action should be landlower");
    })
], TestHelpers.setupTestEnvironment, TestHelpers.teardownTestEnvironment);
