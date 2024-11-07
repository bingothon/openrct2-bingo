/**
* Shuffles an array using the Fisher-Yates algorithm with a seeded RNG
*/
export function shuffle<T>(array: T[], rng: () => number): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]]; // Swap elements
    }
    return result;
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