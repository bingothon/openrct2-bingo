import { addCashAction } from "./actions";
import { config } from "./config";
import { FOOT_PATH_LOCATIONS } from "./constants";
import { configureBoard } from "./ui-helpers";

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
    return parkStorage.get(`bingoSeed`, config.defaultSeed); // Default seed if not found
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
            if (queryResult.cost && queryResult.cost > 0) {
                context.executeAction('addCash', { args: { cash: queryResult.cost } }, (result) => {
                    if (result.error) {
                        console.log("Failed to add cash:", result.errorMessage);
                    } else {
                        console.log("Cash added successfully.");
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
                });

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
    // Step 2: Mark the section for sale if clearing succeeded
    const forSaleArgs = {
        x1,
        y1,
        x2,
        y2,
        setting: 2, // Set for sale
        ownership: 0, // No ownership
    };

    context.executeAction("landsetrights", clearArgs, (clearResult) => {
        if (clearResult.error) {
            console.log(`Failed to clear section ${section}: ${clearResult.errorMessage}`);
            if (clearResult.errorMessage === 'Land not for sale!')
                console.log('Land not for sale!, skipping')
            if (callback) {
                callback();
            }
        } else {
            console.log(`Successfully cleared section: ${section}`);
            context.executeAction("landsetrights", forSaleArgs, (saleResult) => {
                if (saleResult.error) {
                    console.log(`Failed to set section ${section} for sale: ${saleResult.errorMessage}`);
                    if (callback) {
                        callback();
                    }
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

export function clearMiddle(callback?: () => void) {
    const tileSize = 32;

    // Coordinates for the "BINGO" area
    const baseX = 53 * tileSize;
    const baseY = 63 * tileSize;
    const width = 24 * tileSize;
    const height = 5 * tileSize;

    // Define boundaries for clearing the area
    const x1 = baseX, y1 = baseY, x2 = baseX + width, y2 = baseY + height;

    console.log(`Clearing middle section: Coordinates (${x1}, ${y1}) to (${x2}, ${y2})`);

    // Action arguments to set the land to unowned
    const clearArgs = { x1, y1, x2, y2, setting: 0, ownership: 0 }; // Unown land

    // Execute the land clearing action
    context.executeAction("landsetrights", clearArgs, (clearResult) => {
        if (clearResult.error) {
            console.log(`Failed to clear middle section: ${clearResult.errorMessage}`);
            return;
        }

        console.log("Middle section successfully cleared and set to unowned.");

        // Execute the callback if provided
        if (callback) callback();
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

export function renewRides(callback?: () => void) {
    // Define the arguments for renewing rides
    const renewRidesArgs: CheatSetArgs = {
        type: 27, // Replace with the CheatType index for RenewRides (check the CheatType enum in OpenRCT2 source code)
        param1: 0, // Enable the action (if required by the cheat)
        param2: 0, // No secondary parameter
    };

    // Execute the renew rides action
    context.executeAction("cheatset", renewRidesArgs, (result) => {
        if (result.error) {
            console.log("Failed to renew rides:", result.errorMessage);
        } else {
            console.log("Rides successfully renewed.");

            // Proceed to the callback if provided
            if (callback) {
                callback();
            }
        }
    });
}

export function addRandomTrees(callback: Function) {
    const mapSize = map.size;
    const excludedTiles = [
        { x: 1, y: 30 },
        { x: 2, y: 30 },
        { x: 3, y: 29 },
        { x: 3, y: 30 },
        { x: 3, y: 31 }
    ];

    const treeObjects = objectManager.getAllObjects("small_scenery").filter((object) => object.name.toLowerCase().search("tree") !== -1).filter((object) => object.name.toLowerCase().search("snow") === -1);

    if (treeObjects.length === 0) {
        ui.showError("No Trees", "There are no tree objects available.");
        return;
    }

    for (let x = 1; x < mapSize.x - 1; x++) {
        for (let y = 1; y < mapSize.y - 1; y++) {
            // Randomly decide whether to place a tree
            if (Math.random() < 0.05) { // Adjust the probability as needed
                const randomTree = treeObjects[Math.floor(Math.random() * treeObjects.length)];
                const tile = map.getTile(x, y);

                if (!tile) continue;
                const isExcluded = excludedTiles.some(tile => tile.x === x && tile.y === y);
                if (isExcluded) {
                    console.log(`Skipping tile at (${x}, ${y}) as it is in the excluded list.`);
                    continue;
                }
                context.queryAction('smallsceneryplace', {
                    x: x * 32, // Convert tile to subunits
                    y: y * 32, // Convert tile to subunits
                    z: 0,
                    direction: 0,
                    object: randomTree.index,
                    quadrant: 0,
                    primaryColour: 0,
                    secondaryColour: 0,
                    tertiaryColour: 0,
                }, (result) => {
                    if (result.error) {
                        console.log(`Failed to place tree at (${x}, ${y}): ${result.errorMessage}`);
                    } else {
                        if (result.cost && result.cost > 0) {
                            context.executeAction('addCash', { args: { cash: result.cost } }, (result) => {
                                if (result.error) {
                                    console.log('Failed to add cash:', result.errorMessage);
                                }
                            });
                        }
                        context.executeAction('smallsceneryplace', {
                            x: x * 32, // Convert tile to subunits
                            y: y * 32, // Convert tile to subunits
                            z: 0,
                            direction: 0,
                            object: randomTree.index,
                            quadrant: 0,
                            primaryColour: 0,
                            secondaryColour: 0,
                            tertiaryColour: 0,

                        }, (result) => {
                            if (result.error) {
                                console.log(`Failed to place tree at (${x}, ${y}): ${result.errorMessage}`);
                            } else {
                                // console.log(`Placed tree at (${x}, ${y})`);
                            }
                        });
                    }
                });

            }
        }
    }
    if (callback) {
        callback();
    }
}

export function clearAllTiles(callback?: () => void) {
    context.executeAction('clearAllTiles', {}, (result) => {
        if (result.error) {
            console.log('Failed to clear all tiles:', result.errorMessage);
            if (callback) {
                callback();
            }
        } else {
            if (callback) {
                callback();
            }
            console.log('All tiles cleared.');
        }
    });

}

export function clearAllRides(callback?: () => void) {
    context.executeAction('clearAllRides', {}, (result) => {
        if (result.error) {
            console.log('Failed to clear all rides:', result.errorMessage);
            if (callback) {
                callback();
            }
        } else {
            if (callback) {
                callback();
            }
            console.log('All rides cleared.');
        }
    });
}

export function flatAllLand(callback?: () => void) {
    context.executeAction('flatAllLand', {}, (result) => {
        if (result.error) {
            console.log('Failed to flatten all land:', result.errorMessage);
        } else {
            if (callback) {
                callback();
            }
            console.log('All land flattened.');
        }
    });
}


export function adjustWaterHeight(targetZ: number, callback: () => void) {


    console.log("Starting to adjust water height in steps of 16...");

    const tiles = waterTiles();
    console.log(`Found ${tiles.length} water tiles.`);
    for (const tile of tiles) {
        const x = tile.x * 32;
        const y = tile.y * 32;


        // Check each element of the tile
        for (const element of tile.elements) {
            if (element.type === "surface") {
                const surfaceElement = element as SurfaceElement;
                const currentWaterHeight = surfaceElement.waterHeight;
                const offset = targetZ - currentWaterHeight;

                if (offset !== 0) {
                    // Calculate number of steps needed
                    const steps = Math.abs(Math.floor(offset / 16));
                    const action = offset > 0 ? "waterraise" : "waterlower";

                    for (let i = 0; i < steps; i++) {
                        context.queryAction(action, { x1: x, y1: y, x2: x, y2: y }, (result) => {
                            if (result.error) {
                                console.log(`Failed to adjust water height at (${x}, ${y}), step ${i + 1}/${steps}: ${result.errorMessage}`);
                            }
                            if (result.cost && result.cost > 0) {
                                context.executeAction('addCash', { args: { cash: result.cost } }, (result) => {
                                    context.executeAction(action, { x1: x, y1: y, x2: x, y2: y }, (result) => {
                                    });
                                });
                            }
                        });
                    }
                }
            }
        }
    }
    console.log("Water height adjustment complete.");
    if (callback) {
        callback();
    }
}

export function setFootPaths(callback: () => void) {
    FOOT_PATH_LOCATIONS.forEach((location) => {
        const footpathAction = {
            x: location.x * 32,
            y: location.y * 32,
            z: 112, // Fixed Z-coordinate
            direction: 0xFF, // Auto direction
            object: 0, // Default footpath object
            railingsObject: 0, // No railings
            slope: 0, // Flat footpath
            constructFlags: 0 // No special flags
        };
        context.queryAction("footpathplace", footpathAction, (result) => {
            if (result.cost && result.cost > 0) {
                context.executeAction('addCash', { args: { cash: result.cost } }, (result) => {
                    if (result.error) {
                        console.log('Failed to add cash:', result.errorMessage);
                    }
                    context.executeAction("footpathplace", footpathAction, (result) => {
                        if (result.error) {
                            console.log(`Failed to place footpath at (${footpathAction.x}, ${footpathAction.y}):`, result.error);
                        } else {
                            console.log(`Footpath placed at (${footpathAction.x}, ${footpathAction.y})`);
                        }
                    });
                });
            }


        });
    });
    if (callback) {
        callback();
    }
}





export function waterTiles(): Tile[] {
    let tiles = [];
    for (let x = 1; x < map.size.x - 1; x++) {
        for (let y = 1; y < map.size.y - 1; y++) {
            const tile = map.getTile(x, y);
            for (const element of tile.elements) {
                if (element.type === "surface" && (element as SurfaceElement).waterHeight !== 0) {
                    tiles.push(tile);
                }
            }
        }
    }
    tiles.forEach(tile => {
        console.log(`Water tile at (${tile.x}, ${tile.y}), height: ${(tile.elements[0] as SurfaceElement).waterHeight}`);
    });
    return tiles;
}


export function checkIfStarted(): boolean {
    const parkStorage = context.getParkStorage();
    const started = parkStorage.get('started', false);
    return started;
}

export function startGame(n: number): void {
    context.executeAction('setStorage', { args: { key: 'started', value: true } });
    context.executeAction('setStorage', { args: { key: 'duration', value: n } });
}


export function getRandomItemsByRideType(items: ResearchItem[]): ResearchItem[] {
    const rideTypeMap: { [key: number]: RideResearchItem[] } = {}; // Group RideResearchItems by rideType
    const uniqueItems: ResearchItem[] = [];

    // Separate and group RideResearchItems by rideType
    items.forEach((item) => {
        if (item.type === "ride" && item.category === "shop") {
            // Add all items in the "shop" category directly
            uniqueItems.push(item);
        } else if (item.type === "ride" && item.rideType !== undefined) {
            // Group RideResearchItems by rideType
            if (!rideTypeMap[item.rideType]) {
                rideTypeMap[item.rideType] = [];
            }
            rideTypeMap[item.rideType].push(item);
        } else if (item.type === "scenery") {
            // Add all SceneryResearchItems directly
            uniqueItems.push(item);
        }
    });

    // Randomly select one RideResearchItem per rideType
    for (const rideType in rideTypeMap) {
        const itemsForType = rideTypeMap[rideType];
        const randomIndex = Math.floor(Math.random() * itemsForType.length);
        uniqueItems.push(itemsForType[randomIndex]);
    }

    return uniqueItems;
}





