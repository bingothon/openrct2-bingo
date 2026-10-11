import { subscriptions } from "../manager";
import { config } from "../../config";
import { GameManager } from "../../managers/GameManager";
import type { RegisteredPlayer } from "../../managers/PlayerManager";
import type { PlayerRegionKey } from "../../managers/GroundDivisionManager";
import { COLOR_TO_REGION, getStaffOwner } from "../../bingo/playerColours";
import { isColourClosed } from "../../bingo/closedRegions";
import { rememberRegion, restoreRegion } from "../../bingo/regionRestore";
import { getPlayerIdentity } from "../../utils/playerIdentity";
import { sendGameMessage } from "./helpers";

/*
 * PvP/Lockout: a player who leaves keeps their region for config.leaveGraceMinutes (real time).
 * If they don't come back, their colour is closed for the rest of the game (closeRegion action:
 * claimed goals stay locked, the score goes off the board) and the region is cleared: staff fired,
 * rides and stalls demolished, the land put back the way it was when the colour was picked.
 */

const MINUTE_MS = 60_000;
/** identity -> pending timeout */
const pending: { [identity: string]: number } = {};

/** Stops a pending region close; false when there was none */
function cancelPending(identity: string): boolean {
    if (pending[identity] === undefined) return false;
    context.clearTimeout(pending[identity]);
    delete pending[identity];
    return true;
}

function isPvpGame(): boolean {
    return config.gameMode === "pvp" || config.gameMode === "lockout";
}

function isOnline(identity: string): boolean {
    return network.players.some((player) => getPlayerIdentity(player.id) === identity);
}

/**
 * The rides with track in the region. Found through the track itself: a stall's station has no
 * position (station.start is null).
 */
function getRidesInRegion(region: PlayerRegionKey): number[] {
    const ground = GameManager.getInstance().getGroundDivisionManager();
    const rect = ground.getRegion(region);
    const rideIds: number[] = [];
    for (let x = rect.x1; x <= rect.x2; x++) {
        for (let y = rect.y1; y <= rect.y2; y++) {
            if (ground.getRegionForTile({ x, y }) !== region) continue;
            map.getTile(x, y).elements.forEach((element) => {
                // Track only: the park entrance is an entrance element too
                if (element.type !== "track") return;
                const ride = (element as TrackElement).ride;
                if (typeof ride === "number" && rideIds.indexOf(ride) === -1) rideIds.push(ride);
            });
        }
    }
    return rideIds;
}

function demolishRides(region: PlayerRegionKey, onDone: () => void): void {
    const rideIds = getRidesInRegion(region);
    if (rideIds.length === 0) {
        onDone();
        return;
    }
    let remaining = rideIds.length;
    let refunds = 0;
    rideIds.forEach((rideId) => {
        context.executeAction("ridedemolish", { ride: rideId, modifyType: 0 }, (result) => {
            if (result.error) console.log(`[LeavingPlayers] Couldn't demolish ride ${rideId}: ${result.errorMessage}`);
            else refunds += result.cost || 0;
            if (--remaining > 0) return;
            // The refunds would go to the shared park cash, i.e. to the other players
            if (refunds !== 0) context.executeAction("addCash", { args: { cash: refunds } }, () => onDone());
            else onDone();
        });
    });
}

function fireStaff(colour: string): void {
    map.getAllEntities("staff").forEach((staff) => {
        if (getStaffOwner(staff.name) !== colour || staff.id === null) return;
        context.executeAction("stafffire", { id: staff.id }, (result) => {
            if (result.error) console.log(`[LeavingPlayers] Couldn't fire ${staff.name}: ${result.errorMessage}`);
        });
    });
}

/**
 * Server: close the colour and clear its region (also the /closeregion admin command).
 * False when the colour isn't in use.
 */
export function closeRegion(colour: string): boolean {
    const entry = COLOR_TO_REGION[colour];
    if (!entry || isColourClosed(colour)) return false;

    const player = GameManager.getInstance().getAllPlayers().filter((p) => p.colour === colour)[0];
    if (player && player.identity) cancelPending(player.identity);

    context.executeAction("closeRegion", { args: { colour } }, (result) => {
        if (result.error) {
            console.log(`[LeavingPlayers] Couldn't close ${colour}: ${result.errorMessage}`);
            return;
        }
        GameManager.getInstance().getGoalManager().onColourClosed();
        sendGameMessage(`🧹 ${colour.toUpperCase()}'s region is being cleared - it's closed for the rest of this game.`);

        fireStaff(colour);
        demolishRides(entry.region, () => {
            const ground = GameManager.getInstance().getGroundDivisionManager();
            restoreRegion(ground, entry.region, () => console.log(`[LeavingPlayers] ${colour}'s region is cleared`));
        });
    });
    return true;
}

function onLeave(player: RegisteredPlayer): void {
    const identity = player.identity;
    if (!identity || pending[identity] !== undefined) return;

    const minutes = config.leaveGraceMinutes;
    sendGameMessage(`⏳ ${player.colour.toUpperCase()} left - their region stays for ${minutes} minutes. Rejoin to keep it!`);
    pending[identity] = context.setTimeout(() => {
        delete pending[identity];
        if (isOnline(identity)) return;
        const current = GameManager.getInstance().getPlayerManager().getPlayerByIdentity(identity);
        if (current) closeRegion(current.colour);
    }, minutes * MINUTE_MS);
}

export function subscribeToLeavingPlayers(): void {
    subscriptions.upsert("leavingPlayers.leave", () =>
        context.subscribe("network.leave", (e) => {
            if (!isPvpGame() || context.getParkStorage().get("gameOver", false)) return;
            const player = GameManager.getInstance().getPlayer(e.player.toString());
            if (player) onLeave(player);
        }),
    );

    subscriptions.upsert("leavingPlayers.join", () =>
        context.subscribe("network.join", (e) => {
            const identity = getPlayerIdentity(e.player);
            if (!identity || !cancelPending(identity)) return;
            const player = GameManager.getInstance().getPlayerManager().getPlayerByIdentity(identity);
            if (player) sendGameMessage(`👋 ${player.colour.toUpperCase()} is back and keeps their region.`);
        }),
    );

    // A region's original state is what it looks like when its colour is picked: nobody can
    // build there before
    subscriptions.upsert("leavingPlayers.snapshot", () =>
        context.subscribe("action.execute", (e) => {
            if (e.action !== "registerPlayer" || e.result.error) return;
            const args = (e.args as { args?: { colour?: string } }).args;
            const entry = args && args.colour ? COLOR_TO_REGION[args.colour] : undefined;
            if (entry) rememberRegion(GameManager.getInstance().getGroundDivisionManager(), entry.region);
        }),
    );
}
