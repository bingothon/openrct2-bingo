/*
 * PlayerManager
 * - Registers players and assigns them to colour/region keys
 * - Bridges UI colour names to region keys used by GroundDivisionManager
 */

import type { PlayerRegionKey } from "./GroundDivisionManager";
import { PlayerPersistenceManager } from "./PlayerPersistenceManager";

export interface RegisteredPlayer {
    id: string;
    name: string;
    colour: string; // semantic colour name e.g. "red", "blue"
    region: PlayerRegionKey;
}

export class PlayerManager {
    private players: { [id: string]: RegisteredPlayer } = {};

    constructor() {
        this.loadPersistentPlayers();
    }

    public registerPlayer(id: string, name: string, colour: string, region: PlayerRegionKey): void {
        console.log(`[PlayerManager] Registering player: id="${id}", name="${name}", colour="${colour}", region="${region}"`);
        
        // Register in memory
        this.players[id] = { id, name, colour, region };
        
        // Register persistently
        PlayerPersistenceManager.registerPlayerToRegion(id, name, colour, region);
        
        // Count players (ES5 compatible)
        var playerCount = 0;
        for (var playerId in this.players) {
            playerCount++;
        }
        console.log("[PlayerManager] Player registered. Total players: " + playerCount);
    }

    public getPlayer(id: string): RegisteredPlayer | null {
        return this.players[id] || null;
    }

    public getAllPlayers(): RegisteredPlayer[] {
        const list: RegisteredPlayer[] = [];
        for (const id in this.players) list.push(this.players[id]);
        // Removed excessive logging - only log when debug is needed
        return list;
    }

    public getRegionForPlayer(id: string): PlayerRegionKey | null {
        const p = this.players[id];
        return p ? p.region : null;
    }

    public getPlayerRegion(playerId: number | string): PlayerRegionKey | null {
        // Convert playerId to string for lookup
        const player = this.getPlayer(playerId.toString());
        return player ? player.region : null;
    }

    /**
     * Load persistent players from storage
     */
    private loadPersistentPlayers(): void {
        const persistentPlayers = PlayerPersistenceManager.getAllPlayers();
        
        for (const persistentPlayer of persistentPlayers) {
            if (persistentPlayer.isActive) {
                this.players[persistentPlayer.id] = {
                    id: persistentPlayer.id,
                    name: persistentPlayer.name,
                    colour: persistentPlayer.colour,
                    region: persistentPlayer.region
                };
            }
        }
        
        // Count players (ES5 compatible)
        var playerCount = 0;
        for (var playerId in this.players) {
            playerCount++;
        }
        console.log("[PlayerManager] Loaded " + playerCount + " persistent players");
    }

    /**
     * Get player for a specific region
     */
    public getPlayerForRegion(region: PlayerRegionKey): RegisteredPlayer | null {
        const persistentPlayer = PlayerPersistenceManager.getPlayerForRegion(region);
        if (!persistentPlayer) return null;
        
        return this.getPlayer(persistentPlayer.id);
    }

    /**
     * Unregister player from region
     */
    public unregisterPlayerFromRegion(region: PlayerRegionKey): void {
        const player = this.getPlayerForRegion(region);
        if (player) {
            delete this.players[player.id];
            PlayerPersistenceManager.unregisterPlayerFromRegion(region);
            console.log(`[PlayerManager] Unregistered player from region ${region}`);
        }
    }

    /**
     * Update player last seen
     */
    public updatePlayerLastSeen(playerId: string): void {
        PlayerPersistenceManager.updatePlayerLastSeen(playerId);
    }

    /**
     * Get debug info
     */
    public getDebugInfo(): string {
        return PlayerPersistenceManager.getDebugInfo();
    }
}


