import { setGoalCompletionStatus } from "src/bingo/main";
import { BingoBoard } from "src/types";

/**
 * Assigns slot numbers to each goal in the Bingo board and checks if each goal is completed.
 * If in server mode, resets all goals to "incomplete" in parkStorage before assigning slots.
 */
export function assignSlotsWithCompletionStatus(board: BingoBoard, isNewBoard: boolean = false): BingoBoard {
    if (network.mode === "server" && isNewBoard) {
        // Reset all goals to incomplete in parkStorage if in server mode
        board.forEach((goal, index) => {
            const slot = `${index + 1}`;
            const goalKey = `goal_${slot}`;
            setGoalCompletionStatus(goalKey, false, goal.name); // Reset goal to incomplete
        });
    }

    return board.map((goal, index) => {
        const slot = `${index + 1}`;
        const goalKey = `goal_${slot}`;
        console.log("Goal key:", goalKey);
        // Check if the goal is marked as completed in parkStorage
        const isCompleted = context.getParkStorage().get(goalKey, false);

        return {
            ...goal,
            slot,
            status: isCompleted ? "completed" : goal.status
        };
    });
}
