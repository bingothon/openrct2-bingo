import type { Goal, BingoBoard } from "./types";
import { config } from "./config";
import { goals } from "./goals";
import { updateGoalUI } from "./ui";

export const configureBoard = (seed: number,  isNewBoard: boolean = false) => {
    const randomBoard = generateBingoBoard(goals(seed), seed);
    const slottedBoard = assignSlotsWithCompletionStatus(randomBoard, isNewBoard);
    return slottedBoard;
}
/**
* Generates a random Bingo board with 25 goals
*/
function generateBingoBoard(goals: Goal[], seed?: number): BingoBoard {
    const rng = seed !== undefined ? createSeededRandom(seed) : Math.random;
    return shuffle(goals, rng).slice(0, 25); // Use shuffled goals and select the first 25
}

/**
 * Assigns slot numbers to each goal in the Bingo board and checks if each goal is completed.
 * If in server mode, resets all goals to "incomplete" in parkStorage before assigning slots.
 */
function assignSlotsWithCompletionStatus(board: BingoBoard, isNewBoard: boolean = false): BingoBoard {
    if (network.mode === "server" && isNewBoard) {
        // Reset all goals to incomplete in parkStorage if in server mode
        board.forEach((_, index) => {
            const slot = `${index + 1}`;
            const goalKey = `${config.namespace}.goal_${slot}`;
            setGoalCompletionStatus(goalKey, false); // Reset goal to incomplete
        });
    }

    return board.map((goal, index) => {
        const slot = `${index + 1}`;
        const goalKey = `${config.namespace}.goal_${slot}`;

        // Check if the goal is marked as completed in parkStorage
        const isCompleted = context.getParkStorage().get(goalKey, false);

        return {
            ...goal,
            slot,
            status: isCompleted ? "completed" : goal.status
        };
    });
}

/**
* Shuffles an array using the Fisher-Yates algorithm with a seeded RNG
*/
function shuffle<T>(array: T[], rng: () => number): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]]; // Swap elements
    }
    return result;
}


/**
 * Inserts line breaks in the goal name at the closest word boundaries so each line fits within a specified max width.
 * @param {string} name - The original name of the goal.
 * @returns {string} - Modified name with line breaks.
 */
export function addLineBreak(name: string): string {
    const maxWidth = 15;
    let result = "";
    let remainingText = name;

    while (remainingText.length > maxWidth) {
        let breakPoint = remainingText.lastIndexOf(" ", maxWidth);

        // If no space found within max width, try finding the next space after max width
        if (breakPoint === -1) {
            breakPoint = remainingText.indexOf(" ", maxWidth);
        }

        // If no suitable space found, break exactly at max width
        if (breakPoint === -1) {
            breakPoint = maxWidth;
        }

        // Add the line to the result and remove the processed part from remaining text
        result += remainingText.slice(0, breakPoint) + "\n";
        remainingText = remainingText.slice(breakPoint + 1); // Remove space at the break point
    }

    // Add any remaining text that fits within max width
    result += remainingText;

    return result;
}

export function updateBoardWithData(board: BingoBoard) {
    context.executeAction(
        "updateBoardData",
        { args: { board } },
        (result) => {
            if (result.error) {
                console.log("Failed to update board with new data:", result.errorMessage);
            }
        }
    );
}

export function updateBoardWithSeed(newSeed: number) {
    context.executeAction(
        "updateBoardSeed",
        { args: { seed: newSeed } },
        (result) => {
            if (result.error) {
                console.log("Failed to update board with new seed:", result.errorMessage);
            }
        }
    );
}

export function subscribeToGoalChecks(board: BingoBoard) {
    let tickCounter = 0;
    context.subscribe("interval.tick", () => {
        tickCounter++;
        if (tickCounter % 1000 === 0) {
            checkGoals(board);
            tickCounter = 0;
        }
    });
}

/**
 * Wrapper function to set goal completion status in parkStorage using the setGoalCompletion action.
 * @param {string} goalKey - The key of the goal to update.
 * @param {boolean} completed - The completion status to set (true for completed, false for incomplete).
 * @param {string} goalName - Optional name of the goal for logging purposes.
 */
function setGoalCompletionStatus(goalKey: string, completed: boolean, goalName?: string) {
    context.executeAction(
        "setGoalCompletion",
        { args: { goalKey, completed } }, // Pass args as an object with explicit keys
        (result) => {
            if (result.error) {
                console.log(`Failed to set completion for ${goalName || goalKey}:`, result.errorMessage);
            } else {
                console.log(`Goal ${goalName || goalKey} completion status set to ${completed}.`);
            }
        }
    );
}

/**
 * Iterates over goals, checks conditions, and updates UI if conditions are met.
 * Uses a game action to set goal completion in `parkStorage` to ensure synchronization across clients.
 * @param {BingoBoard} board - Array of 25 goals to check.
 * @param {Socket} [socket] - Optional socket connection to send updates.
 */
function checkGoals(board: BingoBoard, socket?: Socket) {
    console.log("Goal check interval running...");

    try {
        board.forEach((goal, index) => {
            const goalKey = `${config.namespace}.goal_${goal.slot}`;

            if (network.mode === "client") {
                // In client mode, read goal status from parkStorage
                const isCompleted = context.getParkStorage().get(goalKey, false);
                if (isCompleted && goal.status !== "completed") {
                    goal.status = "completed";
                    console.log(`Goal ${goal.slot || "unslotted"} - ${goal.name} marked as completed from parkStorage.`);
                    updateGoalUI(index, board);
                }
            } else if (network.mode === "server" || network.mode === "none") {
                // In server or offline mode, perform goal check and update parkStorage via game action
                if (goal.status === "incomplete" && goal.checkCondition()) {
                    goal.status = "completed";

                    // Set goal completion status in parkStorage
                    setGoalCompletionStatus(goalKey, true, goal.name);

                    // Send goal completion action to socket if connected
                    const selectGoalAction = JSON.stringify({ action: "selectGoal", slot: goal.slot, color: "red" }) + "\n";
                    if (socket) socket.write(selectGoalAction);

                    console.log(`Goal ${goal.slot || "unslotted"} - ${goal.name} marked as completed.`);
                    updateGoalUI(index, board);
                }
            }
        });
    } catch (error) {
        console.log("Error checking goals:", error);
    }
}



export const getSeed = (): number => {
    const parkStorage = context.getParkStorage();
    return parkStorage.get(`${config.namespace}.bingoSeed`, config.defaultSeed); // Default seed if not found
};

export const setSeed = () => {
    const newSeed = Math.floor(Math.random() * 100000);
    context.executeAction('setSeed', { args: { seed: newSeed } }, (result) => {
        if (result.error) {
            console.log('Failed to set seed:', result.errorMessage);
        }
    });
    return newSeed;
}

/**
 * Generates a seeded random number generator function
 */
export function createSeededRandom(seed: number): () => number {
    let s = seed % 2147483647;
    return function () {
        s = (s * 16807) % 2147483647;
        return (s - 1) / 2147483646;
    };
}
