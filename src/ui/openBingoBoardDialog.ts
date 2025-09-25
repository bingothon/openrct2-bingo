import { configureBoard } from "./helpers";
import { getSeed } from "../utils";
import { openBingoBoard } from "./openBingoBoard";

export function openBingoBoardDialog() {
    const existingWindow = ui.getWindow("bingo-board");

    if (existingWindow) {
        // If the Bingo Board window is already open, close it
        existingWindow.close();
    } else {
        // If the Bingo Board window is not open, create and display it
        const board = configureBoard(getSeed());
        openBingoBoard(board);
    }
}


