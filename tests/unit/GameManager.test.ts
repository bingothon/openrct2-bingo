/// <reference path="../lib/openrct2.d.ts" />

import test from "ava";
import Mock from "openrct2-mocks";
import { createParkStorage } from "../_mocks";
import { GameManager } from "../../src/managers/GameManager";

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

test("GameManager singleton pattern", t => {
    const instance1 = GameManager.getInstance();
    const instance2 = GameManager.getInstance();
    
    t.is(instance1, instance2, "Should return the same instance");
});

test("GameManager initialization", t => {
    const gameManager = GameManager.getInstance();
    
    t.truthy(gameManager, "GameManager should be initialized");
    t.is(typeof gameManager.getCurrentGameMode, "function", "Should have getCurrentGameMode method");
    t.is(typeof gameManager.setGameMode, "function", "Should have setGameMode method");
    t.is(typeof gameManager.registerPlayer, "function", "Should have registerPlayer method");
});

test("GameManager game mode switching", t => {
    const gameManager = GameManager.getInstance();
    
    // Test PVP mode
    gameManager.setGameMode("pvp");
    t.is(gameManager.getCurrentGameMode(), "pvp", "Should set game mode to PVP");
    
    // Test Lockout mode
    gameManager.setGameMode("lockout");
    t.is(gameManager.getCurrentGameMode(), "lockout", "Should set game mode to Lockout");
    
    // Test Coop mode
    gameManager.setGameMode("coop");
    t.is(gameManager.getCurrentGameMode(), "coop", "Should set game mode to Coop");
});

test("GameManager player registration", t => {
    const gameManager = GameManager.getInstance();
    
    // Clear any existing players
    const initialPlayers = gameManager.getAllPlayers();
    t.is(initialPlayers.length, 0, "Should start with no players");
    
    // Register a player
    gameManager.registerPlayer("0", "Test Player", "red", "top-left");
    
    const players = gameManager.getAllPlayers();
    t.is(players.length, 1, "Should have one player after registration");
    t.is(players[0].name, "Test Player", "Player name should match");
    t.is(players[0].colour, "red", "Player color should match");
    t.is(players[0].region, "top-left", "Player region should match");
});

test("GameManager initialization state", t => {
    const gameManager = GameManager.getInstance();
    
    // Test initializing state
    gameManager.setInitializing(true);
    t.true(gameManager.isGameInitializing(), "Should be in initializing state");
    
    // Test non-initializing state
    gameManager.setInitializing(false);
    t.false(gameManager.isGameInitializing(), "Should not be in initializing state");
});

test("GameManager debug info", t => {
    const gameManager = GameManager.getInstance();
    const debugInfo = gameManager.getDebugInfo();
    
    t.truthy(debugInfo, "Debug info should not be null");
    t.true(debugInfo.includes("GameManager Debug Info"), "Debug info should contain header");
    t.true(debugInfo.includes("Players registered"), "Debug info should contain player count");
    t.true(debugInfo.includes("Building restrictions"), "Debug info should contain restriction status");
});
