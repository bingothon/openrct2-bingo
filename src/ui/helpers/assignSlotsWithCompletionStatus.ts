import { setGoalCompletionStatus } from "src/bingo/main";
import { BingoBoard } from "src/types";

function getStoredColours(goalKey: string): string[] {
    try {
        const stored = JSON.parse(context.getParkStorage().get(`${goalKey}_colors`, "[]"));
        return Array.isArray(stored) ? stored : [];
    } catch (error) {
        return [];
    }
}

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
        // Note: Reading from storage - this is acceptable for read operations
        const isCompleted = context.getParkStorage().get(goalKey, false);
        // PvP/Lockout: who completed it (stored by GoalManager), so checkmarks get the player's colour
        const completedBy = getStoredColours(goalKey);

        return {
            ...goal,
            slot,
            status: isCompleted ? "completed" : goal.status,
            colors: completedBy.length > 0 ? completedBy.join(" ") : goal.colors,
            completedBy: completedBy.length > 0 ? completedBy : goal.completedBy,
        };
    });
}
