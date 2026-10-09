/*
 * Goal scopes - what a goal is checked against.
 *
 * In PvP/Lockout every goal is checked per player against that player's region. Rides,
 * guests and litter are attributed by location:
 * - rides/stalls: building restrictions keep every piece inside its owner's region, so the
 *   first station decides the region
 * - guests/litter: each region has its own park entrance and the dividing lines are unowned,
 *   so guests stay in the region they entered
 *
 * Reading the map through the plugin API is slow, so scopes are built in one pass per check
 * cycle and every goal reads from them.
 */

import type { GroundDivisionManager, PlayerRegionKey } from "../managers/GroundDivisionManager";

export interface GoalScope {
    /** Region this scope covers, or the whole park (coop) */
    region: PlayerRegionKey | "park";
    /** Rides, stalls and facilities whose first station is in the region */
    rides: Ride[];
    /** Guests inside the park, in the region */
    guests: Guest[];
    /** Litter on the region's tiles */
    litterCount: number;
}

export type RegionScopes = { [region in PlayerRegionKey]: GoalScope };

function createScope(region: PlayerRegionKey | "park"): GoalScope {
    return { region, rides: [], guests: [], litterCount: 0 };
}

/**
 * Region a ride belongs to: where its first station is. Null for rides without a station yet.
 */
export function getRideRegion(ride: Ride, ground: GroundDivisionManager): PlayerRegionKey | null {
    for (let i = 0; i < ride.stations.length; i++) {
        const start = ride.stations[i].start;
        if (start) {
            return ground.getRegionForTile({ x: Math.floor(start.x / 32), y: Math.floor(start.y / 32) });
        }
    }
    return null;
}

function getEntityRegion(entity: { x: number; y: number }, ground: GroundDivisionManager): PlayerRegionKey | null {
    return ground.getRegionForTile({ x: Math.floor(entity.x / 32), y: Math.floor(entity.y / 32) });
}

/**
 * Build the scope of every region in a single pass over the map
 */
export function buildRegionScopes(ground: GroundDivisionManager): RegionScopes {
    const scopes: RegionScopes = {
        "top-left": createScope("top-left"),
        "top-right": createScope("top-right"),
        "bottom-left": createScope("bottom-left"),
        "bottom-right": createScope("bottom-right"),
    };

    const rides = map.rides;
    for (let i = 0; i < rides.length; i++) {
        const region = getRideRegion(rides[i], ground);
        if (region) scopes[region].rides.push(rides[i]);
    }

    const guests = map.getAllEntities("guest");
    for (let i = 0; i < guests.length; i++) {
        if (!guests[i].isInPark) continue;
        const region = getEntityRegion(guests[i], ground);
        if (region) scopes[region].guests.push(guests[i]);
    }

    const litter = map.getAllEntities("litter");
    for (let i = 0; i < litter.length; i++) {
        const region = getEntityRegion(litter[i], ground);
        if (region) scopes[region].litterCount++;
    }

    return scopes;
}

let parkScope: GoalScope | null = null;
let parkScopeTick = -1;

/**
 * The whole park as one scope, for coop checks of goals that also exist per player.
 * Cached per game tick, since every such goal asks for it in the same check cycle.
 */
export function buildParkScope(): GoalScope {
    if (parkScope && parkScopeTick === date.ticksElapsed) {
        return parkScope;
    }

    const scope = createScope("park");
    scope.rides = map.rides;
    scope.guests = map.getAllEntities("guest").filter((guest) => guest.isInPark);
    scope.litterCount = map.getAllEntities("litter").length;

    parkScope = scope;
    parkScopeTick = date.ticksElapsed;
    return scope;
}
