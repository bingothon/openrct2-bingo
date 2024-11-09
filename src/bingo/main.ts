
import { config } from "../config";
import type { BingoBoard, Goal } from "../types";

let intervalSubscription: IDisposable | null = null; // Store the subscription reference

/**
 * Updates the UI to reflect a completed goal without refreshing the entire Bingo board.
 */
export function updateGoalUI(index: number, board: BingoBoard) {
    const window = ui.getWindow("bingo-board");
    if (window) {
        const button = window.findWidget<ButtonWidget>(`slot${index + 1}`);
        if (button) {
            button.isPressed = true;
            button.border = false;
            button.text = `✓ ${board[index].name}`;
        }
    }
}

export function subscribeToGoalChecks(board: BingoBoard) {
    // Dispose of any existing subscription to prevent duplicates
    if (intervalSubscription) {
        intervalSubscription.dispose();
    }

    let tickCounter = 0;

    // Create a new subscription and store the IDisposable reference
    intervalSubscription = context.subscribe("interval.tick", () => {
        tickCounter++;
        if (tickCounter % 1000 === 0) {
            checkGoals(board);
            tickCounter = 0;
        }
    });
}


// Track which bingos have been triggered using a plain object
const completedBingos: Record<string, boolean> = {};

/**
 * Checks if a specific row, column, or diagonal has achieved "bingo".
 * @param board The bingo board array.
 */
function checkForBingo(board: BingoBoard) {
    // Check rows and columns for bingo
    for (let i = 0; i < 5; i++) {
        if (isLineCompleted(board, 'row', i)) triggerBingo(`row_${i}`);
        if (isLineCompleted(board, 'column', i)) triggerBingo(`column_${i}`);
    }

    // Check diagonals for bingo
    if (isLineCompleted(board, 'diagonal', 0)) triggerBingo("diagonal_0");
    if (isLineCompleted(board, 'diagonal', 1)) triggerBingo("diagonal_1");
}

/**
 * Checks if a specific line (row, column, or diagonal) is completed.
 * @param board The bingo board array.
 * @param type The type of line ("row", "column", "diagonal").
 * @param index The index of the line (0-4 for rows/columns, 0-1 for diagonals).
 */
function isLineCompleted(board: BingoBoard, type: 'row' | 'column' | 'diagonal', index: number): boolean {
    const goals: Goal[] = [];

    for (let i = 0; i < 5; i++) {
        switch (type) {
            case 'row':
                goals.push(board[i * 5 + index]); // Goals in row
                break;
            case 'column':
                goals.push(board[index * 5 + i]); // Goals in column
                break;
            case 'diagonal':
                goals.push(board[i * 5 + (index === 0 ? i : 4 - i)]); // Goals in diagonals
                break;
        }
    }

    // Check if all goals in the line are completed using a for-loop
    for (let goal of goals) {
        if (goal.status !== "completed") {
            return false;
        }
    }
    return true;
}

/**
 * Triggers a bingo if a line hasn't already triggered one.
 * @param lineKey Unique identifier for the line (e.g., "row_0", "column_2", "diagonal_1").
 */
export function triggerBingo(lineKey: string) {
    if (!completedBingos[lineKey]) {
        completedBingos[lineKey] = true; // Mark the bingo as completed
        console.log(`Bingo! ${lineKey} completed!`);
        context.executeAction('notifyBingo', { args: { lineKey } }, (result) => {
            if (result.error) {
                console.log(`Failed to trigger bingo for ${lineKey}:`, result.errorMessage);
            }
        });
    }
}

/**
 * Checks and updates goals on the board, then checks for any bingo lines.
 * @param board The bingo board to check.
 */
export function checkGoals(board: BingoBoard) {
    console.log("Goal check interval running...");

    try {
        board.forEach((goal, index) => {
            const goalKey = `${config.namespace}.goal_${goal.slot}`;

            if (network.mode === "client") {
                const isCompleted = context.getParkStorage().get(goalKey, false);
                if (isCompleted && goal.status !== "completed") {
                    goal.status = "completed";
                    console.log(`Goal ${goal.slot || "unslotted"} - ${goal.name} marked as completed from parkStorage.`);
                    updateGoalUI(index, board);
                }
            } else if (network.mode === "server" || network.mode === "none") {
                if (goal.status === "incomplete" && goal.checkCondition()) {
                    const selectGoalAction = JSON.stringify({ action: "selectGoal", slot: goal.slot, color: "red", room: config.room }) + "\n";
                    if (config.socket) config.socket.write(selectGoalAction);
                    goal.status = "completed";
                    setGoalCompletionStatus(goalKey, true, goal.name, () => {
                        checkForBingo(board);
                    });
                    console.log(`Goal ${goal.slot || "unslotted"} - ${goal.name} marked as completed.`);
                    updateGoalUI(index, board);
                }
            }
        });

    } catch (error) {
        console.log("Error checking goals:", error);
    }
}

/**
 * Wrapper function to set goal completion status in parkStorage using the setGoalCompletion action.
 * @param {string} goalKey - The key of the goal to update.
 * @param {boolean} completed - The completion status to set (true for completed, false for incomplete).
 * @param {string} goalName - Optional name of the goal for logging purposes.
 */
export function setGoalCompletionStatus(goalKey: string, completed: boolean, goalName: string, callback?: () => void) {
    context.executeAction(
        "setGoalCompletion",
        { args: { goalKey, completed, name: goalName } }, // Pass args as an object with explicit keys
        (result) => {
            if (result.error) {
                console.log(`Failed to set completion for ${goalName || goalKey}:`, result.errorMessage);
            } else {
                if (callback) callback();
                console.log(`Goal ${goalName || goalKey} completion status set to ${completed}.`);
            }
        }
    );
}


