/// <reference path="../../lib/openrct2.d.ts" />

import test from "ava";
import Mock from "openrct2-mocks";
import { createParkStorage } from "../_mocks";

const parkStorage = createParkStorage();
const g = globalThis as any;
g.context = Mock.context({ getTypeIdForAction: () => 80, getParkStorage: (() => parkStorage) as any });
g.map = Mock.map({ entities: [] });
g.network = {
    mode: "server",
    sendMessage: () => {},
    getPlayer: (id: number) => ({ id, name: `player${id}`, publicKeyHash: `hash${id}` }),
};

const { registerPlayerAction } = await import("../../src/actions/all/registerPlayerAction");
const { GameManager } = await import("../../src/managers/GameManager");

const action = registerPlayerAction();
const run = (player: number, colour: string, playerId?: number) => {
    const event = { player, args: { colour, playerId } } as unknown as GameActionEventArgs<{ colour: string; playerId?: number }>;
    const query = action.query(event);
    return query.error ? query : action.execute(event);
};
const regionOf = (id: number) => GameManager.getInstance().getPlayerRegion(id.toString());

test.beforeEach(() => {
    parkStorage.data = { gameMode: "lockout" };
    (GameManager.getInstance().getPlayerManager() as any).players = {};
});

test.serial("a player picks a free colour and gets its region", (t) => {
    t.is(run(3, "green").error, 0);
    t.is(regionOf(3), "bottom-left");
});

test.serial("a taken colour can't be picked", (t) => {
    run(3, "red");
    const result = run(4, "red");
    t.is(result.error, 1);
    t.regex(result.errorMessage as string, /already taken/);
    t.is(regionOf(4), null);
});

test.serial("a player can't register twice", (t) => {
    run(3, "red");
    t.regex(run(3, "blue").errorMessage as string, /already registered/);
});

test.serial("registration only works in PvP/Lockout", (t) => {
    parkStorage.data = { gameMode: "coop" };
    t.is(run(3, "red").error, 1);
});

test.serial("the server registers the chatting player (/register)", (t) => {
    t.is(run(0, "yellow", 5).error, 0);
    t.is(regionOf(5), "bottom-right");
    t.is(regionOf(0), null);
});

test.serial("a client can't register someone else", (t) => {
    t.is(run(3, "yellow", 5).error, 0);
    t.is(regionOf(3), "bottom-right", "registers the client itself");
    t.is(regionOf(5), null);
});
