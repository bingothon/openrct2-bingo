/// <reference path="../../lib/openrct2.d.ts" />

import test from "ava";
import Mock from "openrct2-mocks";
import { createParkStorage } from "../_mocks";

const parkStorage = createParkStorage();
const g = globalThis as any;
const actions: { [name: string]: { query: (e: any) => GameActionResult; execute: (e: any) => GameActionResult } } = {};
g.context = Mock.context({
    getTypeIdForAction: () => 80,
    getParkStorage: (() => parkStorage) as any,
    registerAction: ((name: string, query: any, execute: any) => { actions[name] = { query, execute }; }) as any,
    executeAction: (() => {}) as any,
});
// The bingosync module opens a socket when it loads
const socket: any = { on: () => socket, connect: () => socket, write: () => true, end: () => socket, destroy: () => socket, setNoDelay: () => socket };
g.network = {
    mode: "server",
    sendMessage: () => {},
    getPlayer: (id: number) => ({ id, name: `p${id}`, publicKeyHash: `h${id}` }),
    createSocket: () => socket,
};
g.map = Mock.map({ entities: [] });

const { registerActions } = await import("../../src/actions/registerActions");
registerActions();

// Callers wrap custom action data in { args } (see registerActions.ts)
const run = (player: number, name: string, args: object) => actions[name].query({ player, action: name, args: { args } });
const allowed = (result: GameActionResult) => !result.error;

test.beforeEach(() => {
    parkStorage.data = {};
});

test("players can't run server-only custom actions", (t) => {
    for (const name of ["setGoalCompletion", "setCash", "addCash", "clearAllTiles", "clearAllRides", "updateScore", "createScoreboard", "clearScoreboard"]) {
        t.false(allowed(run(3, name, {})), name);
    }
});

test("the server can run them", (t) => {
    t.true(allowed(run(0, "setGoalCompletion", { goalKey: "goal_1", completed: true })));
    t.true(allowed(run(0, "setStorage", { key: "anything", value: 1 })));
});

test("players can store the game setup choices, but only before the game starts", (t) => {
    t.true(allowed(run(3, "setStorage", { key: "gameMode", value: "lockout" })));
    t.true(allowed(run(3, "setStorage", { key: "started", value: true })));
    t.false(allowed(run(3, "setStorage", { key: "goal_1", value: true })), "not a setup key");

    parkStorage.data.started = true;
    t.false(allowed(run(3, "setStorage", { key: "gameMode", value: "coop" })), "game already started");
    t.false(allowed(run(3, "setStorage", { key: "gameOver", value: true })));
});

test("players can register themselves", (t) => {
    parkStorage.data.gameMode = "lockout";
    t.true(allowed(run(3, "registerPlayer", { colour: "red" })));
});
