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
    /** Stable identity of the person (see getPlayerIdentity) - network ids change on reconnect */
    identity?: string;
}

export class PlayerManager {
    private players: { [id: string]: RegisteredPlayer } = {};

    constructor() {
        this.loadPersistentPlayers();
    }

    public registerPlayer(id: string, name: string, colour: string, region: PlayerRegionKey, identity?: string): void {
        console.log(`[PlayerManager] Registering player: id="${id}", name="${name}", colour="${colour}", region="${region}"`);
        
        // Register in memory
        this.players[id] = { id, name, colour, region, identity };
        
        // Register persistently
        PlayerPersistenceManager.registerPlayerToRegion(id, name, colour, region, identity);
        
        var playerCount = Object.keys(this.players).length;
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
                    region: persistentPlayer.region,
                    identity: persistentPlayer.identity
                };
            }
        }
        
        var playerCount = Object.keys(this.players).length;
        console.log("[PlayerManager] Loaded " + playerCount + " persistent players");
    }

    public getPlayerByIdentity(identity: string): RegisteredPlayer | null {
        for (const id in this.players) {
            if (this.players[id].identity === identity) return this.players[id];
        }
        return null;
    }

    /**
     * A person joined with network id newId. Network ids aren't stable (they change on reconnect
     * and get reused), so:
     * - a registration still holding newId from an earlier connection is detached, so the new
     *   person doesn't inherit someone else's region
     * - if this person registered before, their registration moves to newId
     * Returns the old id when a registration was moved.
     */
    public reconnectPlayer(newId: string, identity: string): string | null {
        const holder = this.players[newId];
        if (holder && holder.identity !== identity) {
            this.changePlayerId(newId, `offline:${holder.identity || newId}`);
        }

        const registered = this.getPlayerByIdentity(identity);
        if (!registered || registered.id === newId) {
            return null;
        }

        const oldId = registered.id;
        this.changePlayerId(oldId, newId);
        return oldId;
    }

    private changePlayerId(oldId: string, newId: string): void {
        this.players[newId] = { ...this.players[oldId], id: newId };
        delete this.players[oldId];
        PlayerPersistenceManager.changePlayerId(oldId, newId);
        console.log(`[PlayerManager] Registration of ${this.players[newId].colour} moved from id ${oldId} to ${newId}`);
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


