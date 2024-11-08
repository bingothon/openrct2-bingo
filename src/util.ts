import { config } from "./config";

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
 * Utility function to remove all objects from the map.
 * This function iterates through all tiles and removes objects, including scenery and rides.
 */
export function clearMap() {
    const mapSize = map.size; // Get the map size in tiles
    const tilesX = mapSize.x; // Total tiles in the X direction
    const tilesY = mapSize.y; // Total tiles in the Y direction

    console.log(`Clearing map of size ${tilesX}x${tilesY} tiles...`);

    for (let x = 0; x < tilesX; x++) {
        for (let y = 0; y < tilesY; y++) {
            const tile = map.getTile(x, y);

            tile.elements.forEach((element) => {
                switch (element.type) {
                    case "small_scenery":
                        context.executeAction(
                            "smallsceneryremove",
                            {
                                x: x * 32, // Convert tile to subunits
                                y: y * 32, // Convert tile to subunits
                                z: element.baseZ,
                                object: element.object,
                                quadrant: element.quadrant,
                            },
                            (result) => {
                                if (result.error) {
                                    console.log(
                                        `Failed to remove small scenery at (${x}, ${y}), z: ${element.baseZ} - ${result.errorMessage}`
                                    );
                                } else {
                                    console.log(
                                        `Removed small scenery at (${x}, ${y}), z: ${element.baseZ}`
                                    );
                                }
                            }
                        );
                        break;

                    case "large_scenery":
                        context.executeAction(
                            "largesceneryremove",
                            {
                                x: x * 32, // Convert tile to subunits
                                y: y * 32, // Convert tile to subunits
                                z: element.baseZ,
                                object: element.object,
                            },
                            (result) => {
                                if (result.error) {
                                    console.log(
                                        `Failed to remove large scenery at (${x}, ${y}), z: ${element.baseZ} - ${result.errorMessage}`
                                    );
                                } else {
                                    console.log(
                                        `Removed large scenery at (${x}, ${y}), z: ${element.baseZ}`
                                    );
                                }
                            }
                        );
                        break;

                    // Add cases for other object types as needed
                    default:
                        break;
                }
            });
        }
    }

    console.log("Map clearing process complete.");
}

export function ownMapSection(section: "top-left" | "top-right" | "bottom-left" | "bottom-right", callback?: () => void) {
    const mapSize = map.size; // Map dimensions in tiles
    console.log(`Map size: ${mapSize.x}x${mapSize.y} tiles`);
    const tileSize = 32; // Tile size in subunits

    // Calculate midpoints for splitting the map into quadrants
    const midX = Math.floor(mapSize.x / 2) * tileSize; // Midpoint in subunits
    const midY = Math.floor(mapSize.y / 2) * tileSize;

    // Determine boundaries for the specified quadrant
    let x1 = 0, y1 = 0, x2 = 0, y2 = 0;

    switch (section) {
        case "top-left":
            x1 = 0;
            y1 = 0;
            x2 = midX - 1; // Top-left ends at the midpoints
            y2 = midY - 1;
            break;
        case "top-right":
            x1 = midX;
            y1 = 0;
            x2 = mapSize.x * tileSize - 1; // Top-right starts at midX
            y2 = midY - 1;
            break;
        case "bottom-left":
            x1 = 0;
            y1 = midY;
            x2 = midX - 1; // Bottom-left ends at midX
            y2 = mapSize.y * tileSize - 1;
            break;
        case "bottom-right":
            x1 = midX;
            y1 = midY;
            x2 = mapSize.x * tileSize - 1; // Bottom-right starts at midX
            y2 = mapSize.y * tileSize - 1;
            break;
    }

    console.log(`Processing section: ${section}, Coordinates: (${x1}, ${y1}) to (${x2}, ${y2})`);

    // Query and execute land purchase for the specified section
    context.queryAction(
        "landbuyrights",
        {
            x1,
            y1,
            x2,
            y2,
            setting: 0, // 0: Buy land
        },
        (queryResult) => {
            if (queryResult.error === 0) {
                context.executeAction(
                    "landbuyrights",
                    {
                        x1,
                        y1,
                        x2,
                        y2,
                        setting: 0, // 0: Buy land
                    },
                    (executeResult) => {
                        if (executeResult.error === 0) {
                            console.log(`Successfully bought land for section: ${section}`);
                            if (callback) {
                                callback();
                            }
                        } else {
                            console.log(
                                `Failed to buy land for section: ${section} - ${executeResult.errorMessage}`
                            );
                        }
                    }
                );
            } else {
                console.log(
                    `Failed to query land for section: ${section} - ${queryResult.errorMessage}`
                );
            }
        }
    );
}


/**
 * Clear a map section (set to unowned) and then mark it for sale.
 */
export function clearAndSetForSale(
    section: "top-left" | "top-right" | "bottom-left" | "bottom-right" | "all",
    callback?: () => void
) {
    const mapSize = map.size;
    const tileSize = 32;

    // Calculate midpoints for splitting the map into quadrants
    const midX = Math.floor(mapSize.x / 2) * tileSize;
    const midY = Math.floor(mapSize.y / 2) * tileSize;

    // Determine boundaries for the specified section
    let x1 = 0,
        y1 = 0,
        x2 = mapSize.x * tileSize - 1,
        y2 = mapSize.y * tileSize - 1;

    switch (section) {
        case "top-left":
            x1 = 0;
            y1 = 0;
            x2 = midX - 1;
            y2 = midY - 1;
            break;
        case "top-right":
            x1 = midX;
            y1 = 0;
            x2 = mapSize.x * tileSize - 1;
            y2 = midY - 1;
            break;
        case "bottom-left":
            x1 = 0;
            y1 = midY;
            x2 = midX - 1;
            y2 = mapSize.y * tileSize - 1;
            break;
        case "bottom-right":
            x1 = midX;
            y1 = midY;
            x2 = mapSize.x * tileSize - 1;
            y2 = mapSize.y * tileSize - 1;
            break;
        case "all":
            // Default values already cover the full map
            break;
    }

    console.log(`Processing section: ${section}, Coordinates: (${x1}, ${y1}) to (${x2}, ${y2})`);

    // Step 1: Set the section to unowned (clear ownership)
    const clearArgs = {
        x1,
        y1,
        x2,
        y2,
        setting: 0, // Set to unowned
        ownership: 0, // Remove ownership
    };

    context.executeAction("landsetrights", clearArgs, (clearResult) => {
        if (clearResult.error) {
            console.log(`Failed to clear section ${section}: ${clearResult.errorMessage}`);
        } else {
            console.log(`Successfully cleared section: ${section}`);

            // Step 2: Mark the section for sale if clearing succeeded
            const forSaleArgs = {
                x1,
                y1,
                x2,
                y2,
                setting: 2, // Set for sale
                ownership: 0, // No ownership
            };

            context.executeAction("landsetrights", forSaleArgs, (saleResult) => {
                if (saleResult.error) {
                    console.log(`Failed to set section ${section} for sale: ${saleResult.errorMessage}`);
                } else {
                    console.log(`Successfully set section ${section} for sale.`);
                }

                // Execute the callback after completion
                if (callback) {
                    callback();
                }
            });
        }
    });
}




/**
 * Toggles sandbox mode and clearance checks with a single boolean, using a callback.
 */
export function debugMode(bool: 1 | 0, callback?: () => void) {
    // Define the arguments globally for sandbox mode and clearance checks
    const sandboxArgs: CheatSetArgs = {
        type: 0, // CheatType index for SandboxMode
        param1: bool, // Enable or disable based on `bool`
        param2: 0, // No secondary parameter
    };

    const clearanceArgs: CheatSetArgs = {
        type: 1, // CheatType index for DisableClearanceChecks
        param1: bool, // Enable or disable based on `bool`
        param2: 0, // No secondary parameter
    };

    // Toggle sandbox mode first
    context.executeAction("cheatset", sandboxArgs, (sandboxResult) => {
        if (sandboxResult.error) {
            console.log("Failed to toggle sandbox mode:", sandboxResult.errorMessage);
        } else {
            console.log(`Sandbox mode ${bool === 1 ? "enabled" : "disabled"}.`);
            
            // Then toggle clearance checks
            context.executeAction("cheatset", clearanceArgs, (clearanceResult) => {
                if (clearanceResult.error) {
                    console.log(
                        `Failed to ${bool === 1 ? "disable" : "enable"} clearance checks:`,
                        clearanceResult.errorMessage
                    );
                } else {
                    console.log(
                        `Clearance checks ${bool === 1 ? "disabled" : "enabled"}.`
                    );

                    // Proceed to the callback if provided
                    if (callback) {
                        callback();
                    }
                }
            });
        }
    });
}

