import { goals } from "src/bingo/goals";
import { config } from "src/config";
import { BingoBoard, Goal } from "src/types";
import { generateBingoBoard } from "./generateBingoBoard";
import { assignSlotsWithCompletionStatus } from "./assignSlotsWithCompletionStatus";

export type BoardGameMode = "coop" | "pvp" | "lockout";

/**
 * Game mode the board is built for. Read from park storage, which is synchronised to every
 * client, so server and clients build the same board.
 */
export function getBoardGameMode(): BoardGameMode {
    return context.getParkStorage().get("gameMode", config.gameMode) as BoardGameMode;
}

/**
 * Goals available in a mode: coop uses the park-wide goals, PvP/Lockout only goals that can
 * be checked per player (shown under their PvP name)
 */
export function goalsForMode(allGoals: Goal[], mode: BoardGameMode): Goal[] {
    if (mode === "coop") {
        return allGoals.filter((goal) => !goal.playerOnly);
    }
    return allGoals
        .filter((goal) => goal.checkPlayer !== undefined)
        .map((goal) => (goal.playerName ? { ...goal, name: goal.playerName } : goal));
}

export const configureBoard = (seed: number, isNewBoard: boolean = false, mode: BoardGameMode = getBoardGameMode()): BingoBoard => {
    const randomBoard = generateBingoBoard(goalsForMode(goals(seed), mode), seed);
    const slottedBoard = assignSlotsWithCompletionStatus(randomBoard, isNewBoard);
    return slottedBoard;
}
