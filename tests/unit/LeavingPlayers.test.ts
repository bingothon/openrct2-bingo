/// <reference path="../../lib/openrct2.d.ts" />

/*
 * A PvP/Lockout player who leaves keeps their region for 5 minutes; coming back cancels it,
 * otherwise the colour is closed (closeRegion action) and the region cleared.
 */

import test from "ava";
import { createParkStorage } from "../_mocks";

const parkStorage = createParkStorage();
const g = globalThis as any;
const hooks: { [hook: string]: ((e: any) => void)[] } = {};
const timers: { [id: number]: { callback: () => void; delay: number } } = {};
let nextTimer = 1;
const actions: { name: string; args: any }[] = [];
const messages: string[] = [];
let online: { id: number; name: string; publicKeyHash: string }[] = [];
let guests: { x: number; y: number; removed: boolean; remove: () => void }[] = [];
const guestAt = (tileX: number, tileY: number) => {
    const guest = { x: tileX * 32 + 16, y: tileY * 32 + 16, removed: false, remove: () => { guest.removed = true; } };
    return guest;
};

g.date = { monthsElapsed: 0 };
g.map = { rides: [], getAllEntities: (type: string) => (type === "guest" ? guests : []), getTile: () => ({ elements: [] }), size: { x: 130, y: 192 } };
g.objectManager = { load: () => null };
g.network = {
    mode: "server",
    get players() { return online; },
    getPlayer: (id: number) => online.filter((player) => player.id === id)[0] || null,
    sendMessage: (message: string) => messages.push(message),
};
g.context = {
    getParkStorage: () => parkStorage,
    subscribe: (hook: string, callback: (e: any) => void) => {
        (hooks[hook] = hooks[hook] || []).push(callback);
        return { dispose: () => {} };
    },
    setTimeout: (callback: () => void, delay: number) => {
        timers[nextTimer] = { callback, delay };
        return nextTimer++;
    },
    clearTimeout: (id: number) => {
        if (typeof id !== "number") throw new TypeError("Expected number"); // like OpenRCT2
        delete timers[id];
    },
    executeAction: (name: string, args: any, callback?: (result: GameActionResult) => void) => {
        actions.push({ name, args });
        if (name === "setStorage") parkStorage.set(args.args.key, args.args.value);
        if (name === "closeRegion") closeRegionAction().execute({ args: args.args } as never);
        if (name === "reopenRegion") reopenRegionAction().execute({ args: args.args } as never);
        if (name === "removeRegionGuests") removeRegionGuestsAction().execute({ args: args.args } as never);
        if (callback) callback({ error: 0 } as GameActionResult);
    },
};

const { config } = await import("../../src/config");
const { GameManager } = await import("../../src/managers/GameManager");
const { subscribeToLeavingPlayers } = await import("../../src/subscriptions/server/leavingPlayers");
const { isColourClosed } = await import("../../src/bingo/closedRegions");
const { closeRegionAction, reopenRegionAction, removeRegionGuestsAction } = await import("../../src/actions/all/closeRegionAction");
const { registerPlayerAction } = await import("../../src/actions/all/registerPlayerAction");

const fire = (hook: string, e: any) => (hooks[hook] || []).forEach((callback) => callback(e));
const pendingTimers = () => Object.keys(timers).map((id) => timers[Number(id)]);

function setup() {
    for (const key of Object.keys(parkStorage.data)) delete parkStorage.data[key];
    for (const id of Object.keys(timers)) delete timers[Number(id)];
    actions.length = 0;
    messages.length = 0;
    guests = [];
    config.gameMode = "lockout";
    parkStorage.set("gameMode", "lockout");
    online = [{ id: 1, name: "Alice", publicKeyHash: "aaa" }, { id: 2, name: "Bob", publicKeyHash: "bbb" }];
    const gameManager = GameManager.getInstance();
    (gameManager.getPlayerManager() as any).players = {};
    gameManager.registerPlayer("1", "Alice", "red", "top-left", "key:aaa");
    gameManager.registerPlayer("2", "Bob", "blue", "top-right", "key:bbb");
}

subscribeToLeavingPlayers();

test.serial("a player who leaves keeps their region for 5 minutes", (t) => {
    setup();
    online = online.filter((player) => player.id !== 1);
    fire("network.leave", { player: 1 });

    t.is(pendingTimers().length, 1);
    t.is(pendingTimers()[0].delay, 5 * 60_000);
    t.true(messages.some((message) => /RED left - their region stays for 5 minutes/.test(message)));
    t.false(isColourClosed("red"));
});

test.serial("coming back within 5 minutes keeps the region", (t) => {
    setup();
    online = online.filter((player) => player.id !== 1);
    fire("network.leave", { player: 1 });

    online.push({ id: 7, name: "Alice", publicKeyHash: "aaa" }); // a new network id
    fire("network.join", { player: 7 });
    t.is(pendingTimers().length, 0, "the close is cancelled");
    t.true(messages.some((message) => /RED is back/.test(message)));
    t.false(actions.some((action) => action.name === "closeRegion"));
});

test.serial("not back after 5 minutes: the region is cleared and free again", (t) => {
    setup();
    parkStorage.set("budgetSpent", { red: 1_000_000, blue: 500 });
    guests = [guestAt(10, 10), guestAt(20, 40), guestAt(100, 10)]; // two in red's region, one in blue's
    online = online.filter((player) => player.id !== 1);
    fire("network.leave", { player: 1 });
    pendingTimers()[0].callback();

    t.deepEqual(GameManager.getInstance().getAllPlayers().map((player) => player.colour), ["blue"]);
    t.deepEqual(guests.map((guest) => guest.removed), [true, true, false], "only the guests in red's region");
    t.deepEqual(parkStorage.get("budgetSpent", {}), { blue: 500 }, "a new red player gets the full budget");
    t.false(isColourClosed("red"), "free again once cleared");
    const names = actions.map((action) => action.name);
    for (const name of ["closeRegion", "removeRegionGuests", "reopenRegion"]) t.true(names.indexOf(name) !== -1, name);
    t.true(names.indexOf("removeRegionGuests") > names.indexOf("closeRegion"));
    t.true(messages.some((message) => /RED is free again/.test(message)));
});

test.serial("while the region is being cleared the colour can't be picked, afterwards it can", (t) => {
    setup();
    closeRegionAction().execute({ args: { colour: "red" } } as never);
    online.push({ id: 9, name: "Carol", publicKeyHash: "ccc" });

    const during = registerPlayerAction().query({ args: { colour: "red" }, player: 9 } as never);
    t.is(during.error, 1);
    t.regex(during.errorMessage, /being cleared/);

    reopenRegionAction().execute({ args: { colour: "red" } } as never);
    t.is(registerPlayerAction().query({ args: { colour: "red" }, player: 9 } as never).error, 0);
});

test.serial("leaving in coop or after the game ended does nothing", (t) => {
    setup();
    config.gameMode = "coop";
    fire("network.leave", { player: 1 });
    t.is(pendingTimers().length, 0);

    setup();
    parkStorage.set("gameOver", true);
    fire("network.leave", { player: 1 });
    t.is(pendingTimers().length, 0);
});
