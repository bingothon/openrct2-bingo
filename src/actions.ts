import type { BingoBoard } from "./types";
import { config } from "./config";
import { configureBoard } from "./ui-helpers";
import { openBingoBoard, showGameDurationDialog } from "./ui";
import { notifyTextBingo, notifyTextGoal } from "./bingo/notifications/text";
import { notifyGroundBingo } from "./bingo/notifications/ground";
import { bingosyncUI } from "./bingo/bingosync-handler";
import { subscribeToGoalChecks } from "./subscriptions";
import { FOOT_PATH_LOCATIONS, INVENTION_ITEMS } from "./constants";
import { getRandomItemsByRideType } from "./util";
let bingoBeingNotified = false;

/**
 * Action to update the board seed
 */
export function updateBoardSeedAction() {
  return {
    name: "updateBoardSeed",
    query: (event: GameActionEventArgs<{ seed: number }>): GameActionResult => {
      console.log("Querying action with event args:", event.args);
      return { error: 0 };
    },
    execute: (event: GameActionEventArgs<{ seed: number }>): GameActionResult => {
      if (!event.args || event.args.seed === undefined) {
        return { error: 1, errorMessage: "Seed is undefined or event args are missing." };
      }
      const seed = event.args.seed;

      const board = configureBoard(seed);
      subscribeToGoalChecks(board);

      if (typeof ui !== 'undefined') openBingoBoard(board);
      console.log(`Bingo board updated with new seed: ${seed}`);
      return { error: 0 };
    }
  };
}

/**
 * Action to update the board data
 */
export function updateBoardDataAction() {
  return {
    name: "updateBoardData",
    query: (event: GameActionEventArgs<{ board: BingoBoard }>): GameActionResult => {
      console.log("Querying action with event args:", event.args);
      return { error: 0 };
    },
    execute: (event: GameActionEventArgs<{ board: BingoBoard }>): GameActionResult => {
      if (!event.args || !event.args.board) {
        return { error: 1, errorMessage: "Board data is missing." };
      }
      subscribeToGoalChecks(event.args.board);
      openBingoBoard(event.args.board);
      console.log("Bingo board updated with new data.");
      return { error: 0 };
    }
  };
}

/**
 * Action to set the seed
 */
export function setSeedAction() {
  return {
    name: 'setSeed',
    query: (event: GameActionEventArgs<{ seed: number }>): GameActionResult => {
      console.log('Querying action with event args:', event.args);
      return { error: 0 };
    },
    execute: (event: GameActionEventArgs<{ seed?: number }>): GameActionResult => {
      if (!event.args || event.args.seed === undefined) {
        return { error: 1, errorMessage: 'Seed is undefined or event args are missing.' };
      }
      const seed = event.args.seed;
      const parkStorage = context.getParkStorage();
      parkStorage.set(`bingoSeed`, seed);
      console.log(`New seed set: ${seed}`);
      return { error: 0 };
    }
  };
}

/**
 * Action to set goal completion status
 */
export function setGoalCompletionAction() {
  return {
    name: "setGoalCompletion",
    query: (event: GameActionEventArgs<{ goalKey: string; completed: boolean, goalName?: string }>): GameActionResult => {
      console.log("Querying goal completion action with event args:", event.args);
      return { error: 0 };
    },
    execute: (event: GameActionEventArgs<{ goalKey: string; completed: boolean, goalName?: string }>): GameActionResult => {
      if (!event.args || event.args.goalKey === undefined || event.args.completed === undefined) {
        return { error: 1, errorMessage: "Goal key or completion status is missing." };
      }
      const parkStorage = context.getParkStorage();
      console.log(`Setting goal completion status for ${event.args.goalKey}: ${event.args.completed}`);
      parkStorage.set(event.args.goalKey, event.args.completed);
      if (event.args.goalName) {
        notifyTextGoal(event.args.goalName);
      }
      console.log(`Goal completion status set for ${event.args.goalKey}: ${event.args.completed}`);
      return { error: 0 };
    }
  };
}

export function notifyBingoAction() {
  return {
    name: "notifyBingo",
    query: (event: GameActionEventArgs<{ lineKey: string }>): GameActionResult => {
      console.log("Querying action with event args:", event.args);
      return { error: 0 };
    },
    execute: (event: GameActionEventArgs<{ lineKey: string }>): GameActionResult => {
      if (!event.args || event.args.lineKey === undefined) {
        return { error: 1, errorMessage: "Line key is missing." };
      }
      if (network.mode === "server") {
        notifyTextBingo(event.args.lineKey);
      }
      notifyGroundBingo();

      return { error: 0 };
    }
  };
}

export function addCashAction() {
  return {
    name: "addCash",
    query: (event: GameActionEventArgs<{ cash: number }>): GameActionResult => {
      return { error: 0 };
    },
    execute: (event: GameActionEventArgs<{ cash: number }>): GameActionResult => {
      if (!event.args || event.args.cash === undefined) {
        return { error: 1, errorMessage: "Cash amount is missing." };
      }

      park.cash += event.args.cash;
      return { error: 0 };
    }
  };
}

export function moveToAction() {
  return {
    name: "moveTo",
    query: (event: GameActionEventArgs<{ x: number; y: number }>): GameActionResult => {
      console.log("Querying action with event args:", event.args);
      return { error: 0 };
    },
    execute: (event: GameActionEventArgs<{ x: number; y: number }>): GameActionResult => {
      if (!event.args || event.args.x === undefined || event.args.y === undefined) {
        return { error: 1, errorMessage: "X or Y position is missing." };
      }

      const { x, y } = event.args;
      ui.mainViewport.moveTo({ x: x, y: y });
      console.log(`Moved view to: ${x}, ${y}`);
      return { error: 0 };
    }
  };
}

export function connectionDetailsAction() {
  return {
    name: "connectionDetails",
    query: (event: GameActionEventArgs<{ roomUrl: string; roomPassword: string }>): GameActionResult => {
      console.log("Querying action with event args:", event.args);
      return { error: 0 };
    },
    execute: (event: GameActionEventArgs<{ roomUrl: string; roomPassword: string }>): GameActionResult => {
      context.getParkStorage().set('roomUrl', event.args.roomUrl);
      context.getParkStorage().set('roomPassword', event.args.roomPassword);
      return { error: 0 };
    }
  };
}

export function clearAllTilesAction() {
  return {
    name: "clearAllTiles",
    query: (event: GameActionEventArgs): GameActionResult => {
      console.log("Querying action with event args:", event.args);
      return { error: 0 };
    },
    execute: (event: GameActionEventArgs): GameActionResult => {
      const mapSize = map.size; // Get the map size in tiles
      const tilesX = mapSize.x; // Total tiles in the X direction
      const tilesY = mapSize.y; // Total tiles in the Y direction

      // List of tiles to exclude
      const excludedTiles = [
        { x: 1, y: 30 },
        { x: 2, y: 30 },
        { x: 3, y: 29 },
        { x: 3, y: 30 },
        { x: 3, y: 31 }
      ];

      console.log(`Clearing map of size ${tilesX}x${tilesY} tiles...`);

      for (let x = 0; x < tilesX; x++) {
        for (let y = 0; y < tilesY; y++) {
          // Skip excluded tiles
          const isExcluded = excludedTiles.some(tile => tile.x === x && tile.y === y);
          if (isExcluded) {
            console.log(`Skipping tile at (${x}, ${y}) as it is in the excluded list.`);
            continue;
          }

          const tile = map.getTile(x, y);
          const tileElements = tile.elements;


          for (let i = 0; i < tileElements.length; i++) {
            if (tileElements[i].type === "track") {
              // console.log(`why not`, tileElements[i]);
              tile.removeElement(i);
            }
          }

        }
      }
      return { error: 0 };
    }
  };
}

export function clearAllRidesAction() {
  return {
    name: "clearAllRides",
    query: (event: GameActionEventArgs): GameActionResult => {
      return { error: 0 };
    },
    execute: (event: GameActionEventArgs): GameActionResult => {
      const rides = map.rides;
      if (rides.length === 0) {
        console.log("No rides to clear.");
        return { error: 0 };
      }
      for (const ride of rides) {
        context.executeAction("ridesetstatus", { ride: ride.id, status: 0 }, () => {
          context.executeAction("ridesetstatus", { ride: ride.id, status: 0 }, () => {
            context.executeAction("ridedemolish", { ride: ride.id, modifyType: 0 }, () => {
              console.log(`Ride ${ride.id} demolished.`);
              return { error: 0 };
            });
          });
        });
      }
      return { error: 0 };

    }
  }
}

export function setCashAction() {
  return {
    name: "setCash",
    query: (event: GameActionEventArgs<{ cash: number }>): GameActionResult => {
      console.log("Querying action with event args:", event.args);
      return { error: 0 };
    },
    execute: (event: GameActionEventArgs<{ cash: number }>): GameActionResult => {
      if (!event.args || event.args.cash === undefined) {
        return { error: 1, errorMessage: "Cash amount is missing." };
      }

      park.cash = event.args.cash;
      console.log(`Set cash to: ${event.args.cash}`);
      return { error: 0 };
    }
  };
}


/**
 * Action to invent the next research item.
 */
export function inventNextItemAction() {
  return {
    name: "inventNextItem",
    query: (event: GameActionEventArgs): GameActionResult => {
      console.log("Querying inventNextItem action with event args:", event.args);
      return { error: 0 };
    },
    execute: (event: GameActionEventArgs): GameActionResult => {
      const research = park.research;

      if (research.uninventedItems.length > 0) {
        research.progress = 65534; // Set progress to 100%
        return { error: 0 };
      } else {
        console.log("No more items to invent.");
        return { error: 0, errorMessage: "No uninvented items remaining." };
      }
    }
  };
}

export function resetResearchAction() {
  return {
    name: "resetResearch",
    query: (event: GameActionEventArgs): GameActionResult => {
      console.log("Querying inventNextItem action with event args:", event.args);
      return { error: 0 };
    },
    execute: (event: GameActionEventArgs): GameActionResult => {
      const research = park.research;
      const researchItems = getRandomItemsByRideType(INVENTION_ITEMS);
      const researchItemsExcludingScenery = researchItems.filter(item => item.category !== "scenery");
      const researchItemsWeWant = researchItems.filter(item => item.category === "scenery" || item.category === "shop");
      research.uninventedItems = researchItemsExcludingScenery as ResearchItem[];
      research.inventedItems = researchItemsWeWant as ResearchItem[];
      research.funding = 3;
      research.progress = 0;
      research.priorities = ["transport", "gentle", "rollercoaster", "thrill", "water", "shop", "scenery"];
      return { error: 0 };
    }
  };
}

export function parkMessageAction() {
  return {
    name: "parkMessage",
    query: (event: GameActionEventArgs<{ message: string }>): GameActionResult => {
      console.log("Querying action with event args:", event.args);
      return { error: 0 };
    },
    execute: (event: GameActionEventArgs<{ message: string }>): GameActionResult => {
      if (!event.args || event.args.message === undefined) {
        return { error: 1, errorMessage: "Message is missing." };
      }

      park.postMessage(event.args.message);
      return { error: 0 };
    }
  };
}

export function networkMessageAction() {
  return {
    name: "networkMessage",
    query: (event: GameActionEventArgs<{ message: string }>): GameActionResult => {
      console.log("Querying action with event args:", event.args);
      return { error: 0 };
    },
    execute: (event: GameActionEventArgs<{ message: string }>): GameActionResult => {
      if (!event.args || event.args.message === undefined) {
        return { error: 1, errorMessage: "Message is missing." };
      }

      network.sendMessage(event.args.message);
      return { error: 0 };
    }
  };
}

export function flatAllLandAction() {
  return {
    name: "flatAllLand",
    query: (event: GameActionEventArgs): GameActionResult => {
      console.log("Querying flatAllLand action with event args:", event.args);
      return { error: 0 };
    },
    execute: (event: GameActionEventArgs): GameActionResult => {
      if (network.mode === 'server') {
        const mapSize = map.size; // Get the map size in tiles
        const tilesX = mapSize.x; // Total tiles in the X direction
        const tilesY = mapSize.y; // Total tiles in the Y direction

        // Determine the target height from the exclusion zone
        const targetHeight = 112;
        if (targetHeight === null) {
          console.log("No valid surface tile found in the exclusion zone.");
          return { error: 1, errorMessage: "No valid height in exclusion zone." };
        }

        console.log(`Starting to flatten all land to target height: ${targetHeight}`);

        const chunks = createChunks(tilesX, tilesY, 64);
        flattenAllChunksUntilDone(chunks, targetHeight);
      }
      return { error: 0 };
    },
  };
}

/**
 * Repeatedly processes chunks until all land is flattened to the target height.
 * @param chunks Array of chunks to process.
 * @param targetHeight The target height to flatten the land to.
 */
function flattenAllChunksUntilDone(chunks: { x1: number; y1: number; x2: number; y2: number }[], targetHeight: number) {
  let maxOffset = 0;

  // Calculate the maximum offset for all chunks
  for (const chunk of chunks) {
    for (let x = chunk.x1; x <= chunk.x2; x++) {
      for (let y = chunk.y1; y <= chunk.y2; y++) {
        const tile = map.getTile(x, y);
        const surface = tile.elements.filter(el => el.type === "surface")[0] as SurfaceElement | undefined;

        if (surface) {
          const offset = surface.baseZ - targetHeight;
          maxOffset = Math.max(maxOffset, Math.abs(offset));
        }
      }
    }
  }

  // If there is no offset left, all land is flattened
  if (maxOffset === 0) {
    console.log("All land has been flattened to the target height.");
    return;
  }

  // Process all chunks for this pass
  processChunks(chunks, targetHeight, () => {
    // Recursively process chunks until the entire map is flattened
    context.setTimeout(() => flattenAllChunksUntilDone(chunks, targetHeight), 0);
  });
}

/**
 * Processes chunks asynchronously in one pass.
 * @param chunks Array of chunks to process.
 * @param targetHeight The target height to flatten the land to.
 * @param callback Callback to execute after processing all chunks.
 */
function processChunks(
  chunks: { x1: number; y1: number; x2: number; y2: number }[],
  targetHeight: number,
  callback: () => void
) {
  if (chunks.length === 0) {
    callback();
    return;
  }

  const chunk = chunks.shift();
  if (!chunk) return;

  flattenLandChunk(chunk.x1, chunk.y1, chunk.x2, chunk.y2, targetHeight, () => {
    // Process the next chunk after the current one is done
    processChunks(chunks, targetHeight, callback);
  });
}

/**
 * Flattens a chunk of land to the target height by iteratively raising or lowering it.
 * @param x1 The starting x-coordinate of the chunk.
 * @param y1 The starting y-coordinate of the chunk.
 * @param x2 The ending x-coordinate of the chunk.
 * @param y2 The ending y-coordinate of the chunk.
 * @param targetHeight The target height to flatten the land to.
 * @param callback Callback to execute after the chunk is processed.
 */
function flattenLandChunk(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  targetHeight: number,
  callback: () => void
): void {
  let maxOffset = 0;
  let minOffset = 0;

  // Calculate maximum and minimum offsets from the target height
  for (let x = x1; x <= x2; x++) {
    for (let y = y1; y <= y2; y++) {
      const tile = map.getTile(x, y);
      const surface = tile.elements.filter(el => el.type === "surface")[0] as SurfaceElement | undefined;

      if (surface) {
        const offset = surface.baseZ - targetHeight;
        maxOffset = Math.max(maxOffset, offset);
        minOffset = Math.min(minOffset, offset);
      }
    }
  }

  // Perform the required number of lowers
  const lowerCount = Math.ceil(maxOffset / 16);
  const raiseCount = Math.ceil(Math.abs(minOffset) / 16);

  function performLower(remaining: number) {
    if (remaining <= 0) {
      performRaise(raiseCount);
      return;
    }

    const args = {
      x: (x1 + x2) * 16,
      y: (y1 + y2) * 16,
      x1: x1 * 32,
      y1: y1 * 32,
      x2: x2 * 32,
      y2: y2 * 32,
      selectionType: 4, // MAP_SELECT_TYPE_FULL
    };

    context.queryAction("landlower", args, (queryResult) => {
      if (queryResult.cost && queryResult.cost > 0) {
        context.executeAction("addCash", { args: { cash: queryResult.cost } }, () => {
          context.executeAction("landlower", args, () => {
            performLower(remaining - 1);
          });
        });
      } else {
        performLower(remaining - 1);
      }
    });
  }

  function performRaise(remaining: number) {
    if (remaining <= 0) {
      callback();
      return;
    }

    const args = {
      x: (x1 + x2) * 16,
      y: (y1 + y2) * 16,
      x1: x1 * 32,
      y1: y1 * 32,
      x2: x2 * 32,
      y2: y2 * 32,
      selectionType: 4, // MAP_SELECT_TYPE_FULL
    };

    context.queryAction("landraise", args, (queryResult) => {
      if (queryResult.cost && queryResult.cost > 0) {
        context.executeAction("addCash", { args: { cash: queryResult.cost } }, () => {
          context.executeAction("landraise", args, () => {
            performRaise(remaining - 1);
          });
        });
      } else {
        performRaise(remaining - 1);
      }
    });
  }

  // Start lowering first
  performLower(lowerCount);
}




/**
 * Determines the height (z) of a surface tile within the exclusion zone.
 * @param exclusionZone List of coordinates in the exclusion zone.
 * @returns The baseHeight (z) of a surface tile in the exclusion zone, or null if none is found.
 */
function getHeightFromExclusionZone(exclusionZone: { x: number; y: number }[]): number | null {
  for (const { x, y } of exclusionZone) {
    const tile = map.getTile(x, y);
    for (const element of tile.elements) {
      if (element.type === "surface") {
        return (element as SurfaceElement).baseZ;
      }
    }
  }
  return null; // No valid surface tile found in the exclusion zone
}


/**
 * Splits the map into chunks of the specified size.
 * @param tilesX Total tiles in the X direction.
 * @param tilesY Total tiles in the Y direction.
 * @param chunkSize The size of each chunk in tiles.
 * @returns An array of chunks as { x1, y1, x2, y2 } objects.
 */
function createChunks(tilesX: number, tilesY: number, chunkSize: number): { x1: number; y1: number; x2: number; y2: number }[] {
  const chunks = [];
  for (let x = 1; x <= tilesX; x += chunkSize) {
    for (let y = 1; y <= tilesY; y += chunkSize) {
      chunks.push({
        x1: x,
        y1: y,
        x2: Math.min(x + chunkSize - 1, tilesX),
        y2: Math.min(y + chunkSize - 1, tilesY),
      });
    }
  }
  return chunks;
}


export function removeAllLitterAction() {
  return {
    name: "removeAllLitter",
    query: (event: GameActionEventArgs): GameActionResult => {
      return { error: 0 };
    },
    execute: (event: GameActionEventArgs): GameActionResult => {
      console.log("Removing all litter from the map...");

      const litters = map.getAllEntities("litter");
      for (const litter of litters) {
        litter.remove();
      }

      return { error: 0 };
    },
  };
}


export function setStorageAction() {
  return {
    name: "setStorage",
    query: (event: GameActionEventArgs<{ key: string; value: any }>): GameActionResult => {
      console.log("Querying action with event args:", event.args);
      return { error: 0 };
    },
    execute: (event: GameActionEventArgs<{ key: string; value: any }>): GameActionResult => {
      if (!event.args || event.args.key === undefined || event.args.value === undefined) {
        return { error: 1, errorMessage: "Key or value is missing." };
      }

      const parkStorage = context.getParkStorage();
      parkStorage.set(event.args.key, event.args.value);
      console.log(`Set storage key ${event.args.key} to: ${event.args.value}`);
      return { error: 0 };
    }
  };
}

/**
 * Registers all actions individually
 */
export function registerActions() {
  const seedAction = updateBoardSeedAction();
  context.registerAction(seedAction.name, seedAction.query, seedAction.execute);

  const dataAction = updateBoardDataAction();
  context.registerAction(dataAction.name, dataAction.query, dataAction.execute);

  const seedSetAction = setSeedAction();
  context.registerAction(seedSetAction.name, seedSetAction.query, seedSetAction.execute);

  const goalCompletionAction = setGoalCompletionAction();
  context.registerAction(goalCompletionAction.name, goalCompletionAction.query, goalCompletionAction.execute);

  const bingoAction = notifyBingoAction();
  context.registerAction(bingoAction.name, bingoAction.query, bingoAction.execute);

  const cashAction = addCashAction();
  context.registerAction(cashAction.name, cashAction.query, cashAction.execute);

  const moveAction = moveToAction();
  context.registerAction(moveAction.name, moveAction.query, moveAction.execute);

  const connectionAction = connectionDetailsAction();
  context.registerAction(connectionAction.name, connectionAction.query, connectionAction.execute);

  const clearAllTiles = clearAllTilesAction();
  context.registerAction(clearAllTiles.name, clearAllTiles.query, clearAllTiles.execute);

  const setCash = setCashAction();
  context.registerAction(setCash.name, setCash.query, setCash.execute);

  const inventAction = inventNextItemAction();
  context.registerAction(inventAction.name, inventAction.query, inventAction.execute);

  const resetResearch = resetResearchAction();
  context.registerAction(resetResearch.name, resetResearch.query, resetResearch.execute);

  const parkMessage = parkMessageAction();
  context.registerAction(parkMessage.name, parkMessage.query, parkMessage.execute);

  const networkMessage = networkMessageAction();
  context.registerAction(networkMessage.name, networkMessage.query, networkMessage.execute);

  const flatLand = flatAllLandAction();
  context.registerAction(flatLand.name, flatLand.query, flatLand.execute);

  const clearAllRides = clearAllRidesAction();
  context.registerAction(clearAllRides.name, clearAllRides.query, clearAllRides.execute);

  const removeAllLitter = removeAllLitterAction();
  context.registerAction(removeAllLitter.name, removeAllLitter.query, removeAllLitter.execute);

  const setStorage = setStorageAction();
  context.registerAction(setStorage.name, setStorage.query, setStorage.execute);

  console.log("Actions registered.");
}
