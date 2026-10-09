/*
 * Region spawns (PvP/Lockout): new guests only arrive in regions that a player picked.
 *
 * Guests are created at peep spawns outside the park; every region has one next to its own
 * entrance, and new guests are spread over all spawns. Removing the spawn of an unpicked
 * region means no guests are wasted on it; picking the colour puts the spawn back.
 *
 * Plugins can't read the spawns, and "peepspawnplace" on a tile that already has a spawn removes
 * it, so the removed spawns are tracked here. Changing spawns needs sandbox mode, so it's never
 * done while the game is still being set up (setup toggles the same cheats).
 */

import { debugMode } from "src/utils";
import { GameManager } from "../managers/GameManager";
import { PLAYER_COLOURS } from "./playerColours";

/** Spawn tile per region, checked in-game with park.generateGuest() */
const SPAWNS: { [colour: string]: { x: number; y: number; z: number; direction: number } } = {
    red: { x: 2, y: 30, z: 112, direction: 3 }, // scenario's original spawn
    green: { x: 1, y: 99, z: 112, direction: 3 },
    blue: { x: 128, y: 30, z: 112, direction: 1 },
    yellow: { x: 128, y: 99, z: 112, direction: 1 },
};

const removedSpawns: { [colour: string]: boolean } = {};
let syncing = false;
let syncAgain = false;

/**
 * Make the spawns match the registrations: present for picked colours, removed for the rest.
 * Server only; safe to call often.
 */
export function syncRegionSpawns(): void {
    if (network.mode === "client") return;

    const mode: string = context.getParkStorage().get("gameMode", "coop");
    const gameManager = GameManager.getInstance();
    if ((mode !== "pvp" && mode !== "lockout") || gameManager.isGameInitializing()) return;

    if (syncing) {
        syncAgain = true;
        return;
    }

    const picked = gameManager.getAllPlayers().map((player) => player.colour);
    // Each placement toggles the spawn on its tile: removes it when closing, adds it when opening
    const toToggle = PLAYER_COLOURS.filter((colour) => (picked.indexOf(colour) === -1) !== !!removedSpawns[colour]);
    if (toToggle.length === 0) return;

    syncing = true;
    debugMode(1, () => {
        let remaining = toToggle.length;
        toToggle.forEach((colour) => {
            const spawn = SPAWNS[colour];
            context.executeAction(
                "peepspawnplace",
                { x: spawn.x * 32, y: spawn.y * 32, z: spawn.z, direction: spawn.direction },
                (result) => {
                    if (result.error) {
                        console.log(`[RegionSpawns] Couldn't change the ${colour} guest spawn: ${result.errorMessage}`);
                    } else {
                        removedSpawns[colour] = !removedSpawns[colour];
                        console.log(`[RegionSpawns] ${removedSpawns[colour] ? "Removed" : "Restored"} the ${colour} guest spawn`);
                    }

                    remaining--;
                    if (remaining > 0) return;
                    debugMode(0, () => {
                        syncing = false;
                        if (syncAgain) {
                            syncAgain = false;
                            syncRegionSpawns();
                        }
                    });
                },
            );
        });
    });
}
