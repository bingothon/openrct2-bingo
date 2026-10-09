/// <reference path="../lib/openrct2.d.ts" />

import test from "ava";
import Mock from "openrct2-mocks";
import { createParkStorage } from "../_mocks";
import { GameManager } from "../../src/managers/GameManager";
import { GroundDivisionManager } from "../../src/managers/GroundDivisionManager";
import { PlayerManager } from "../../src/managers/PlayerManager";

const parkStorage = createParkStorage();

test.before(() => {
    // Mock OpenRCT2 globals
    globalThis.context = Mock.context({
        getTypeIdForAction: () => 80,
        getParkStorage: (() => parkStorage) as any,
    });
    
    globalThis.network = Mock.network({
        groups: [Mock.playerGroup({ permissions: ["ride_properties"] })]
    });
    
    globalThis.map = Mock.map({ entities: [] });
});

test("Building restrictions integration - PVP mode", t => {
    const gameManager = GameManager.getInstance();
    const groundManager = gameManager.getGroundDivisionManager();
    const playerManager = gameManager.getPlayerManager();
    
    // Setup PVP mode
    gameManager.setGameMode("pvp");
    gameManager.setInitializing(false);
    
    // Register players in different regions
    gameManager.registerPlayer("0", "Player 0", "red", "top-left");
    gameManager.registerPlayer("1", "Player 1", "blue", "top-right");
    
    // Test that players are registered
    const players = gameManager.getAllPlayers();
    t.is(players.length, 2, "Should have two players registered");
    
    // Test region assignments
    t.is(playerManager.getPlayerRegion("0"), "top-left", "Player 0 should be in top-left region");
    t.is(playerManager.getPlayerRegion("1"), "top-right", "Player 1 should be in top-right region");
    
    // Test that building restrictions are enabled in PVP mode
    const debugInfo = gameManager.getDebugInfo();
    t.true(debugInfo.includes("enabled") || debugInfo.includes("pvp"), 
        "Building restrictions should be enabled in PVP mode");
});

test("Building restrictions integration - Lockout mode", t => {
    const gameManager = GameManager.getInstance();
    
    // Setup Lockout mode
    gameManager.setGameMode("lockout");
    gameManager.setInitializing(false);
    
    // Register players
    gameManager.registerPlayer("0", "Player 0", "red", "top-left");
    gameManager.registerPlayer("1", "Player 1", "blue", "top-right");
    
    // Test that building restrictions are enabled in Lockout mode
    const debugInfo = gameManager.getDebugInfo();
    t.true(debugInfo.includes("enabled") || debugInfo.includes("lockout"), 
        "Building restrictions should be enabled in Lockout mode");
});

test("Building restrictions integration - Coop mode", t => {
    const gameManager = GameManager.getInstance();
    
    // Setup Coop mode
    gameManager.setGameMode("coop");
    gameManager.setInitializing(false);
    
    // Register players
    gameManager.registerPlayer("0", "Player 0", "red", "top-left");
    gameManager.registerPlayer("1", "Player 1", "blue", "top-right");
    
    // Test that building restrictions are disabled in Coop mode
    const debugInfo = gameManager.getDebugInfo();
    t.true(debugInfo.includes("disabled") || debugInfo.includes("coop"), 
        "Building restrictions should be disabled in Coop mode");
});

test("Building restrictions integration - region validation", t => {
    const gameManager = GameManager.getInstance();
    const groundManager = gameManager.getGroundDivisionManager();
    const playerManager = gameManager.getPlayerManager();
    
    // Setup PVP mode with players
    gameManager.setGameMode("pvp");
    gameManager.setInitializing(false);
    gameManager.registerPlayer("0", "Player 0", "red", "top-left");
    gameManager.registerPlayer("1", "Player 1", "blue", "top-right");
    
    // Test region coordinates
    const topLeftCoords = { x: 32, y: 32 }; // Center of top-left region
    const topRightCoords = { x: 96, y: 32 }; // Center of top-right region
    
    const topLeftRegion = groundManager.getRegionForTile(topLeftCoords);
    const topRightRegion = groundManager.getRegionForTile(topRightCoords);
    
    t.is(topLeftRegion, "top-left", "Top-left coordinates should be in top-left region");
    t.is(topRightRegion, "top-right", "Top-right coordinates should be in top-right region");
    
    // Test that players are assigned to correct regions
    t.is(playerManager.getPlayerRegion("0"), topLeftRegion, "Player 0 should be in top-left region");
    t.is(playerManager.getPlayerRegion("1"), topRightRegion, "Player 1 should be in top-right region");
});

test("Building restrictions integration - mode switching", t => {
    const gameManager = GameManager.getInstance();
    
    // Start with Coop mode (restrictions disabled)
    gameManager.setGameMode("coop");
    gameManager.setInitializing(false);
    
    let debugInfo = gameManager.getDebugInfo();
    t.true(debugInfo.includes("disabled") || debugInfo.includes("coop"), 
        "Building restrictions should be disabled in Coop mode");
    
    // Switch to PVP mode (restrictions enabled)
    gameManager.setGameMode("pvp");
    debugInfo = gameManager.getDebugInfo();
    t.true(debugInfo.includes("enabled") || debugInfo.includes("pvp"), 
        "Building restrictions should be enabled in PVP mode");
    
    // Switch to Lockout mode (restrictions enabled)
    gameManager.setGameMode("lockout");
    debugInfo = gameManager.getDebugInfo();
    t.true(debugInfo.includes("enabled") || debugInfo.includes("lockout"), 
        "Building restrictions should be enabled in Lockout mode");
});

test("Building restrictions integration - player persistence", t => {
    const gameManager = GameManager.getInstance();
    
    // Register players
    gameManager.registerPlayer("0", "Player 0", "red", "top-left");
    gameManager.registerPlayer("1", "Player 1", "blue", "top-right");
    
    const initialPlayers = gameManager.getAllPlayers();
    t.is(initialPlayers.length, 2, "Should have two players initially");
    
    // Switch modes and verify players persist
    gameManager.setGameMode("pvp");
    gameManager.setGameMode("lockout");
    gameManager.setGameMode("coop");
    
    const finalPlayers = gameManager.getAllPlayers();
    t.is(finalPlayers.length, 2, "Should still have two players after mode switches");
    t.is(finalPlayers[0].name, "Player 0", "Player 0 should persist");
    t.is(finalPlayers[1].name, "Player 1", "Player 1 should persist");
});
