const MODULUS = 2147483647;

/**
 * Generates a seeded random number generator function (Park-Miller)
 */
export function createSeededRandom(seed: number): () => number {
    // 0 would only ever produce 0
    let s = seed % MODULUS;
    if (s <= 0) s += MODULUS - 1;

    const next = function () {
        s = (s * 16807) % MODULUS;
        return (s - 1) / (MODULUS - 1);
    };
    // The first number grows with the seed (seeds go up to 100000, so it stays below ~0.8):
    // skip it, or e.g. the last of 5 choices is never picked
    next();
    return next;
}
