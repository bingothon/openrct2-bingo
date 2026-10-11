/// <reference path="../../lib/openrct2.d.ts" />

import test from "ava";
import { createParkStorage } from "../_mocks";

const parkStorage = createParkStorage();
const g = globalThis as any;
g.date = { monthsElapsed: 0, year: 1 };
g.context = { getParkStorage: () => parkStorage };
g.network = { mode: "server" };

const { goals } = await import("../../src/bingo/goals");
const { goalsForMode } = await import("../../src/ui/helpers/configureBoard");
const { buildRegionScopes } = await import("../../src/bingo/goalScopes");
const { GroundDivisionManager } = await import("../../src/managers/GroundDivisionManager");

// Tile -> world coordinates (tile centre)
const at = (tileX: number, tileY: number) => ({ x: tileX * 32 + 16, y: tileY * 32 + 16, z: 112 });

function mockRide(tileX: number, tileY: number, props: Partial<Ride> = {}): Ride {
    return {
        classification: "ride",
        type: 1,
        object: { index: 1 },
        stations: [{ start: at(tileX, tileY) }],
        totalProfit: 0,
        totalCustomers: 0,
        excitement: 0,
        intensity: 0,
        nausea: 0,
        ...props,
    } as unknown as Ride;
}

function mockGuest(tileX: number, tileY: number, items: string[] = []): Guest {
    return {
        ...at(tileX, tileY),
        isInPark: true,
        umbrellaColour: 0,
        thoughts: [],
        hasItem: (item: { type: string }) => items.indexOf(item.type) !== -1,
    } as unknown as Guest;
}

function setMap(rides: Ride[], guests: Guest[], litter: { x: number; y: number }[] = []) {
    g.map = {
        size: { x: 130, y: 130 },
        rides,
        getAllEntities: (type: string) => (type === "guest" ? guests : type === "litter" ? litter : []),
    };
}

function createGround() {
    setMap([], []);
    const ground = new GroundDivisionManager();
    return ground;
}

test("coop keeps all original goals and has enough for varied boards", (t) => {
    const coop = goalsForMode(goals(1234), "coop");
    const names = coop.map((goal) => goal.name);
    for (const original of ["Park Rating 900+", "A millie (1000000+ cash)", "Get 100 guests in the park", "Create 25 unique stalls"]) {
        t.true(names.indexOf(original) !== -1, `${original} is still in coop`);
    }
    t.true(coop.length >= 35, `coop pool has ${coop.length} goals`);
    t.false(coop.some((goal) => goal.playerOnly));
});

test("PvP/Lockout only offer goals that can be checked per player", (t) => {
    for (const mode of ["pvp", "lockout"] as const) {
        const pool = goalsForMode(goals(1234), mode);
        t.true(pool.length >= 30, `${mode} pool should allow varied 5x5 boards, has ${pool.length}`);
        t.true(pool.every((goal) => typeof goal.checkPlayer === "function"));
        t.false(pool.some((goal) => goal.name.indexOf("Park Rating") !== -1), "park-wide goals stay coop-only");
        t.true(pool.some((goal) => goal.name === "Hat trick (25 guests wearing hats in your region)"), "PvP names are used");
        t.false(pool.some((goal) => goal.name.indexOf("guests in the park") !== -1), "guest count goals are coop-only");
    }
});

test("rides, guests and litter are attributed to the region they are in", (t) => {
    const ground = createGround();
    setMap(
        [mockRide(10, 10), mockRide(100, 10), mockRide(100, 100)],
        [mockGuest(10, 10), mockGuest(10, 20), mockGuest(100, 100), { ...mockGuest(5, 5), isInPark: false } as Guest],
        [at(10, 100), at(10, 110)],
    );

    const scopes = buildRegionScopes(ground);
    t.is(scopes["top-left"].rides.length, 1);
    t.is(scopes["top-right"].rides.length, 1);
    t.is(scopes["bottom-right"].rides.length, 1);
    t.is(scopes["bottom-left"].rides.length, 0);
    t.is(scopes["top-left"].guests.length, 2, "guests outside the park are ignored");
    t.is(scopes["bottom-right"].guests.length, 1);
    t.is(scopes["bottom-left"].litterCount, 2);
});

test("a player's goal only counts their own region", (t) => {
    const ground = createGround();
    const guests: Guest[] = [];
    for (let i = 0; i < 100; i++) guests.push(mockGuest(10, 10, i < 25 ? ["hat"] : []));
    setMap([mockRide(100, 10, { totalProfit: 20_000 })], guests);

    const scopes = buildRegionScopes(ground);
    const pool = goalsForMode(goals(1234), "pvp");
    const byName = (name: string) => pool.filter((goal) => goal.name === name)[0];

    const hats = byName("Hat trick (25 guests wearing hats in your region)");
    t.true(hats.checkPlayer!(scopes["top-left"]));
    t.false(hats.checkPlayer!(scopes["bottom-left"]));

    const profit = byName("Ride with >$1000 profit");
    t.true(profit.checkPlayer!(scopes["top-right"]));
    t.false(profit.checkPlayer!(scopes["top-left"]));
});

test("shared goals check the whole park in coop and the region in PvP", (t) => {
    const ground = createGround();
    // 30 hats split over two regions: 30 in the park, 15 per region
    const guests: Guest[] = [];
    for (let i = 0; i < 15; i++) guests.push(mockGuest(10, 10, ["hat"]), mockGuest(100, 10, ["hat"]));
    setMap([], guests);
    g.date.ticksElapsed = 1;

    const hatsCoop = goalsForMode(goals(1234), "coop").filter((goal) => goal.name === "Hat trick (25 guests wearing hats)")[0];
    t.true(hatsCoop.checkCondition(), "coop counts the whole park");

    const scopes = buildRegionScopes(ground);
    const hatsPvp = goalsForMode(goals(1234), "pvp").filter((goal) => goal.name === "Hat trick (25 guests wearing hats in your region)")[0];
    t.false(hatsPvp.checkPlayer!(scopes["top-left"]), "PvP only counts the player's region");
});

test("every PvP/Lockout goal reports progress for the player's region", (t) => {
    const missing = goalsForMode(goals(1234), "lockout").filter((goal) => !goal.playerProgress).map((goal) => goal.name);
    t.deepEqual(missing, []);
});

test("goal progress counts the player's region, not the whole park", (t) => {
    const ground = createGround();
    const guests: Guest[] = [];
    for (let i = 0; i < 40; i++) guests.push(mockGuest(10, 10, ["hat"]));
    for (let i = 0; i < 60; i++) guests.push(mockGuest(100, 100, ["hat"]));
    setMap([], guests);

    const scopes = buildRegionScopes(ground);
    const goal = goalsForMode(goals(1234), "lockout").filter((g) => g.name === "Hat trick (25 guests wearing hats in your region)")[0];
    t.is(goal.playerProgress!(scopes["top-left"]), 40);
    t.is(goal.playerProgress!(scopes["bottom-right"]), 60);
});

test("a rebuilt board shows who completed each goal", async (t) => {
    const { configureBoard } = await import("../../src/ui/helpers/configureBoard");
    parkStorage.data = { gameMode: "lockout", goal_1: true, goal_1_colors: '["green"]', goal_2: true, goal_2_colors: '["red","blue"]' };
    const board = configureBoard(1234, false, "lockout");
    t.is(board[0].status, "completed");
    t.is(board[0].colors, "green", "not the default red");
    t.deepEqual(board[1].completedBy, ["red", "blue"]);
    t.is(board[2].colors, "blank");
    parkStorage.data = {};
});

/** A goal pool whose random parts (category, thought) match, by trying seeds */
function poolWhere(mode: "coop" | "lockout", predicate: (goal: { name: string }) => boolean) {
    for (let seed = 1; seed < 5000; seed++) {
        const pool = goalsForMode(goals(seed), mode);
        const goal = pool.filter(predicate)[0];
        if (goal) return goal;
    }
    throw new Error("no seed found");
}

test("all shop types: the cash machine and first aid room must be built, but can't make profit", (t) => {
    const ground = createGround();
    // Food stall, drink stall, shop, info kiosk, toilets profitable; cash machine and first aid at a loss
    const rides = [28, 30, 32, 35, 36].map((type) => mockRide(10, 10, { type, totalProfit: 100 }));
    const unpaid = [45, 48].map((type) => mockRide(10, 10, { type, totalProfit: -50 }));
    const goal = poolWhere("lockout", (g) => g.name === "Create all rides in the Shop category");

    setMap(rides, []);
    t.false(goal.checkPlayer!(buildRegionScopes(ground)["top-left"]), "cash machine and first aid not built yet");
    setMap(rides.concat(unpaid), []);
    t.true(goal.checkPlayer!(buildRegionScopes(ground)["top-left"]));

    const coop = poolWhere("coop", (g) => g.name === "Create all rides in the Shop category");
    t.true(coop.checkCondition(), "coop uses the same rule");
});

test("White Castle: a burger stall at the highest footpath height counts", (t) => {
    const ground = createGround();
    const stall = (z: number) => mockRide(10, 10, { classification: "stall", type: 28, totalProfit: 10, stations: [{ start: { x: 336, y: 336, z } }] } as never);
    const goal = goalsForMode(goals(1234), "lockout").filter((g) => g.name.indexOf("White Castle") === 0)[0];

    setMap([stall(248 * 8)], []);
    t.true(goal.checkPlayer!(buildRegionScopes(ground)["top-left"]), "248 is the highest a path can reach");
    setMap([stall(247 * 8)], []);
    t.false(goal.checkPlayer!(buildRegionScopes(ground)["top-left"]));
});

test("thought goals only use thoughts guests can have in a normal park", (t) => {
    const names: string[] = [];
    for (let seed = 1; seed < 2000; seed++) {
        const goal = goals(seed).filter((g) => g.name.indexOf("Thought: ") === 0)[0];
        if (names.indexOf(goal.name) === -1) names.push(goal.name);
    }
    t.false(names.some((name) => /Wow!|Double wow|Help!|Running out of time/.test(name)), names.join(" | "));
    t.true(names.some((name) => name.indexOf("Running out of cash") !== -1));
});
