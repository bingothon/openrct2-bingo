/*
 * PlayerManager
 * - Registers players and assigns them to colour/region keys
 * - Bridges UI colour names to region keys used by GroundDivisionManager
 */

import type { PlayerRegionKey } from "./GroundDivisionManager";

export interface RegisteredPlayer {
    id: string;
    name: string;
    colour: string; // semantic colour name e.g. "red", "blue"
    region: PlayerRegionKey;
}

export class PlayerManager {
    private players: { [id: string]: RegisteredPlayer } = {};

    public registerPlayer(id: string, name: string, colour: string, region: PlayerRegionKey): void {
        console.log(`[PlayerManager] Registering player: id="${id}", name="${name}", colour="${colour}", region="${region}"`);
        this.players[id] = { id, name, colour, region };
        console.log(`[PlayerManager] Player registered. Total players: ${Object.keys(this.players).length}`);
    }

    public getPlayer(id: string): RegisteredPlayer | undefined {
        return this.players[id];
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

    public getPlayerRegion(playerId: number): PlayerRegionKey | null {
        // Convert numeric playerId to string for lookup
        const player = this.getPlayer(playerId.toString());
        return player ? player.region : null;
    }
}


