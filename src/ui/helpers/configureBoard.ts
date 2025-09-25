import { goals } from "src/bingo/goals";
import { generateBingoBoard } from "./generateBingoBoard";
import { assignSlotsWithCompletionStatus } from "./assignSlotsWithCompletionStatus";

export const configureBoard = (seed: number, isNewBoard: boolean = false) => {
    const randomBoard = generateBingoBoard(goals(seed), seed);
    const slottedBoard = assignSlotsWithCompletionStatus(randomBoard, isNewBoard);
    return slottedBoard;
}
