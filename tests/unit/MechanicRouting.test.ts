/// <reference path="../../lib/openrct2.d.ts" />

/*
 * PvP/Lockout: while a ride needs a mechanic, mechanics without a patrol area in the other regions
 * get their own region as a temporary patrol area, so the ride can't call them (they can't reach it).
 */

import test from "ava";
import { createParkStorage } from "../_mocks";

const parkStorage = createParkStorage();
const g = globalThis as any;
const actions: { name: string; args: any }[] = [];
let rides: any[] = [];
let staff: any[] = [];
let now = 1_000_000;

const at = (tileX: number, tileY: number) => ({ x: tileX * 32 + 16, y: tileY * 32 + 16, z: 112 });
const BROKEN = 1 << 7;
const DUE_INSPECTION = 1 << 8;

g.network = { mode: "server" };
g.map = {
    get rides() { return rides; },
    getAllEntities: (type: string) => (type === "staff" ? staff : []),
    getEntity: (id: number) => staff.filter((s) => s.id === id)[0] || null,
};
g.context = {
    getParkStorage: () => parkStorage,
    subscribe: () => ({ dispose: () => {} }),
    executeAction: (name: string, args: any, callback?: (result: GameActionResult) => void) => {
        actions.push({ name, args });
        const target = staff.filter((s) => s.id === args.id)[0];
        if (name === "staffsetpatrolarea" && target) {
            target.patrolArea.tiles = args.mode === 0 ? new Array(4096).fill({ x: 0, y: 0 }) : [];
        }
        if (callback) callback({ error: 0 } as GameActionResult);
    },
};
Date.now = () => now;

const { config } = await import("../../src/config");
const { routeMechanics } = await import("../../src/subscriptions/server/mechanicRouting");

function mechanic(id: number, tileX: number, tileY: number, patrolTiles = 0) {
    return { id, name: `Mechanic ${id}`, type: "staff", staffType: "mechanic", ...at(tileX, tileY), patrolArea: { tiles: new Array(patrolTiles).fill({ x: 0, y: 0 }) } };
}
const ride = (tileX: number, tileY: number, flags: number) => ({ lifecycleFlags: flags, stations: [{ start: at(tileX, tileY) }] });
const patrolActions = () => actions.filter((action) => action.name === "staffsetpatrolarea");

test.beforeEach(() => {
    config.gameMode = "lockout";
    actions.length = 0;
});

test.serial("a broken ride: mechanics in other regions without a patrol area are shielded", (t) => {
    rides = [ride(100, 10, BROKEN)]; // blue's region (top-right)
    staff = [mechanic(1, 60, 10), mechanic(2, 110, 10), mechanic(3, 10, 100, 16)];
    routeMechanics();

    t.deepEqual(patrolActions().map((action) => action.args.id), [1], "only red's unrestricted mechanic");
    t.deepEqual(patrolActions()[0].args, { id: 1, x1: 32, y1: 32, x2: 64 * 32, y2: 64 * 32, mode: 0 }, "his own region");
    routeMechanics();
    t.is(patrolActions().length, 1, "not again while shielded");
});

test.serial("nothing happens while no ride needs a mechanic", (t) => {
    rides = [ride(100, 10, 0)];
    staff = [mechanic(4, 60, 10)];
    routeMechanics();
    t.is(patrolActions().length, 0);
});

test.serial("inspections count too", (t) => {
    rides = [ride(10, 100, DUE_INSPECTION)]; // green
    staff = [mechanic(5, 100, 100)];
    routeMechanics();
    t.deepEqual(patrolActions().map((action) => action.args.id), [5]);
});

test.serial("the temporary area goes after a quiet while, unless the player changed it", (t) => {
    rides = [ride(100, 10, BROKEN)];
    staff = [mechanic(6, 60, 10), mechanic(7, 50, 50)];
    routeMechanics();
    t.is(patrolActions().length, 2);

    rides = [ride(100, 10, 0)];
    staff[1].patrolArea.tiles = staff[1].patrolArea.tiles.slice(0, 100); // the player made 7's area smaller
    now += 2 * 60_000 + 1;
    actions.length = 0;
    routeMechanics();
    t.deepEqual(patrolActions().map((action) => [action.args.id, action.args.mode]), [[6, 2]], "6 cleared, 7 kept");
    t.is(staff[0].patrolArea.tiles.length, 0);
});

test.serial("coop: mechanics are left alone", (t) => {
    config.gameMode = "coop";
    rides = [ride(100, 10, BROKEN)];
    staff = [mechanic(8, 60, 10)];
    routeMechanics();
    t.is(patrolActions().length, 0);
});
