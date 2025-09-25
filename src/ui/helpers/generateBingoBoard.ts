import { Goal, BingoBoard } from "src/types";
import { createSeededRandom, shuffle } from "src/util";

/**
* Generates a random Bingo board with 25 goals
*/
export function generateBingoBoard(goals: Goal[], seed?: number): BingoBoard {
    const rng = seed !== undefined ? createSeededRandom(seed) : Math.random;
    return shuffle(goals, rng).slice(0, 25); // Use shuffled goals and select the first 25
}
