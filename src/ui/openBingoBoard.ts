import { BingoBoard } from "../types";
import { showBingoBoardDialog } from "./showBingoBoardDialog";

const colorRed = "\x1b[31m";
const colorBlue = "\x1b[34m";
const colorReset = "\x1b[0m";

export function openBingoBoard(board: BingoBoard) {
    // Console output with colored text
    console.log(`${colorRed}--- Bingo Board ---${colorReset}`);
    board.forEach((goal) =>
        console.log(`${colorBlue}${goal.slot} - ${goal.name}${colorReset}`)
    );
    console.log(`
        --------------------------
        | 1  | 2  | 3  | 4  | 5  |
        -------------------------
        | 6  | 7  | 8  | 9  | 10 |
        -------------------------
        | 11 | 12 | 13 | 14 | 15 |
        -------------------------
        | 16 | 17 | 18 | 19 | 20 |
        -------------------------
        | 21 | 22 | 23 | 24 | 25 |
        --------------------------
    `);
    console.log(`${colorRed}--- Bingo Board ---${colorReset}`);
    showBingoBoardDialog(board);
}


