/// <reference path="../../lib/openrct2.d.ts" />

import test from "ava";
import Mock from "openrct2-mocks";
import { createParkStorage } from "../_mocks";

const parkStorage = createParkStorage();
const g = globalThis as any;
let queryHook: ((e: any) => void) | null = null;
let setupLockHook: ((e: any) => void) | null = null;
const executeHooks: ((e: any) => void)[] = [];
g.context = Mock.context({
    getTypeIdForAction: () => 80,
    getParkStorage: (() => parkStorage) as any,
    subscribe: ((hook: string, callback: (e: any) => void) => {
        if (hook === "action.query") {
            if (queryHook) setupLockHook = callback;
            else queryHook = callback;
        }
        if (hook === "action.execute") executeHooks.push(callback);
        return { dispose: () => {} };
    }) as any,
});
g.network = { mode: "server", getPlayer: (id: number) => ({ id, name: `p${id}`, publicKeyHash: `h${id}` }) };

// Ride 1 in red's region (top-left), ride 2 in blue's (top-right), ride 3 without a station yet
const rides: { [id: number]: unknown } = {
    1: { id: 1, stations: [{ start: { x: 10 * 32, y: 10 * 32, z: 112 } }] },
    2: { id: 2, stations: [{ start: { x: 100 * 32, y: 10 * 32, z: 112 } }] },
    3: { id: 3, stations: [] },
};
// Staff 10 hired by red, 11 by blue, 12 unowned; guest 20 in red's region, 21 in blue's
const entities: { [id: number]: unknown } = {
    10: { id: 10, type: "staff", name: "Red Handyman 1", x: 10 * 32, y: 10 * 32 },
    11: { id: 11, type: "staff", name: "Blue Mechanic 1", x: 100 * 32, y: 10 * 32 },
    12: { id: 12, type: "staff", name: "Handyman 2", x: 10 * 32, y: 10 * 32 },
    20: { id: 20, type: "guest", name: "Guest 1", x: 10 * 32, y: 10 * 32 },
    21: { id: 21, type: "guest", name: "Guest 2", x: 100 * 32, y: 10 * 32 },
};
g.map = {
    size: { x: 130, y: 130 },
    rides: [],
    getAllEntities: () => [],
    getRide: (id: number) => rides[id] || null,
    getEntity: (id: number) => entities[id] || null,
};

const { subscribeToBuildingRestrictions, subscribeToSetupLock } = await import("../../src/subscriptions/game/buildingRestrictions");
const { subscribeToBannerRegions } = await import("../../src/bingo/bannerRegions");
const { GameManager } = await import("../../src/managers/GameManager");
const { GroundDivisionManager } = await import("../../src/managers/GroundDivisionManager");
const { PlayerManager } = await import("../../src/managers/PlayerManager");

const players = new PlayerManager();
players.registerPlayer("3", "Player 1", "red", "top-left", "h3");
subscribeToBuildingRestrictions(new GroundDivisionManager(), players);
subscribeToBannerRegions(new GroundDivisionManager());
subscribeToSetupLock();
parkStorage.data.gameMode = "lockout";

function query(player: number, action: string, args: object, cost = 0): boolean {
    const event: any = { player, action, args, result: { cost } };
    queryHook!(event);
    return !event.result.error; // allowed?
}

test("a player can open/close and edit rides in their own region", (t) => {
    t.true(query(3, "ridesetstatus", { ride: 1, status: 1 }));
    t.true(query(3, "ridesetprice", { ride: 1, price: 50 }));
});

test("a player can't touch rides in someone else's region", (t) => {
    for (const action of ["ridesetstatus", "ridedemolish", "ridesetname", "ridesetprice", "ridesetsetting"]) {
        t.false(query(3, action, { ride: 2 }), action);
    }
});

test("rides without a station yet aren't anyone's", (t) => {
    t.true(query(3, "ridesetname", { ride: 3, name: "New ride" }));
});

test("only the server changes park-wide settings", (t) => {
    t.false(query(3, "parksetparameter", { parameter: 0, value: 0 }), "player can't close the park");
    t.false(query(3, "parksetloan", { value: 0 }));
    t.true(query(0, "parksetparameter", { parameter: 0, value: 0 }), "server can");
});

const red = { x: 10 * 32, y: 10 * 32 };
const blue = { x: 100 * 32, y: 10 * 32 };

test("only the player that hired a staff member can manage them", (t) => {
    t.true(query(3, "staffsetorders", { id: 10, staffOrders: 1 }), "own staff");
    t.false(query(3, "stafffire", { id: 11 }), "blue's staff");
    t.false(query(3, "staffsetorders", { id: 11, staffOrders: 1 }));
    t.true(query(3, "stafffire", { id: 12 }), "unowned staff");
});

test("renaming own staff must keep the colour prefix", (t) => {
    t.true(query(3, "staffsetname", { id: 10, name: "Red Sweeper" }));
    t.false(query(3, "staffsetname", { id: 10, name: "Sweeper" }));
});

test("patrol areas must be in the player's own region", (t) => {
    t.true(query(3, "staffsetpatrolarea", { id: 10, mode: 0, x1: red.x, y1: red.y, x2: red.x + 64, y2: red.y + 64 }));
    t.false(query(3, "staffsetpatrolarea", { id: 10, mode: 0, x1: blue.x, y1: blue.y, x2: blue.x, y2: blue.y }));
});

test("guests in another region can't be picked up or edited", (t) => {
    t.true(query(3, "peeppickup", { type: 0, id: 20 }), "own guest");
    t.false(query(3, "peeppickup", { type: 0, id: 21 }), "blue's guest");
    t.false(query(3, "guestsetname", { peep: 21, name: "Mine now" }));
    t.false(query(3, "peeppickup", { type: 0, id: 11 }), "blue's staff");
});

test("people can only be dropped in the player's own region", (t) => {
    t.true(query(3, "peeppickup", { type: 2, id: 10, ...red, z: 112 }));
    t.false(query(3, "peeppickup", { type: 2, id: 10, ...blue, z: 112 }));
});

test("marketing: only campaigns for the player's own rides", (t) => {
    t.true(query(3, "parkmarketing", { type: 5, item: 1, numweeks: 2 }), "advertise own ride");
    t.false(query(3, "parkmarketing", { type: 1, item: 2, numweeks: 2 }), "free rides on blue's ride");
    t.false(query(3, "parkmarketing", { type: 0, item: 0, numweeks: 2 }), "free park entry is park-wide");
});

test("terraforming: the whole selected area must be in the player's region", (t) => {
    const area = (x1: number, y1: number, x2: number, y2: number) => ({ x: x1 * 32, y: y1 * 32, x1: x1 * 32, y1: y1 * 32, x2: x2 * 32, y2: y2 * 32 });
    t.true(query(3, "landraise", area(10, 10, 20, 20)), "inside red's region");
    t.false(query(3, "landraise", area(60, 10, 70, 20)), "reaches into blue's region");
    t.false(query(3, "landlower", area(100, 10, 110, 20)), "blue's region");
    t.false(query(3, "landsmooth", area(30, 60, 40, 70)), "reaches into green's region");
    t.false(query(3, "clearscenery", { x1: 60 * 32, y1: 10 * 32, x2: 70 * 32, y2: 20 * 32, itemsToClear: 7 }), "clearing has no x/y, only an area");
    t.true(query(0, "landraise", area(60, 10, 70, 20)), "server can");
});

test("pausing and game speed are server-only", (t) => {
    t.false(query(3, "pausetoggle", {}));
    t.false(query(3, "gamesetspeed", { speed: 4 }));
    t.true(query(0, "pausetoggle", {}));
});

test("signs and banners can only be changed in the player's own region", (t) => {
    // A banner placed in blue's region and one in red's region get recorded on placement
    executeHooks.forEach((hook) => hook({ player: 0, action: "bannerplace", args: { x: 100 * 32, y: 10 * 32 }, result: { bannerIndex: 7 } }));
    executeHooks.forEach((hook) => hook({ player: 0, action: "wallplace", args: { x: 10 * 32, y: 10 * 32 }, result: { bannerIndex: 8 } }));
    t.false(query(3, "bannersetname", { id: 7, name: "Mine" }), "blue's banner");
    t.false(query(3, "signsetstyle", { id: 7, mainColour: 1 }));
    t.true(query(3, "signsetname", { id: 8, name: "Red's sign" }), "own sign");
    t.true(query(3, "bannersetname", { id: 99, name: "Old banner" }), "banners from before belong to nobody");
});

test("players can't spend more than their budget", (t) => {
    // Each player starts with $250,000 (2,500,000 tenths), nothing spent yet
    parkStorage.data.budgetSpent = {};
    t.true(query(3, "trackplace", { ...red, z: 112 }, 2_000_000), "fits in the budget");
    t.false(query(3, "trackplace", { ...red, z: 112 }, 3_000_000), "more than $250,000");

    parkStorage.data.budgetSpent = { red: 2_400_000 };
    t.false(query(3, "smallsceneryplace", { ...red, z: 112 }, 200_000), "only $10,000 left");
    t.true(query(3, "smallsceneryplace", { ...red, z: 112 }, 50_000));
    t.true(query(0, "smallsceneryplace", { ...red, z: 112 }, 99_999_999), "the server has no budget");
    parkStorage.data.budgetSpent = {};
});

test("players wait while the game is being set up", (t) => {
    const lock = (player: number, action: string) => {
        const event: any = { player, action, args: {}, result: {} };
        setupLockHook!(event);
        return !event.result.error;
    };
    const gameManager = GameManager.getInstance();
    gameManager.setInitializing(true);
    t.false(lock(3, "trackplace"));
    t.true(lock(3, "registerPlayer"), "picking a colour is fine");
    t.true(lock(0, "trackplace"), "the server sets up the game");
    gameManager.setInitializing(false);
    t.true(lock(3, "trackplace"));
});
