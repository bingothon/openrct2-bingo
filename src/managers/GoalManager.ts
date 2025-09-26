/*
 * GoalManager
 * - Validates whether a goal interaction is allowed based on player region
 * - Intended to be wired with GroundDivisionManager and PlayerManager
 */

import type { GroundDivisionManager, PlayerRegionKey, TilePoint } from "./GroundDivisionManager";
import type { PlayerManager } from "./PlayerManager";

export class GoalManager {
    private ground: GroundDivisionManager;
    private players: PlayerManager;

    constructor(ground: GroundDivisionManager, players: PlayerManager) {
        this.ground = ground;
        this.players = players;
    }

    // Example policy: a goal at tile belongs to the region where the tile lies.
    // Only the player assigned to that region may complete/interact.
    public canPlayerAffectGoalAtTile(playerId: string, tile: TilePoint): boolean {
        const playerRegion = this.players.getRegionForPlayer(playerId);
        if (!playerRegion) return false;
        const tileRegion = this.ground.getRegionForTile(tile);
        return tileRegion === playerRegion;
    }

    // Convenience for world coords
    public canPlayerAffectGoalAtWorld(playerId: string, world: { x: number; y: number }): boolean {
        const tile = this.ground.worldToTile(world);
        return this.canPlayerAffectGoalAtTile(playerId, tile);
    }

    // Future extension points
    public getTileRegion(tile: TilePoint): PlayerRegionKey | null {
        return this.ground.getRegionForTile(tile);
    }
}


