/*
 * PlayerStateManager
 * - Tracks player-specific state for region-aware goal checking
 * - Maintains JSON-like state for each player
 * - Updates state based on OpenRCT2 events
 */

import type { GroundDivisionManager } from "./GroundDivisionManager";
import type { PlayerManager } from "./PlayerManager";
import type { Goal } from "../types";
import { PlayerPersistenceManager, type PersistentPlayerState } from "./PlayerPersistenceManager";

export interface PlayerStateManagerInstance {
    playerStates: { [key: string]: PlayerState };
    ground: GroundDivisionManager;
    players: PlayerManager;
    initializePlayerStates(): void;
    subscribeToEvents(): void;
    onRideBuilt(rideId: number): void;
    onRideRemoved(rideId: number): void;
    onRideRenamed(rideId: number): void;
    onRideRatingsCalculated(e: any): void;
    onBuildingPlaced(e: any): void;
    onTrackPlaced(e: any): void;
    onFootpathPlaced(e: any): void;
    onFootpathAdditionPlaced(e: any): void;
    onBannerPlaced(e: any): void;
    onTrackDesignPlaced(e: any): void;
    onActionLocation(e: any): void;
    updateGuestCounts(): void;
    getRideRegion(rideId: number): string | null;
    getGuestRegion(guest: Guest): string | null;
    getPlayerIdByRegion(region: string): string | null;
    getPlayerState(playerId: string): PlayerState | null;
    getAllPlayerStates(): { [key: string]: PlayerState };
    isGoalCompletedForPlayer(goal: Goal, playerId: string): boolean;
    // Helper methods for rides array
    getPlayerRides(playerId: string): number[];
    getPlayerRidesByType(playerId: string, rideType: number): number[];
    getPlayerRideCount(playerId: string): number;
    getPlayerTotalProfit(playerId: string): number;
    getPlayerRideProperty(playerId: string, property: string): any[];
    getPlayerRidesByProperty(playerId: string, property: string, value: any): number[];
    // Persistence methods
    savePlayerStateToStorage(playerId: string): void;
    saveAllPlayerStatesToStorage(): void;
}

export function PlayerStateManager(this: PlayerStateManagerInstance, ground: GroundDivisionManager, players: PlayerManager) {
    var self: PlayerStateManagerInstance = this;
    this.playerStates = {};
    this.ground = ground;
    this.players = players;
    
    // Rate limiting for logs
    var lastLogTimes: { [action: string]: number } = {};
    var logRateLimit = 30000; // 30 seconds
    
    // Helper function for rate-limited logging
    var logAction = function(action: string, message: string, data?: any) {
        var now = Date.now();
        var lastTime = lastLogTimes[action] || 0;
        
        if (now - lastTime > logRateLimit) {
            console.log(message);
            if (data) {
                console.log(data);
            }
            lastLogTimes[action] = now;
        }
    };
    
    this.initializePlayerStates = function(): void {
        var allPlayers = self.players.getAllPlayers();
        console.log("[PlayerStateManager] Initializing player states for " + allPlayers.length + " players");
        
        for (var i = 0; i < allPlayers.length; i++) {
            var player = allPlayers[i];
            console.log("[PlayerStateManager] Creating state for player " + player.id + " (" + player.name + ") in region " + player.region);
            
            // Try to load existing persistent state
            var persistentState = PlayerPersistenceManager.loadPlayerState(player.id);
            
            if (persistentState) {
                // Convert persistent state to in-memory state
                self.playerStates[player.id] = {
                    playerId: persistentState.playerId,
                    playerName: persistentState.playerName,
                    region: persistentState.region,
                    guests: {
                        count: persistentState.guests.count
                    },
                    rides: persistentState.rides
                };
                console.log("[PlayerStateManager] Loaded persistent state for player " + player.id);
            } else {
                // Create new state
                self.playerStates[player.id] = {
                    playerId: player.id,
                    playerName: player.name,
                    region: player.region,
                    guests: {
                        count: 0
                    },
                    rides: []
                };
                
                // Save to persistent storage
                PlayerPersistenceManager.savePlayerState(player.id, {
                    playerId: player.id,
                    playerName: player.name,
                    region: player.region,
                    guests: { count: 0, lastUpdated: Date.now() },
                    rides: [],
                    goals: { completed: [], progress: {} },
                    stats: { totalProfit: 0, totalGuests: 0, ridesBuilt: 0, lastActivity: Date.now() }
                });
            }
        }
        // Count player states (ES5 compatible)
        var stateCount = 0;
        for (var playerId in self.playerStates) {
            stateCount++;
        }
        console.log("[PlayerStateManager] Player states initialized. Total states: " + stateCount);
    };

    this.subscribeToEvents = function(): void {
        // Track all building and ride actions
        context.subscribe("action.execute", function(e: any) {
            // Log all actions with rate limiting - show full object
            logAction(e.action, "[PlayerStateManager] Action executed: " + e.action, e);
            
            // Special handling for ride actions
            if (e.action === "ridecreate" || e.action === "ridesetstatus" || e.action === "ridedemolish" || e.action === "ridesetname") {
                var rideId = (e.result && e.result.ride) || (e.result && e.result.rideId) || (e.args && e.args.rideId) || 'unknown';
                logAction("ride_" + e.action, "[PlayerStateManager] RIDE ACTION: " + e.action + " - Ride ID: " + rideId);
            }
            
            // Ride actions
            if (e.action === "ridecreate") {
                self.onRideBuilt(e.result && e.result.ride);
            }
            if (e.action === "ridedemolish") {
                self.onRideRemoved(e.args && e.args.ride);
            }
            if (e.action === "ridesetname") {
                self.onRideRenamed(e.args && e.args.rideId);
            }
            
            // Building actions
            if (e.action === "smallsceneryplace") {
                self.onBuildingPlaced(e);
            }
            if (e.action === "largesceneryplace") {
                self.onBuildingPlaced(e);
            }
            if (e.action === "wallplace") {
                self.onBuildingPlaced(e);
            }
            if (e.action === "trackplace") {
                self.onTrackPlaced(e);
            }
            if (e.action === "footpathplace") {
                self.onFootpathPlaced(e);
            }
            if (e.action === "footpathadditionplace") {
                self.onFootpathAdditionPlaced(e);
            }
            if (e.action === "bannerplace") {
                self.onBannerPlaced(e);
            }
            if (e.action === "trackdesign") {
                self.onTrackDesignPlaced(e);
            }
        });

        // Track ride ratings and stats
        context.subscribe("ride.ratings.calculate", function(e: any) {
            self.onRideRatingsCalculated(e);
        });

        // Track location-based actions
        context.subscribe("action.location", function(e: any) {
            self.onActionLocation(e);
        });

        // Track guest movement
        context.subscribe("interval.tick", function() {
            self.updateGuestCounts();
        });
    };

    this.onRideBuilt = function(rideId: number, playerId?: string): void {
        if (!rideId) return;
        
        // Just use player 0 for now since building restrictions ensure they can only build in their region
        if (!playerId) playerId = "0";

        var playerState = self.playerStates[playerId];
        if (!playerState) return;

        // Check if ride ID already exists to prevent duplicates
        var alreadyExists = false;
        for (var i = 0; i < playerState.rides.length; i++) {
            if (playerState.rides[i] === rideId) {
                alreadyExists = true;
                break;
            }
        }

        if (alreadyExists) {
            console.log("[PlayerStateManager] Ride ID " + rideId + " already exists for player " + playerId);
            return;
        }

        console.log("[PlayerStateManager] RIDE ADDED: ID " + rideId + " -> Player " + playerId);

        // Just push the ride ID directly
        playerState.rides.push(rideId);
    };

    this.onRideRemoved = function(rideId: number): void {
        if (!rideId) {
            console.log("[PlayerStateManager] onRideRemoved called with invalid rideId:", rideId);
            return;
        }
        
        console.log("[PlayerStateManager] RIDE REMOVED: ID " + rideId);
        
        // Find and remove from player state
        for (var playerId in self.playerStates) {
            if (Object.prototype.hasOwnProperty.call(self.playerStates, playerId)) {
                var state = self.playerStates[playerId];
                var rideIndex = -1;
                for (var i = 0; i < state.rides.length; i++) {
                    if (state.rides[i] === rideId) {
                        rideIndex = i;
                        break;
                    }
                }
                if (rideIndex !== -1) {
                    console.log("[PlayerStateManager] Removing ride " + rideId + " from player " + playerId);
                    state.rides.splice(rideIndex, 1);
                    break;
                }
            }
        }
    };

    this.onRideRatingsCalculated = function(e: any): void {
        var rideId = e.rideId;
        if (!rideId) return;

        var region = self.getRideRegion(rideId);
        if (!region) return;

        var playerId = self.getPlayerIdByRegion(region);
        if (!playerId) return;

        var playerState = self.playerStates[playerId];
        if (!playerState) return;

        // Just log that ratings were calculated - we don't store ride properties anymore
        console.log("[PlayerStateManager] Ride ratings calculated for ride " + rideId + " in region " + region);
    };

    this.onRideRenamed = function(rideId: number): void {
        if (!rideId) return;
        var ride = map.getRide(rideId);
        if (!ride) return;

        var region = self.getRideRegion(rideId);
        if (!region) return;

        var playerId = self.getPlayerIdByRegion(region);
        if (!playerId) return;

        var playerState = self.playerStates[playerId];
        if (!playerState) return;

        // Just log that ride was renamed - we don't store ride properties anymore
        console.log("[PlayerStateManager] Ride " + rideId + " renamed to '" + ride.name + "' in region " + region);
    };

    this.onBuildingPlaced = function(e: any): void {
        var args = e.args;
        if (!args || typeof args.x !== 'number' || typeof args.y !== 'number') return;

        var tileX = Math.floor(args.x / 32);
        var tileY = Math.floor(args.y / 32);
        var region = self.ground.getRegionForTile({ x: tileX, y: tileY });
        if (!region) return;

        var playerId = self.getPlayerIdByRegion(region);
        if (!playerId) return;

        var playerState = self.playerStates[playerId];
        if (!playerState) return;

        // Track building placement for potential bingo goals
        // This could be used for goals like "place 10 decorations" or "build 5 shops"
        logAction("buildingplaced", "[PlayerStateManager] Building placed by player " + playerId + " in region " + region);
    };

    this.onTrackPlaced = function(e: any): void {
        var args = e.args;
        if (!args || typeof args.x !== 'number' || typeof args.y !== 'number') return;

        var tileX = Math.floor(args.x / 32);
        var tileY = Math.floor(args.y / 32);
        var region = self.ground.getRegionForTile({ x: tileX, y: tileY });
        if (!region) return;

        var playerId = self.getPlayerIdByRegion(region);
        if (!playerId) return;

        var playerState = self.playerStates[playerId];
        if (!playerState) return;

        // Track track placement for potential bingo goals
        logAction("trackplaced", "[PlayerStateManager] Track placed by player " + playerId + " in region " + region);
    };

    this.onFootpathPlaced = function(e: any): void {
        var args = e.args;
        if (!args || typeof args.x !== 'number' || typeof args.y !== 'number') return;

        var tileX = Math.floor(args.x / 32);
        var tileY = Math.floor(args.y / 32);
        var region = self.ground.getRegionForTile({ x: tileX, y: tileY });
        if (!region) return;

        var playerId = self.getPlayerIdByRegion(region);
        if (!playerId) return;

        var playerState = self.playerStates[playerId];
        if (!playerState) return;

        // Track footpath placement for potential bingo goals
        logAction("footpathplaced", "[PlayerStateManager] Footpath placed by player " + playerId + " in region " + region);
    };

    this.onFootpathAdditionPlaced = function(e: any): void {
        var args = e.args;
        if (!args || typeof args.x !== 'number' || typeof args.y !== 'number') return;

        var tileX = Math.floor(args.x / 32);
        var tileY = Math.floor(args.y / 32);
        var region = self.ground.getRegionForTile({ x: tileX, y: tileY });
        if (!region) return;

        var playerId = self.getPlayerIdByRegion(region);
        if (!playerId) return;

        var playerState = self.playerStates[playerId];
        if (!playerState) return;

        // Track footpath addition placement for potential bingo goals
        logAction("footpathadditionplaced", "[PlayerStateManager] Footpath addition placed by player " + playerId + " in region " + region);
    };

    this.onBannerPlaced = function(e: any): void {
        var args = e.args;
        if (!args || typeof args.x !== 'number' || typeof args.y !== 'number') return;

        var tileX = Math.floor(args.x / 32);
        var tileY = Math.floor(args.y / 32);
        var region = self.ground.getRegionForTile({ x: tileX, y: tileY });
        if (!region) return;

        var playerId = self.getPlayerIdByRegion(region);
        if (!playerId) return;

        var playerState = self.playerStates[playerId];
        if (!playerState) return;

        // Track banner placement for potential bingo goals
        logAction("bannerplaced", "[PlayerStateManager] Banner placed by player " + playerId + " in region " + region);
    };

    this.onTrackDesignPlaced = function(e: any): void {
        var args = e.args;
        if (!args || typeof args.x !== 'number' || typeof args.y !== 'number') return;

        var tileX = Math.floor(args.x / 32);
        var tileY = Math.floor(args.y / 32);
        var region = self.ground.getRegionForTile({ x: tileX, y: tileY });
        if (!region) return;

        var playerId = self.getPlayerIdByRegion(region);
        if (!playerId) return;

        var playerState = self.playerStates[playerId];
        if (!playerState) return;

        // Track track design placement for potential bingo goals
        logAction("trackdesignplaced", "[PlayerStateManager] Track design placed by player " + playerId + " in region " + region);
    };

    this.onActionLocation = function(e: any): void {
        var args = e.args;
        if (!args || typeof args.x !== 'number' || typeof args.y !== 'number') return;

        var tileX = Math.floor(args.x / 32);
        var tileY = Math.floor(args.y / 32);
        var region = self.ground.getRegionForTile({ x: tileX, y: tileY });
        if (!region) return;

        var playerId = self.getPlayerIdByRegion(region);
        if (!playerId) return;

        var playerState = self.playerStates[playerId];
        if (!playerState) return;

        // Track location-based actions for potential bingo goals
        // This can include actions like:
        // - Staff hiring/firing at specific locations
        // - Park entrance/exit modifications
        // - Land purchases
        // - Water/landscaping changes
        // - Guest interactions at specific locations
        console.log("[PlayerStateManager] Location action '" + e.action + "' by player " + playerId + " at (" + args.x + ", " + args.y + ") in region " + region);
        
        // You can add specific tracking for different action types here
        switch (e.action) {
            case "staffhire":
                console.log("[PlayerStateManager] Staff hired by player " + playerId);
                break;
            case "stafffire":
                console.log("[PlayerStateManager] Staff fired by player " + playerId);
                break;
            case "parkentranceplace":
                logAction("parkentranceplaced", "[PlayerStateManager] Park entrance placed by player " + playerId);
                break;
            case "landbuy":
                console.log("[PlayerStateManager] Land purchased by player " + playerId);
                break;
            case "landsetrights":
                console.log("[PlayerStateManager] Land rights set by player " + playerId);
                break;
            case "waterlower":
            case "waterraise":
                console.log("[PlayerStateManager] Water level changed by player " + playerId);
                break;
            case "landlower":
            case "landraise":
                console.log("[PlayerStateManager] Land level changed by player " + playerId);
                break;
            default:
                // Generic location action tracking
                break;
        }
    };

    this.updateGuestCounts = function(): void {
        var allGuests = map.getAllEntities("guest");
        var regionGuestCounts: { [key: string]: number } = {};
        
        // Initialize counts
        for (var playerId in self.playerStates) {
            if (Object.prototype.hasOwnProperty.call(self.playerStates, playerId)) {
                regionGuestCounts[playerId] = 0;
            }
        }

        // Count guests per region
        for (var i = 0; i < allGuests.length; i++) {
            var guest = allGuests[i];
            var region = self.getGuestRegion(guest);
            if (region) {
                var foundPlayerId = self.getPlayerIdByRegion(region);
                if (foundPlayerId) {
                    regionGuestCounts[foundPlayerId] = (regionGuestCounts[foundPlayerId] || 0) + 1;
                }
            }
        }

        // Update player states
        for (var playerId in regionGuestCounts) {
            if (Object.prototype.hasOwnProperty.call(regionGuestCounts, playerId)) {
                var count = regionGuestCounts[playerId];
                var state = self.playerStates[playerId];
                if (state) {
                    state.guests.count = count;
                }
            }
        }
    };

    this.getRideRegion = function(rideId: number): string | null {
        var ride = map.getRide(rideId);
        if (!ride) return null;

        for (var i = 0; i < ride.stations.length; i++) {
            var station = ride.stations[i];
            if (station && station.start && station.start.x !== null && station.start.y !== null) {
                var tile = self.ground.worldToTile({ x: station.start.x, y: station.start.y });
                var region = self.ground.getRegionForTile(tile);
                if (region) return region;
            }
        }
        return null;
    };

    this.getGuestRegion = function(guest: Guest): string | null {
        if (guest && guest.x !== null && guest.y !== null) {
            var tile = self.ground.worldToTile({ x: guest.x, y: guest.y });
            return self.ground.getRegionForTile(tile);
        }
        return null;
    };

    this.getPlayerIdByRegion = function(region: string): string | null {
        var allPlayers = self.players.getAllPlayers();
        for (var i = 0; i < allPlayers.length; i++) {
            if (allPlayers[i].region === region) {
                return allPlayers[i].id;
            }
        }
        return null;
    };

    this.getPlayerState = function(playerId: string): PlayerState | null {
        return self.playerStates[playerId] || null;
    };

    this.getAllPlayerStates = function(): { [key: string]: PlayerState } {
        return self.playerStates;
    };

    /**
     * Save player state to persistent storage
     */
    this.savePlayerStateToStorage = function(playerId: string): void {
        var state = self.playerStates[playerId];
        if (!state) return;

        // Convert in-memory state to persistent state
        var persistentState: Partial<PersistentPlayerState> = {
            playerId: state.playerId,
            playerName: state.playerName,
            region: state.region as any, // Type assertion for compatibility
            guests: {
                count: state.guests.count,
                lastUpdated: Date.now()
            },
            rides: state.rides
        };

        PlayerPersistenceManager.savePlayerState(playerId, persistentState);
    };

    /**
     * Save all player states to persistent storage
     */
    this.saveAllPlayerStatesToStorage = function(): void {
        for (var playerId in self.playerStates) {
            self.savePlayerStateToStorage(playerId);
        }
    };

    this.isGoalCompletedForPlayer = function(goal: Goal, playerId: string): boolean {
        var state = self.getPlayerState(playerId);
        if (!state) return false;

        if (goal.name.indexOf("guests") !== -1) {
            var required = goal.name.indexOf("100") !== -1 ? 100 : 500;
            return state.guests.count >= required;
        }

        if (goal.name.indexOf("coaster") !== -1) {
            // Count roller coasters from rides array
            var coasterCount = 0;
            for (var i = 0; i < state.rides.length; i++) {
                var rideId = state.rides[i];
                var ride = map.getRide(rideId);
                if (ride && ride.type === 0) { // Roller coaster type
                    coasterCount++;
                }
            }
            return coasterCount >= 3;
        }

        return false;
    };

    // Helper methods for working with rides array
    this.getPlayerRides = function(playerId: string): number[] {
        var state = self.getPlayerState(playerId);
        return state ? state.rides : [];
    };

    this.getPlayerRidesByType = function(playerId: string, rideType: number): number[] {
        var rideIds = self.getPlayerRides(playerId);
        var filteredRides: number[] = [];
        for (var i = 0; i < rideIds.length; i++) {
            var ride = map.getRide(rideIds[i]);
            if (ride && ride.type === rideType) {
                filteredRides.push(rideIds[i]);
            }
        }
        return filteredRides;
    };

    this.getPlayerRideCount = function(playerId: string): number {
        var rides = self.getPlayerRides(playerId);
        return rides.length;
    };

    this.getPlayerTotalProfit = function(playerId: string): number {
        var rideIds = self.getPlayerRides(playerId);
        var totalProfit = 0;
        for (var i = 0; i < rideIds.length; i++) {
            var ride = map.getRide(rideIds[i]);
            if (ride) {
                totalProfit += ride.totalProfit || 0;
            }
        }
        return totalProfit;
    };

    // Helper method to get a specific property from all rides
    this.getPlayerRideProperty = function(playerId: string, property: string): any[] {
        var rideIds = self.getPlayerRides(playerId);
        var properties: any[] = [];
        for (var i = 0; i < rideIds.length; i++) {
            var ride = map.getRide(rideIds[i]);
            if (ride) {
                properties.push((ride as any)[property]);
            }
        }
        return properties;
    };

    // Helper method to get rides that match a specific property value
    this.getPlayerRidesByProperty = function(playerId: string, property: string, value: any): number[] {
        var rideIds = self.getPlayerRides(playerId);
        var filteredRides: number[] = [];
        for (var i = 0; i < rideIds.length; i++) {
            var ride = map.getRide(rideIds[i]);
            if (ride && (ride as any)[property] === value) {
                filteredRides.push(rideIds[i]);
            }
        }
        return filteredRides;
    };


    // Initialize the manager
    console.log("[PlayerStateManager] Initializing PlayerStateManager...");
    this.initializePlayerStates();
    this.subscribeToEvents();
    console.log("[PlayerStateManager] PlayerStateManager initialization complete.");
}

export interface PlayerState {
    playerId: string;
    playerName: string;
    region: string;
    guests: {
        count: number;
    };
    rides: number[];
}


