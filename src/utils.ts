import { config } from "./config";

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
  