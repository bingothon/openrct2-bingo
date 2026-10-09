import test from 'ava';
import { PlayerPersistenceManager } from '../../src/managers/PlayerPersistenceManager';

// Mock OpenRCT2 context
const mockParkStorage = {
    data: {} as any,
    get: function(key: string, defaultValue?: any) {
        return this.data[key] !== undefined ? this.data[key] : defaultValue;
    },
    set: function(key: string, value: any) {
        this.data[key] = value;
    }
};

// Mock global context
(global as any).context = {
    getParkStorage: () => mockParkStorage
};

test.beforeEach(() => {
    // Clear storage before each test
    mockParkStorage.data = {};
});

test.serial('PlayerPersistenceManager - Register player to region', t => {
    PlayerPersistenceManager.registerPlayerToRegion("player1", "Test Player", "red", "top-left");
    
    const player = PlayerPersistenceManager.getPlayerForRegion("top-left");
    t.truthy(player);
    t.is(player!.id, "player1");
    t.is(player!.name, "Test Player");
    t.is(player!.colour, "red");
    t.is(player!.region, "top-left");
    t.true(player!.isActive);
});

test.serial('PlayerPersistenceManager - Get all players', t => {
    PlayerPersistenceManager.registerPlayerToRegion("player1", "Player 1", "red", "top-left");
    PlayerPersistenceManager.registerPlayerToRegion("player2", "Player 2", "blue", "top-right");
    
    const allPlayers = PlayerPersistenceManager.getAllPlayers();
    t.is(allPlayers.length, 2);
    
    const playerNames = allPlayers.map(p => p.name).sort();
    t.deepEqual(playerNames, ["Player 1", "Player 2"]);
});

test.serial('PlayerPersistenceManager - Save and load player state', t => {
    const playerId = "test-player";
    const playerName = "Test Player";
    const region = "top-left";
    
    // Register player first
    PlayerPersistenceManager.registerPlayerToRegion(playerId, playerName, "red", region);
    
    // Save state
    const testState = {
        guests: { count: 100, lastUpdated: Date.now() },
        rides: [1, 2, 3],
        stats: { 
            totalProfit: 5000, 
            totalGuests: 100, 
            ridesBuilt: 3, 
            lastActivity: Date.now() 
        }
    };
    
    PlayerPersistenceManager.savePlayerState(playerId, testState);
    
    // Load state
    const loadedState = PlayerPersistenceManager.loadPlayerState(playerId);
    t.truthy(loadedState);
    t.is(loadedState!.playerId, playerId);
    t.is(loadedState!.playerName, playerName);
    t.is(loadedState!.region, region);
    t.is(loadedState!.guests.count, 100);
    t.deepEqual(loadedState!.rides, [1, 2, 3]);
    t.is(loadedState!.stats.totalProfit, 5000);
});

test.serial('PlayerPersistenceManager - Region conflict handling', t => {
    // Register first player
    PlayerPersistenceManager.registerPlayerToRegion("player1", "Player 1", "red", "top-left");
    
    // Try to register different player to same region
    PlayerPersistenceManager.registerPlayerToRegion("player2", "Player 2", "blue", "top-left");
    
    // Should still be player1
    const player = PlayerPersistenceManager.getPlayerForRegion("top-left");
    t.is(player!.id, "player1");
    t.is(player!.name, "Player 1");
});

test.serial('PlayerPersistenceManager - Unregister player from region', t => {
    PlayerPersistenceManager.registerPlayerToRegion("player1", "Player 1", "red", "top-left");
    
    // Verify player is registered
    t.truthy(PlayerPersistenceManager.getPlayerForRegion("top-left"));
    
    // Unregister
    PlayerPersistenceManager.unregisterPlayerFromRegion("top-left");
    
    // Verify player is gone
    t.is(PlayerPersistenceManager.getPlayerForRegion("top-left"), null);
});

test.serial('PlayerPersistenceManager - Clear all data', t => {
    // Register some players
    PlayerPersistenceManager.registerPlayerToRegion("player1", "Player 1", "red", "top-left");
    PlayerPersistenceManager.registerPlayerToRegion("player2", "Player 2", "blue", "top-right");
    
    // Save some states
    PlayerPersistenceManager.savePlayerState("player1", { guests: { count: 50, lastUpdated: Date.now() } });
    
    // Verify data exists
    t.is(PlayerPersistenceManager.getAllPlayers().length, 2);
    t.truthy(PlayerPersistenceManager.loadPlayerState("player1"));
    
    // Clear all data
    PlayerPersistenceManager.clearAllPlayerData();
    
    // Verify data is gone
    t.is(PlayerPersistenceManager.getAllPlayers().length, 0);
    t.is(PlayerPersistenceManager.loadPlayerState("player1"), null);
});

test.serial('PlayerPersistenceManager - Update player last seen', t => {
    PlayerPersistenceManager.registerPlayerToRegion("player1", "Player 1", "red", "top-left");
    
    const initialTime = Date.now();
    const player = PlayerPersistenceManager.getPlayerForRegion("top-left");
    t.truthy(player);
    
    // Wait a bit and update last seen
    setTimeout(() => {
        PlayerPersistenceManager.updatePlayerLastSeen("player1");
        
        const updatedPlayer = PlayerPersistenceManager.getPlayerForRegion("top-left");
        t.truthy(updatedPlayer);
        t.true(updatedPlayer!.lastSeen > initialTime);
    }, 10);
});

test.serial('PlayerPersistenceManager - Debug info', t => {
    PlayerPersistenceManager.registerPlayerToRegion("player1", "Player 1", "red", "top-left");
    PlayerPersistenceManager.savePlayerState("player1", { 
        guests: { count: 25, lastUpdated: Date.now() },
        rides: [1, 2]
    });
    
    const debugInfo = PlayerPersistenceManager.getDebugInfo();
    t.truthy(debugInfo);
    t.true(debugInfo.includes("Player 1"));
    t.true(debugInfo.includes("top-left"));
    t.true(debugInfo.includes("Registered players: 1"));
});
