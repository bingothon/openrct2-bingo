import type { Goal, BingoBoard } from "./types";
import { config } from "./config";
import { goals } from "./goals";
import { updateGoalUI } from "./ui";

export const newBoard = (seed: number) => {
    const randomBoard = generateBingoBoard(goals(seed), seed);
    const slottedBoard = assignSlots(randomBoard);
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
 * Assigns slot numbers to each goal in the Bingo board
 */
function assignSlots(board: BingoBoard): BingoBoard {
    return board.map((goal, index) => ({ ...goal, slot: `${index + 1}` }));
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
 * Iterates over goals, checks conditions, and updates UI if conditions are met.
 * @param {BingoBoard} board - Array of 25 goals to check.
 * @param {Socket} [socket] - Optional socket connection to send updates.
 */
function checkGoals(board: BingoBoard, socket?: Socket) {
    console.log("Goal check interval running...");
    try {
        board.forEach((goal, index) => {
            if (goal.status === "incomplete" && goal.checkCondition()) {
                goal.status = "completed";
                const selectGoalAction = JSON.stringify({ action: "selectGoal", slot: goal.slot, color: "red" }) + "\n";
                if (socket) socket.write(selectGoalAction);
                console.log(`Goal ${goal.slot || "unslotted"} - ${goal.name} marked as completed.`);

                // Update only the specific button in the UI
                updateGoalUI(index, board);
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
  