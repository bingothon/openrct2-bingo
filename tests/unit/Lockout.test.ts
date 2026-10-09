import test from "ava";
import { countClaims, getClinchWinner, getLeaders, hasBingo } from "../../src/bingo/lockout";
import type { BingoBoard } from "../../src/types";

/**
 * Board of 25 goals with the given claims, e.g. { red: 3, blue: 2 }
 */
function boardWith(claims: { [colour: string]: number }): BingoBoard {
    const board = [] as unknown as BingoBoard;
    for (const colour in claims) {
        for (let i = 0; i < claims[colour]; i++) board.push({ completedBy: [colour] } as never);
    }
    while (board.length < 25) board.push({ completedBy: [] } as never);
    return board;
}

const colours = ["red", "blue", "green", "yellow"];

test("score is the number of claimed goals", (t) => {
    t.deepEqual(countClaims(boardWith({ red: 3, blue: 1 })), { red: 3, blue: 1 });
});

test("no clinch while the runner-up can still catch up", (t) => {
    // red 10, blue 2, 13 unclaimed: blue could still reach 15
    t.is(getClinchWinner(boardWith({ red: 10, blue: 2 }), colours), null);
    // red 12, blue 1, 12 unclaimed: blue could reach 13 > 12
    t.is(getClinchWinner(boardWith({ red: 12, blue: 1 }), colours), null);
});

test("clinch when the leader can't be caught anymore", (t) => {
    // red 13 of 25: even with all 12 unclaimed blue only reaches 12
    t.is(getClinchWinner(boardWith({ red: 13 }), colours), "red");
    // red 9, blue 7, green 6, yellow 1, 2 unclaimed: blue reaches at most 9 - a tie, not a clinch
    t.is(getClinchWinner(boardWith({ red: 9, blue: 7, green: 6, yellow: 1 }), colours), null);
    // red 10, blue 7, green 6, yellow 1, 1 unclaimed: blue reaches at most 8
    t.is(getClinchWinner(boardWith({ red: 10, blue: 7, green: 6, yellow: 1 }), colours), "red");
});

test("a full board with a tie is not clinched", (t) => {
    t.is(getClinchWinner(boardWith({ red: 10, blue: 10, green: 5 }), colours), null);
});

test("timer winner: most claims, ties are a draw", (t) => {
    t.deepEqual(getLeaders(boardWith({ red: 4, blue: 6 }), colours), { colours: ["blue"], claims: 6 });
    t.deepEqual(getLeaders(boardWith({ red: 5, blue: 5, green: 2 }), colours), { colours: ["red", "blue"], claims: 5 });
});

function boardWithSlots(colour: string, slots: number[]): BingoBoard {
    const board = [] as unknown as BingoBoard;
    for (let slot = 1; slot <= 25; slot++) {
        board.push({ completedBy: slots.indexOf(slot) !== -1 ? [colour] : [] } as never);
    }
    return board;
}

test("bingo: a full row, column or diagonal of one colour", (t) => {
    t.true(hasBingo(boardWithSlots("red", [6, 7, 8, 9, 10]), "red"), "row");
    t.true(hasBingo(boardWithSlots("red", [3, 8, 13, 18, 23]), "red"), "column");
    t.true(hasBingo(boardWithSlots("red", [1, 7, 13, 19, 25]), "red"), "diagonal");
    t.true(hasBingo(boardWithSlots("red", [5, 9, 13, 17, 21]), "red"), "anti-diagonal");
});

test("no bingo for incomplete or wrapped lines, or another colour", (t) => {
    t.false(hasBingo(boardWithSlots("red", [6, 7, 8, 9]), "red"), "4 in a row");
    t.false(hasBingo(boardWithSlots("red", [4, 5, 6, 7, 8]), "red"), "wraps over two rows");
    t.false(hasBingo(boardWithSlots("red", [6, 7, 8, 9, 10]), "blue"), "line belongs to red");
});

test("in PvP a goal completed by several players counts for each", (t) => {
    const board = boardWithSlots("red", [1, 2, 3, 4, 5]);
    board.forEach((goal) => { if (goal.completedBy!.length) goal.completedBy!.push("blue"); });
    t.true(hasBingo(board, "red"));
    t.true(hasBingo(board, "blue"));
});
