import { subscriptions } from "../manager";
import { GameManager } from "../../managers/GameManager";
import { colourLabel, getStaffOwner } from "../../bingo/playerColours";
import type { RegisteredPlayer } from "../../managers/PlayerManager";

/** Path tile just inside each region's entrance, where hired staff are moved to */
const STAFF_DROP_TILES: { [colour: string]: { x: number; y: number } } = {
    red: { x: 5, y: 30 },
    green: { x: 5, y: 99 },
    blue: { x: 124, y: 30 },
    yellow: { x: 124, y: 99 },
};
const PEEP_PICKUP = 0;
const PEEP_PLACE = 2;
const SERVER_PLAYER_ID = 0;

/**
 * Auto-positioned staff can land in another player's region (and be stuck there, since the
 * regions' paths aren't connected). Pick them up and place them in the hiring player's region.
 */
function moveStaffToRegion(staffId: number, player: RegisteredPlayer): void {
    const staff = map.getEntity(staffId);
    const ground = GameManager.getInstance().getGroundDivisionManager();
    if (!staff || ground.getRegionForTile({ x: Math.floor(staff.x / 32), y: Math.floor(staff.y / 32) }) === player.region) return;

    const drop = STAFF_DROP_TILES[player.colour];
    const path = map
        .getTile(drop.x, drop.y)
        .elements.filter((element) => element.type === "footpath")[0];
    if (!path) {
        console.log(`[StaffNaming] No path at the ${player.colour} drop tile, leaving staff ${staffId} where it is`);
        return;
    }

    context.executeAction("peeppickup", { type: PEEP_PICKUP, id: staffId, x: 0, y: 0, z: 0, playerId: SERVER_PLAYER_ID }, (picked) => {
        if (picked.error) {
            console.log(`[StaffNaming] Couldn't pick up staff ${staffId}: ${picked.errorMessage}`);
            return;
        }
        context.executeAction(
            "peeppickup",
            { type: PEEP_PLACE, id: staffId, x: drop.x * 32, y: drop.y * 32, z: path.baseZ, playerId: SERVER_PLAYER_ID },
            (placed) => {
                if (placed.error) {
                    console.log(`[StaffNaming] Couldn't place staff ${staffId} in ${player.region}: ${placed.errorMessage}`);
                }
            },
        );
    });
}

/** StaffSetPatrolAreaMode::set */
const PATROL_SET = 0;

/**
 * Gives a staff member their player's whole region as patrol area. Without one, OpenRCT2 calls
 * the mechanic closest in a straight line to a broken ride, also one in another region who can't
 * reach it (the regions' paths aren't connected); mechanics only answer rides in their patrol area.
 */
function setRegionPatrol(staffId: number, player: RegisteredPlayer): void {
    const rect = GameManager.getInstance().getGroundDivisionManager().getRegion(player.region);
    context.executeAction(
        "staffsetpatrolarea",
        { id: staffId, x1: rect.x1 * 32, y1: rect.y1 * 32, x2: rect.x2 * 32, y2: rect.y2 * 32, mode: PATROL_SET },
        (result) => {
            if (result.error) console.log(`[StaffNaming] Couldn't set the patrol area of staff ${staffId}: ${result.errorMessage}`);
        },
    );
}

/**
 * PvP/Lockout: rename hired staff to "<Colour> <name>" (e.g. "Red Handyman 1") so everyone can
 * see who hired them, and make sure they start in the hiring player's region. The prefix is also what makes them that player's staff: only they can
 * fire, re-order or move them (buildingRestrictions.ts). They patrol the player's region, and
 * always keep a patrol area there (see setRegionPatrol).
 */
export function subscribeToStaffNaming(): void {
    subscriptions.upsert("staffNaming", () =>
        context.subscribe("action.execute", (e) => {
            if (e.action !== "staffhire" || e.result.error) return;

            const mode: string = context.getParkStorage().get("gameMode", "coop");
            if (mode !== "pvp" && mode !== "lockout") return;

            const player = GameManager.getInstance().getPlayer(e.player.toString());
            const staffId = (e.result as StaffHireNewActionResult).peep;
            if (!player || typeof staffId !== "number") return;

            const staff = map.getEntity(staffId) as Staff | null;
            if (!staff || getStaffOwner(staff.name)) return;

            context.executeAction("staffsetname", { id: staffId, name: `${colourLabel(player.colour)} ${staff.name}` }, (result) => {
                if (result.error) {
                    console.log(`[StaffNaming] Couldn't rename staff ${staffId}: ${result.errorMessage}`);
                }
            });
            moveStaffToRegion(staffId, player);
            setRegionPatrol(staffId, player);
        })
    );

    // A player cleared their staff member's patrol area: back to the whole region
    subscriptions.upsert("staffPatrol", () =>
        context.subscribe("action.execute", (e) => {
            if (e.action !== "staffsetpatrolarea" || e.result.error || e.player === 0 || e.player === -1) return;

            const player = GameManager.getInstance().getPlayer(e.player.toString());
            const staffId = (e.args as { id?: number }).id;
            if (!player || typeof staffId !== "number") return;

            const staff = map.getEntity(staffId) as Staff | null;
            if (!staff || getStaffOwner(staff.name) !== player.colour || staff.patrolArea.tiles.length > 0) return;

            setRegionPatrol(staffId, player);
            network.sendMessage(
                `👷 ${staff.name} patrols your whole region again: staff need a patrol area, or mechanics get called to rides they can't reach.`,
                [e.player],
            );
        })
    );
}
