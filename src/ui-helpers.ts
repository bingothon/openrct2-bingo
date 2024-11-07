import type { Goal, BingoBoard } from "./types";
import { config } from "./config";
import { checkGoals, goals } from "./goals";
import { updateGoalUI } from "./ui";
import { createSeededRandom, shuffle } from "./util";

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


