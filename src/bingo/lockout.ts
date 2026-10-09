/*
 * PvP/Lockout scoring and win conditions. The board is the source of truth: a colour's score
 * is the number of goals it completed (goal.completedBy), so scores survive restarts and can't
 * drift from the board.
 * - Lockout ends at a clinch (leader can't be caught) or when the time runs out
 * - PvP ends at the first bingo (full row, column or diagonal) or when the time runs out
 */

import type { BingoBoard } from "../types";

export type ClaimCounts = { [colour: string]: number };

/**
 * Number of goals each colour has claimed
 */
export function countClaims(board: BingoBoard): ClaimCounts {
    const counts: ClaimCounts = {};
    board.forEach((goal) => {
        (goal.completedBy || []).forEach((colour) => {
            counts[colour] = (counts[colour] || 0) + 1;
        });
    });
    return counts;
}

function countUnclaimed(board: BingoBoard): number {
    return board.filter((goal) => !goal.completedBy || goal.completedBy.length === 0).length;
}

/**
 * The colour that can no longer be caught: it has more claims than the runner-up could
 * reach by claiming every remaining goal. Null while the game is still open.
 */
export function getClinchWinner(board: BingoBoard, colours: string[]): string | null {
    if (colours.length === 0) return null;

    const counts = countClaims(board);
    const sorted = colours.slice().sort((a, b) => (counts[b] || 0) - (counts[a] || 0));
    const leader = counts[sorted[0]] || 0;
    const runnerUp = sorted.length > 1 ? counts[sorted[1]] || 0 : 0;

    return leader > runnerUp + countUnclaimed(board) ? sorted[0] : null;
}

/**
 * Colour(s) with the most claims - more than one on a tie
 */
export function getLeaders(board: BingoBoard, colours: string[]): { colours: string[]; claims: number } {
    const counts = countClaims(board);
    let best = 0;
    colours.forEach((colour) => {
        best = Math.max(best, counts[colour] || 0);
    });
    return { colours: colours.filter((colour) => (counts[colour] || 0) === best), claims: best };
}

// Rows, columns and both diagonals of the 5x5 board (board index = slot - 1)
const BINGO_LINES: number[][] = (() => {
    const lines: number[][] = [];
    for (let i = 0; i < 5; i++) {
        lines.push([0, 1, 2, 3, 4].map((col) => i * 5 + col)); // row
        lines.push([0, 1, 2, 3, 4].map((row) => row * 5 + i)); // column
    }
    lines.push([0, 6, 12, 18, 24], [4, 8, 12, 16, 20]);
    return lines;
})();

/**
 * Whether a colour completed a full row, column or diagonal (PvP win)
 */
export function hasBingo(board: BingoBoard, colour: string): boolean {
    return BINGO_LINES.some((line) =>
        line.every((index) => {
            const goal = board[index];
            return goal !== undefined && goal.completedBy !== undefined && goal.completedBy.indexOf(colour) !== -1;
        }),
    );
}
