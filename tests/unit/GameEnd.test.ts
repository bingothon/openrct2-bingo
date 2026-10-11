/// <reference path="../../lib/openrct2.d.ts" />

/*
 * Lockout/PvP game flow through the real GoalManager: goals claimed by players, goals not changing
 * hands in lockout, the clinch at 13, the clock (starts with the first player) and the timer end.
 * Goals are fakes whose checkPlayer result the test controls per region.
 */

import test from "ava";
import { createParkStorage } from "../_mocks";

const parkStorage = createParkStorage();
const messages: string[] = [];
const g = globalThis as any;
g.date = { monthsElapsed: 0, year: 1, month: 0, day: 1 };
g.network = { mode: "server", sendMessage: (message: string) => messages.push(message), players: [] };
g.map = { rides: [], getAllEntities: () => [], size: { x: 130, y: 192 } };
g.objectManager = { load: () => null };
g.context = {
    getParkStorage: () => parkStorage,
    executeAction: (name: string, args: any, callback?: (result: GameActionResult) => void) => {
        if (name === "setStorage") parkStorage.set(args.args.key, args.args.value);
        if (name === "resetDate") g.date.monthsElapsed = 0;
        if (callback) callback({ error: 0 } as GameActionResult);
    },
    subscribe: () => ({ dispose: () => {} }),
    setTimeout: () => 0,
};

const { config } = await import("../../src/config");
const { GameManager } = await import("../../src/managers/GameManager");
const { GoalManager } = await import("../../src/managers/GoalManager");
type BingoBoard = import("../../src/types").BingoBoard;

/** regions[slot] = regions that currently meet that goal */
function createBoard(regions: { [slot: number]: string[] }): BingoBoard {
    const board = [] as unknown as BingoBoard;
    for (let slot = 1; slot <= 25; slot++) {
        board.push({
            name: `Goal ${slot}`,
            slot,
            status: "incomplete",
            colors: "blank",
            checkCondition: () => false,
            checkPlayer: (scope: { region: string }) => (regions[slot] || []).indexOf(scope.region) !== -1,
        } as never);
    }
    return board;
}

function setup(mode: "pvp" | "lockout", players: { colour: string; region: string }[]) {
    for (const key of Object.keys(parkStorage.data)) delete parkStorage.data[key];
    messages.length = 0;
    g.date.monthsElapsed = 0;
    config.gameMode = mode;
    parkStorage.set("duration", 4);
    parkStorage.set("timerStartMonth", -1);

    const gameManager = GameManager.getInstance();
    const playerManager = gameManager.getPlayerManager() as any;
    playerManager.players = {};
    players.forEach((player, index) => {
        gameManager.registerPlayer(String(index + 1), `P${index + 1}`, player.colour, player.region as never);
    });

    const regions: { [slot: number]: string[] } = {};
    const board = createBoard(regions);
    const goalManager = new GoalManager(gameManager.getGroundDivisionManager(), gameManager.getPlayerManager()) as any;
    goalManager.initializeGoalChecking(board);
    return { board, regions, goalManager, check: () => goalManager.checkAllGoals(), day: () => goalManager.checkTimer() };
}

const RED = { colour: "red", region: "top-left" };
const BLUE = { colour: "blue", region: "top-right" };

test.serial("lockout: a claimed goal stays with the first player", (t) => {
    const { board, regions, check } = setup("lockout", [RED, BLUE]);

    regions[1] = ["top-left"];
    check();
    t.deepEqual(board[0].completedBy, ["red"]);

    // Blue meets the same goal later: it stays red's
    regions[1] = ["top-left", "top-right"];
    check();
    t.deepEqual(board[0].completedBy, ["red"]);
    t.deepEqual(JSON.parse(parkStorage.get("goal_1_colors", "[]")), ["red"]);
});

test.serial("lockout: both players meeting a goal at once - only one takes it", (t) => {
    const { board, regions, check } = setup("lockout", [RED, BLUE]);
    regions[2] = ["top-left", "top-right"];
    check();
    t.is(board[1].completedBy!.length, 1);
});

test.serial("pvp: every player can complete every goal", (t) => {
    const { board, regions, check } = setup("pvp", [RED, BLUE]);
    regions[1] = ["top-left", "top-right"];
    check();
    t.deepEqual(board[0].completedBy!.slice().sort(), ["blue", "red"]);
});

test.serial("lockout ends at 13 goals (clinch), not at 12", (t) => {
    const { regions, check, goalManager } = setup("lockout", [RED, BLUE]);
    for (let slot = 1; slot <= 12; slot++) regions[slot] = ["top-left"];
    check();
    t.false(goalManager.gameOver, "12 goals: blue could still reach 13");

    regions[13] = ["top-left"];
    check();
    t.true(goalManager.gameOver);
    t.true(parkStorage.get("gameOver", false));
    t.regex(parkStorage.get("gameResult", ""), /RED wins with 13 goals/);
    t.is(parkStorage.get("finalScores", ""), "RED 13, BLUE 0");

    // No more goals after the end
    regions[20] = ["top-right"];
    check();
    t.deepEqual(goalManager.board[19].completedBy, undefined);
});

test.serial("pvp ends at the first full line", (t) => {
    const { regions, check, goalManager } = setup("pvp", [RED, BLUE]);
    for (const slot of [6, 7, 8, 9]) regions[slot] = ["top-right"];
    check();
    t.false(goalManager.gameOver);
    regions[10] = ["top-right"];
    check();
    t.true(goalManager.gameOver);
    t.regex(parkStorage.get("gameResult", ""), /BLUE wins with a full line/);
});

test.serial("the clock starts with the first player, the timer ends the game after the duration", (t) => {
    const { regions, check, day, goalManager } = setup("lockout", []);

    // No players: the park runs, but the clock doesn't
    g.date.monthsElapsed = 20;
    day();
    t.is(parkStorage.get("timerStartMonth", -1), -1);

    // First player: the clock starts now, and the date goes back to year 1
    GameManager.getInstance().registerPlayer("1", "P1", "red", "top-left");
    GameManager.getInstance().registerPlayer("2", "P2", "blue", "top-right");
    day();
    t.is(g.date.monthsElapsed, 0, "the waiting time doesn't count");
    t.is(parkStorage.get("timerStartMonth", -1), 0);
    t.true(messages.some((message) => /clock is running: 4 years/.test(message)));

    regions[1] = ["top-left"];
    regions[2] = ["top-left"];
    regions[3] = ["top-right"];
    check();

    // 3 years 7 months in: still running, a year was announced
    g.date.monthsElapsed = 8 * 3 + 7;
    day();
    t.false(goalManager.gameOver);

    // 4 years after the start: time's up, the most goals wins
    g.date.monthsElapsed = 8 * 4;
    day();
    t.true(goalManager.gameOver);
    t.regex(parkStorage.get("gameResult", ""), /Time's up! RED wins with 2 goals/);
    t.is(parkStorage.get("finalScores", ""), "RED 2, BLUE 1");
});

test.serial("time's up with equal goals is a draw", (t) => {
    const { regions, check, day } = setup("lockout", [RED, BLUE]);
    day(); // starts the clock at month 0
    regions[1] = ["top-left"];
    regions[2] = ["top-right"];
    check();
    g.date.monthsElapsed = 8 * 4;
    day();
    t.regex(parkStorage.get("gameResult", ""), /draw between RED and BLUE with 1 goals each/);
});

test.serial("a player who left: their lockout goals are open again, others can take them", (t) => {
    const { board, regions, check, goalManager } = setup("lockout", [RED, BLUE]);
    regions[1] = ["top-left"];
    regions[2] = ["top-left"];
    regions[3] = ["top-right"];
    check();
    t.deepEqual(board[0].completedBy, ["red"]);

    goalManager.onColourClosed("red");
    t.deepEqual(board[0].completedBy, []);
    t.is(board[0].status, "incomplete");
    t.is(parkStorage.get("goal_1_colors", ""), "[]");
    t.deepEqual(board[2].completedBy, ["blue"], "other players' goals stay");

    // Blue meets goal 1 now: it's blue's
    regions[1] = ["top-right"];
    check();
    t.deepEqual(board[0].completedBy, ["blue"]);
});
