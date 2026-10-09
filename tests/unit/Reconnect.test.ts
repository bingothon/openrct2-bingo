import test from "ava";
import { createParkStorage } from "../_mocks";

const parkStorage = createParkStorage();
(globalThis as any).context = { getParkStorage: () => parkStorage };

const { PlayerManager } = await import("../../src/managers/PlayerManager");

test.beforeEach(() => {
    parkStorage.data = {};
});

test.serial("a reconnecting player keeps their registration under the new id", (t) => {
    const players = new PlayerManager();
    players.registerPlayer("1", "Player 1", "red", "top-left", "key:alice");

    t.is(players.reconnectPlayer("5", "key:alice"), "1");
    t.is(players.getPlayerRegion("5"), "top-left");
    t.is(players.getPlayer("1"), null);

    // Survives a server restart: the stored registration has the new id too
    const afterRestart = new PlayerManager();
    t.is(afterRestart.getPlayerRegion("5"), "top-left");
});

test.serial("someone who gets a registered player's old id doesn't inherit their region", (t) => {
    const players = new PlayerManager();
    players.registerPlayer("1", "Player 1", "red", "top-left", "key:alice");

    // After a server restart, a stranger joins first and gets id 1
    t.is(players.reconnectPlayer("1", "key:mallory"), null);
    t.is(players.getPlayerRegion("1"), null, "the stranger is not red");

    // Alice joins later with id 2 and gets red back
    t.is(players.reconnectPlayer("2", "key:alice"), "offline:key:alice");
    t.is(players.getPlayerRegion("2"), "top-left");
});

test.serial("joining with the same id or as an unregistered player changes nothing", (t) => {
    const players = new PlayerManager();
    players.registerPlayer("1", "Player 1", "red", "top-left", "key:alice");

    t.is(players.reconnectPlayer("1", "key:alice"), null);
    t.is(players.reconnectPlayer("3", "key:bob"), null);
    t.is(players.getAllPlayers().length, 1);
    t.is(players.getPlayerRegion("1"), "top-left");
});
