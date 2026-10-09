/// <reference path="../lib/openrct2.d.ts" />

import test from "ava";
import Mock from "openrct2-mocks";
import { createParkStorage } from "../_mocks";
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

test.beforeEach(() => {
    // Each test starts from an empty park
    parkStorage.data = {};
});

test.serial("PlayerManager initialization", t => {
    const playerManager = new PlayerManager();
    
    t.truthy(playerManager, "PlayerManager should be initialized");
    t.is(typeof playerManager.getAllPlayers, "function", "Should have getAllPlayers method");
    t.is(typeof playerManager.getPlayer, "function", "Should have getPlayer method");
    t.is(typeof playerManager.registerPlayer, "function", "Should have registerPlayer method");
});

test.serial("PlayerManager player registration", t => {
    const playerManager = new PlayerManager();
    
    // Start with no players
    const initialPlayers = playerManager.getAllPlayers();
    t.is(initialPlayers.length, 0, "Should start with no players");
    
    // Register a player
    playerManager.registerPlayer("0", "Test Player", "red", "top-left");
    
    const players = playerManager.getAllPlayers();
    t.is(players.length, 1, "Should have one player after registration");
    
    const player = players[0];
    t.is(player.id, "0", "Player ID should match");
    t.is(player.name, "Test Player", "Player name should match");
    t.is(player.colour, "red", "Player color should match");
    t.is(player.region, "top-left", "Player region should match");
});

test.serial("PlayerManager get player by ID", t => {
    const playerManager = new PlayerManager();
    
    // Register a player
    playerManager.registerPlayer("1", "Player One", "blue", "top-right");
    
    const player = playerManager.getPlayer("1");
    t.truthy(player, "Should return player by ID");
    t.is(player?.name, "Player One", "Player name should match");
    t.is(player?.colour, "blue", "Player color should match");
    t.is(player?.region, "top-right", "Player region should match");
});

test.serial("PlayerManager get player region", t => {
    const playerManager = new PlayerManager();
    
    // Register players in different regions
    playerManager.registerPlayer("0", "Player 0", "red", "top-left");
    playerManager.registerPlayer("1", "Player 1", "blue", "top-right");
    playerManager.registerPlayer("2", "Player 2", "green", "bottom-left");
    playerManager.registerPlayer("3", "Player 3", "yellow", "bottom-right");
    
    // Test region retrieval
    t.is(playerManager.getPlayerRegion("0"), "top-left", "Player 0 should be in top-left region");
    t.is(playerManager.getPlayerRegion("1"), "top-right", "Player 1 should be in top-right region");
    t.is(playerManager.getPlayerRegion("2"), "bottom-left", "Player 2 should be in bottom-left region");
    t.is(playerManager.getPlayerRegion("3"), "bottom-right", "Player 3 should be in bottom-right region");
});

test.serial("PlayerManager multiple players", t => {
    const playerManager = new PlayerManager();
    
    // Register multiple players
    playerManager.registerPlayer("0", "Player 0", "red", "top-left");
    playerManager.registerPlayer("1", "Player 1", "blue", "top-right");
    playerManager.registerPlayer("2", "Player 2", "green", "bottom-left");
    
    const players = playerManager.getAllPlayers();
    t.is(players.length, 3, "Should have three players");
    
    // Test that all players are unique
    const playerIds = players.map(p => p.id);
    const uniqueIds = [...new Set(playerIds)];
    t.is(uniqueIds.length, playerIds.length, "All player IDs should be unique");
});

test.serial("PlayerManager get non-existent player", t => {
    const playerManager = new PlayerManager();
    
    const player = playerManager.getPlayer("999");
    t.is(player, null, "Should return null for non-existent player");
    
    const region = playerManager.getPlayerRegion("999");
    t.is(region, null, "Should return null for non-existent player region");
});

test.serial("PlayerManager player validation", t => {
    const playerManager = new PlayerManager();
    
    // Test with valid data
    playerManager.registerPlayer("0", "Valid Player", "red", "top-left");
    const player = playerManager.getPlayer("0");
    t.truthy(player, "Should register valid player");
    
    // Test that player properties are correctly set
    t.is(player?.id, "0", "Player ID should be set correctly");
    t.is(player?.name, "Valid Player", "Player name should be set correctly");
    t.is(player?.colour, "red", "Player color should be set correctly");
    t.is(player?.region, "top-left", "Player region should be set correctly");
});
