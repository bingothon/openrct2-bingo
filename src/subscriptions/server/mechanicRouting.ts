import { subscriptions } from "../manager";
import { config } from "../../config";
import { GameManager } from "../../managers/GameManager";
import { getRideRegion } from "../../bingo/goalScopes";

/*
 * PvP/Lockout: OpenRCT2 calls the mechanic closest to a broken ride (or one due for inspection) in
 * a straight line, unless mechanics have a patrol area. A mechanic in a neighbouring region can be
 * the closest, but can't reach the ride (the regions' paths aren't connected): he gives up after
 * about a minute, is called again, and the ride never gets fixed while the other player loses him.
 *
 * Mechanics are left alone otherwise. While a ride in some region needs a mechanic, mechanics in
 * the other regions that have no patrol area get their own region as a temporary one: the area
 * they can walk anyway, so their own work doesn't change, but the foreign ride can't call them.
 * It goes again after a quiet while. Players' own patrol areas are never touched (they're always
 * inside their region), so dedicated staff work as usual.
 */

const CHECK_TICKS = 40; // about a second
/** How long a temporary patrol area stays after the last ride elsewhere needed a mechanic */
const TEMPORARY_PATROL_MS = 2 * 60_000;
const PATROL_SET = 0;
const PATROL_CLEAR_ALL = 2;
/** RideFlag bits: breakdownPending, brokenDown, dueInspection */
const NEEDS_MECHANIC = (1 << 6) | (1 << 7) | (1 << 8);

/** Staff id -> when the temporary patrol area may go, and how many tiles we gave it */
const temporaryPatrols: { [id: number]: { until: number; tiles: number } } = {};

/** Regions with a ride that is broken (or about to be) or due for inspection */
export function getRegionsNeedingMechanic(): string[] {
    const ground = GameManager.getInstance().getGroundDivisionManager();
    const regions: string[] = [];
    map.rides.forEach((ride) => {
        if ((ride.lifecycleFlags & NEEDS_MECHANIC) === 0) return;
        const region = getRideRegion(ride, ground);
        if (region && regions.indexOf(region) === -1) regions.push(region);
    });
    return regions;
}

function shield(mechanic: Staff, region: string): void {
    const id = mechanic.id as number;
    const existing = temporaryPatrols[id];
    if (existing) {
        existing.until = Date.now() + TEMPORARY_PATROL_MS;
        return;
    }
    if (mechanic.patrolArea.tiles.length > 0) return; // the player's own area: inside their region

    // Reserve it now, so the next check doesn't send the action again
    temporaryPatrols[id] = { until: Date.now() + TEMPORARY_PATROL_MS, tiles: -1 };
    const rect = GameManager.getInstance().getGroundDivisionManager().getRegion(region as never);
    context.executeAction(
        "staffsetpatrolarea",
        { id, x1: rect.x1 * 32, y1: rect.y1 * 32, x2: rect.x2 * 32, y2: rect.y2 * 32, mode: PATROL_SET },
        (result) => {
            if (result.error) {
                console.log(`[MechanicRouting] Couldn't give ${mechanic.name} a temporary patrol area: ${result.errorMessage}`);
                delete temporaryPatrols[id];
                return;
            }
            const staff = map.getEntity(id) as Staff | null;
            if (temporaryPatrols[id]) temporaryPatrols[id].tiles = staff ? staff.patrolArea.tiles.length : 0;
        },
    );
}

function removeExpiredPatrols(): void {
    const now = Date.now();
    Object.keys(temporaryPatrols).forEach((key) => {
        const id = Number(key);
        const temporary = temporaryPatrols[id];
        if (now < temporary.until || temporary.tiles < 0) return;
        delete temporaryPatrols[id];

        const staff = map.getEntity(id) as Staff | null;
        // Gone, or the player changed the area meanwhile: it's theirs now
        if (!staff || staff.type !== "staff" || staff.patrolArea.tiles.length !== temporary.tiles) return;
        context.executeAction("staffsetpatrolarea", { id, x1: 0, y1: 0, x2: 0, y2: 0, mode: PATROL_CLEAR_ALL });
    });
}

/** One check: shield the mechanics outside every region that needs one */
export function routeMechanics(): void {
    if (config.gameMode !== "pvp" && config.gameMode !== "lockout") return;

    const needing = getRegionsNeedingMechanic();
    if (needing.length > 0) {
        const ground = GameManager.getInstance().getGroundDivisionManager();
        map.getAllEntities("staff").forEach((staff) => {
            if (staff.staffType !== "mechanic" || staff.id === null) return;
            const region = ground.getRegionForTile({ x: Math.floor(staff.x / 32), y: Math.floor(staff.y / 32) });
            if (region && needing.some((needy) => needy !== region)) shield(staff, region);
        });
    }
    removeExpiredPatrols();
}

export function subscribeToMechanicRouting(): void {
    let ticks = 0;
    subscriptions.upsert("mechanicRouting", () =>
        context.subscribe("interval.tick", () => {
            if (++ticks % CHECK_TICKS === 0) routeMechanics();
        }),
    );
}
