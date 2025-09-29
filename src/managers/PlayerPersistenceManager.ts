/*
 * PlayerPersistenceManager
 * - Manages persistent player data using park storage
 * - Maps regions to players and stores their state
 * - Handles migration from old systems
 */

import type { PlayerRegionKey } from "./GroundDivisionManager";

export interface PersistentPlayer {
    id: string;
    name: string;
    colour: string;
    region: PlayerRegionKey;
    registeredAt: number; // timestamp
    lastSeen: number; // timestamp
    isActive: boolean;
}

export interface PersistentPlayerState {
    playerId: string;
    playerName: string;
    region: PlayerRegionKey;
    guests: {
        count: number;
        lastUpdated: number;
    };
    rides: number[];
    goals: {
        completed: string[];
        progress: { [goalId: string]: any };
    };
    stats: {
        totalProfit: number;
        totalGuests: number;
        ridesBuilt: number;
        lastActivity: number;
    };
    lastSaved: number;
}

export class PlayerPersistenceManager {
    private static readonly STORAGE_KEYS = {
        REGION_MAPPINGS: "bingo_region_mappings",
        PLAYER_DATA: "bingo_player_data",
        PLAYER_STATES: "bingo_player_states",
        MIGRATION_VERSION: "bingo_migration_version"
    };

    private static readonly CURRENT_VERSION = "1.0.0";

    /**
     * Register a player to a region with persistence
     */
    public static registerPlayerToRegion(
        playerId: string, 
        playerName: string, 
        colour: string, 
        region: PlayerRegionKey
    ): void {
        const parkStorage = context.getParkStorage();
        
        // Get current region mappings
        const regionMappings = this.getRegionMappings();
        
        // Check if region is already taken
        if (regionMappings[region] && regionMappings[region].id !== playerId) {
            console.warn("[PlayerPersistence] Region " + region + " is already assigned to player " + regionMappings[region].id);
            return;
        }

        // Create persistent player data
        const now = Date.now();
        const persistentPlayer: PersistentPlayer = {
            id: playerId,
            name: playerName,
            colour: colour,
            region: region,
            registeredAt: now,
            lastSeen: now,
            isActive: true
        };

        // Update region mappings
        regionMappings[region] = persistentPlayer;
        parkStorage.set(this.STORAGE_KEYS.REGION_MAPPINGS, regionMappings);

        // Initialize player state if not exists
        this.initializePlayerState(playerId, playerName, region);

        console.log("[PlayerPersistence] Registered player " + playerName + " (" + playerId + ") to region " + region);
    }

    /**
     * Get player assigned to a region
     */
    public static getPlayerForRegion(region: PlayerRegionKey): PersistentPlayer | null {
        const regionMappings = this.getRegionMappings();
        return regionMappings[region] || null;
    }

    /**
     * Get all region mappings
     */
    public static getRegionMappings(): { [region: string]: PersistentPlayer } {
        const parkStorage = context.getParkStorage();
        return parkStorage.get(this.STORAGE_KEYS.REGION_MAPPINGS, {});
    }

    /**
     * Get all registered players
     */
    public static getAllPlayers(): PersistentPlayer[] {
        const regionMappings = this.getRegionMappings();
        const players: PersistentPlayer[] = [];
        for (const region in regionMappings) {
            players.push(regionMappings[region]);
        }
        return players;
    }

    /**
     * Update player last seen timestamp
     */
    public static updatePlayerLastSeen(playerId: string): void {
        const regionMappings = this.getRegionMappings();
        
        for (const region in regionMappings) {
            if (regionMappings[region].id === playerId) {
                regionMappings[region].lastSeen = Date.now();
                const parkStorage = context.getParkStorage();
                parkStorage.set(this.STORAGE_KEYS.REGION_MAPPINGS, regionMappings);
                break;
            }
        }
    }

    /**
     * Save player state to storage
     */
    public static savePlayerState(playerId: string, state: Partial<PersistentPlayerState>): void {
        const parkStorage = context.getParkStorage();
        const playerStates = this.getAllPlayerStates();
        
        const existingState = playerStates[playerId] || this.createEmptyPlayerState(playerId, "Unknown", "top-left");
        const updatedState: PersistentPlayerState = {
            ...existingState,
            ...state,
            lastSaved: Date.now()
        };

        playerStates[playerId] = updatedState;
        parkStorage.set(this.STORAGE_KEYS.PLAYER_STATES, playerStates);

        console.log("[PlayerPersistence] Saved state for player " + playerId);
    }

    /**
     * Load player state from storage
     */
    public static loadPlayerState(playerId: string): PersistentPlayerState | null {
        const playerStates = this.getAllPlayerStates();
        return playerStates[playerId] || null;
    }

    /**
     * Get all player states
     */
    public static getAllPlayerStates(): { [playerId: string]: PersistentPlayerState } {
        const parkStorage = context.getParkStorage();
        return parkStorage.get(this.STORAGE_KEYS.PLAYER_STATES, {});
    }

    /**
     * Initialize empty player state
     */
    private static initializePlayerState(playerId: string, playerName: string, region: PlayerRegionKey): void {
        const existingState = this.loadPlayerState(playerId);
        if (existingState) {
            return; // Already exists
        }

        const emptyState = this.createEmptyPlayerState(playerId, playerName, region);
        this.savePlayerState(playerId, emptyState);
    }

    /**
     * Create empty player state
     */
    private static createEmptyPlayerState(playerId: string, playerName: string, region: PlayerRegionKey): PersistentPlayerState {
        const now = Date.now();
        return {
            playerId,
            playerName,
            region,
            guests: {
                count: 0,
                lastUpdated: now
            },
            rides: [],
            goals: {
                completed: [],
                progress: {}
            },
            stats: {
                totalProfit: 0,
                totalGuests: 0,
                ridesBuilt: 0,
                lastActivity: now
            },
            lastSaved: now
        };
    }

    /**
     * Remove player from region
     */
    public static unregisterPlayerFromRegion(region: PlayerRegionKey): void {
        const regionMappings = this.getRegionMappings();
        delete regionMappings[region];
        
        const parkStorage = context.getParkStorage();
        parkStorage.set(this.STORAGE_KEYS.REGION_MAPPINGS, regionMappings);
        
        console.log("[PlayerPersistence] Unregistered player from region " + region);
    }

    /**
     * Clear all player data (for testing/reset)
     */
    public static clearAllPlayerData(): void {
        const parkStorage = context.getParkStorage();
        parkStorage.set(this.STORAGE_KEYS.REGION_MAPPINGS, {});
        parkStorage.set(this.STORAGE_KEYS.PLAYER_STATES, {});
        console.log("[PlayerPersistence] Cleared all player data");
    }

    /**
     * Get debug info about persistent data
     */
    public static getDebugInfo(): string {
        const regionMappings = this.getRegionMappings();
        const playerStates = this.getAllPlayerStates();
        
        let info = "=== Player Persistence Debug Info ===\n";
        
        // Count region mappings
        var regionCount = 0;
        for (var region in regionMappings) {
            regionCount++;
        }
        info += "Registered players: " + regionCount + "\n";
        
        // Count player states
        var stateCount = 0;
        for (var playerId in playerStates) {
            stateCount++;
        }
        info += "Player states: " + stateCount + "\n\n";
        
        info += "Region Mappings:\n";
        for (var region in regionMappings) {
            var player = regionMappings[region];
            info += "  " + region + ": " + player.name + " (" + player.id + ") - " + (player.isActive ? 'Active' : 'Inactive') + "\n";
        }
        
        info += "\nPlayer States:\n";
        for (var playerId in playerStates) {
            var state = playerStates[playerId];
            info += "  " + playerId + ": " + state.playerName + " - " + state.rides.length + " rides, " + state.guests.count + " guests\n";
        }
        
        return info;
    }

    /**
     * Run migration if needed
     */
    // public static runMigrationIfNeeded(): void {
    //     const parkStorage = context.getParkStorage();
    //     const currentVersion = parkStorage.get(this.STORAGE_KEYS.MIGRATION_VERSION, "0.0.0");
        
    //     if (currentVersion !== this.CURRENT_VERSION) {
    //         console.log("[PlayerPersistence] Running migration from " + currentVersion + " to " + this.CURRENT_VERSION);
    //         this.migrateFromOldSystem();
    //         parkStorage.set(this.STORAGE_KEYS.MIGRATION_VERSION, this.CURRENT_VERSION);
    //     }
    // }

    /**
     * Migrate from old system (if any)
     */
    // private static migrateFromOldSystem(): void {
    //     // This would handle migration from any previous system
    //     // For now, just ensure we have the right structure
    //     console.log("[PlayerPersistence] Migration completed");
    // }
}
