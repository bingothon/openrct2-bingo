/// <reference path="../../lib/openrct2.d.ts" />

/*
 * PvP/Lockout: hired staff patrol their player's region. Without a patrol area OpenRCT2 calls the
 * mechanic closest in a straight line, also one in another region who can't reach the ride.
 */

import test from "ava";
import { createParkStorage } from "../_mocks";

const parkStorage = createParkStorage();
const g = globalThis as any;
const hooks: ((e: any) => void)[] = [];
const actions: { name: string; args: any }[] = [];
const messages: { message: string; to?: number[] }[] = [];
let staff: any = null;

g.network = { mode: "server", sendMessage: (message: string, to?: number[]) => messages.push({ message, to }), getPlayer: () => null, players: [] };
g.map = { getEntity: () => staff, getTile: () => ({ elements: [] }), rides: [], getAllEntities: () => [] };
g.context = {
    getParkStorage: () => parkStorage,
    subscribe: (_hook: string, callback: (e: any) => void) => {
        hooks.push(callback);
        return { dispose: () => {} };
    },
    executeAction: (name: string, args: any, callback?: (result: GameActionResult) => void) => {
        actions.push({ name, args });
        if (callback) callback({ error: 0 } as GameActionResult);
    },
};

const { GameManager } = await import("../../src/managers/GameManager");
const { subscribeToStaffNaming } = await import("../../src/subscriptions/server/staffNaming");

parkStorage.set("gameMode", "lockout");
GameManager.getInstance().registerPlayer("3", "Alice", "blue", "top-right", "key:aaa");
subscribeToStaffNaming();
const fire = (e: any) => hooks.forEach((callback) => callback(e));

test.serial("a hired mechanic patrols the hiring player's whole region", (t) => {
    actions.length = 0;
    staff = { id: 42, name: "Mechanic 1", type: "staff", x: 100 * 32, y: 10 * 32, patrolArea: { tiles: [] } };
    fire({ action: "staffhire", player: 3, args: {}, result: { error: 0, peep: 42 } });

    const patrol = actions.filter((action) => action.name === "staffsetpatrolarea")[0];
    t.truthy(patrol);
    t.deepEqual(patrol.args, { id: 42, x1: 65 * 32, y1: 1 * 32, x2: 128 * 32, y2: 64 * 32, mode: 0 }, "blue's region");
});

test.serial("clearing the patrol area puts the region back", (t) => {
    actions.length = 0;
    messages.length = 0;
    staff = { id: 42, name: "Blue Mechanic 1", type: "staff", patrolArea: { tiles: [] } };
    fire({ action: "staffsetpatrolarea", player: 3, args: { id: 42, mode: 2 }, result: { error: 0 } });

    t.true(actions.some((action) => action.name === "staffsetpatrolarea" && action.args.mode === 0));
    t.deepEqual(messages[0].to, [3]);
});

test.serial("a smaller patrol area inside the region is kept", (t) => {
    actions.length = 0;
    staff = { id: 42, name: "Blue Mechanic 1", type: "staff", patrolArea: { tiles: [{ x: 70 * 32, y: 10 * 32 }] } };
    fire({ action: "staffsetpatrolarea", player: 3, args: { id: 42, mode: 1 }, result: { error: 0 } });
    t.is(actions.length, 0);
});
