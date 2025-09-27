// Player sections for PVP mode - ground floor divisions
import { config } from "../../config";
import { debugMode } from "../../utils";

// Map division configuration for PVP player sections
const MAP_DIVISION_OBJECT = 'rct2.scenery_small.brbase'; // Base tile for ground borders

/**
 * Unowns the land along the dividing lines (center lines) where borders are placed
 */
function unownDividingLines(mapSize: any, scale: number, callback: () => void) {
    
    const centerX = (mapSize.x / 2) * scale;
    const centerY = (mapSize.y / 2) * scale;
    
    let completed = 0;
    const totalOperations = 2; // Vertical line + Horizontal line
    
    // Unown land along the vertical dividing line (center X) - using 1-based indexing
    context.executeAction("landsetrights", {
        x1: centerX,
        y1: 1 * scale, // Start at tile 1, not 0
        x2: centerX,
        y2: mapSize.y * scale,
        setting: 0, // 0: unown land
        ownership: 0 // not used for setting 0
    }, (result) => {
        if (result.error) {
            console.log(`Failed to unown vertical dividing line: ${result.errorMessage}`);
        }
        
        completed++;
        if (completed === totalOperations) {
            callback();
        }
    });
    
    // Unown land along the horizontal dividing line (center Y) - using 1-based indexing
    context.executeAction("landsetrights", {
        x1: 1 * scale, // Start at tile 1, not 0
        y1: centerY,
        x2: mapSize.x * scale,
        y2: centerY,
        setting: 0, // 0: unown land
        ownership: 0 // not used for setting 0
    }, (result) => {
        if (result.error) {
            console.log(`Failed to unown horizontal dividing line: ${result.errorMessage}`);
        }
        
        completed++;
        if (completed === totalOperations) {
            callback();
        }
    });
}

/**
 * Unowns the land in each player section to prevent building
 */
function unownPlayerSections(mapSize: any, scale: number, callback: () => void) {
    
    const cornerOffset = 5; // 5 tiles from the corner
    // const sectionSize = 10; // 10x10 tile area around each corner marker
    
    // Define the 4 player sections
    const sections = [
        // Player 1: Top-left
        { 
            name: "Player 1", 
            x1: cornerOffset - 5, 
            y1: cornerOffset - 5, 
            x2: cornerOffset + 5, 
            y2: cornerOffset + 5 
        },
        // Player 2: Top-right
        { 
            name: "Player 2", 
            x1: (mapSize.x - cornerOffset) - 5, 
            y1: cornerOffset - 5, 
            x2: (mapSize.x - cornerOffset) + 5, 
            y2: cornerOffset + 5 
        },
        // Player 3: Bottom-left
        { 
            name: "Player 3", 
            x1: cornerOffset - 5, 
            y1: (mapSize.y - cornerOffset) - 5, 
            x2: cornerOffset + 5, 
            y2: (mapSize.y - cornerOffset) + 5 
        },
        // Player 4: Bottom-right
        { 
            name: "Player 4", 
            x1: (mapSize.x - cornerOffset) - 5, 
            y1: (mapSize.y - cornerOffset) - 5, 
            x2: (mapSize.x - cornerOffset) + 5, 
            y2: (mapSize.y - cornerOffset) + 5 
        }
    ];
    
    let completed = 0;
    
    sections.forEach((section) => {
        // Convert tile coordinates to world coordinates
        const x1 = section.x1 * scale;
        const y1 = section.y1 * scale;
        const x2 = section.x2 * scale;
        const y2 = section.y2 * scale;
        
        
        // Unown the land using landsetrights action
        context.executeAction("landsetrights", {
            x1: x1,
            y1: y1,
            x2: x2,
            y2: y2,
            setting: 0, // 0: unown land
            ownership: 0 // not used for setting 0
        }, (result) => {
            if (result.error) {
                console.log(`Failed to unown land for ${section.name}: ${result.errorMessage}`);
            }
            
            completed++;
            if (completed === sections.length) {
                callback();
            }
        });
    });
}

/**
 * Places a corner marker for a player section
 */
function placePlayerCornerMarker(x: number, y: number, z: number, objectId: number, color: number, scale: number, callback?: () => void) {
    // Create a 3x3 colored square as a corner marker
    for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
            const markerX = x + (dx * scale);
            const markerY = y + (dy * scale);
            const markerZ = z;
            
            placeSceneryObject(markerX, markerY, markerZ, objectId, color);
        }
    }
    
    // Call the callback when done
    if (callback) callback();
}

/**
 * Places a single scenery object with cost handling
 */
function placeSceneryObject(x: number, y: number, z: number, objectId: number, color: number) {
    // Detect if a matching small scenery element exists at the exact location
    const tileX = Math.floor(x / 32);
    const tileY = Math.floor(y / 32);

    const inBounds = tileX >= 0 && tileX < map.size.x && tileY >= 0 && tileY < map.size.y;
    let hasMatchingScenery = false;

    if (inBounds) {
        const tile = map.getTile(tileX, tileY);
        
        for (const element of tile.elements) {
            if (
                element.type === 'small_scenery' &&
                element.baseZ === z &&
                (element as SmallSceneryElement).object === objectId
            ) {
                hasMatchingScenery = true;
                break;
            }
        }
    }

    // Only attempt to remove if there is actually a matching element
    const tryPlace = () => {
        const sceneryArgs = {
                x,
                y,
                z,
                direction: 0,
                object: objectId,
                quadrant: 0,
                primaryColour: color,
                secondaryColour: 0,
            tertiaryColour: 0,
        };

        context.queryAction('smallsceneryplace', sceneryArgs, (queryResult) => {
            if (queryResult.error) {
                // Suppress "Land not owned by park!" errors to reduce log spam
                if (
                    queryResult.errorMessage &&
                    queryResult.errorMessage.indexOf('Land not owned by park') !== -1
                ) {
                    console.log('Land not owned by park - scenery placement failed');
                } else {
                    console.log(
                        `Failed to query scenery placement at (${x}, ${y}), z: ${z} - ${queryResult.errorMessage}`,
                    );
                }
                return;
            }
            if (queryResult.cost && queryResult.cost > 0) {
                context.executeAction(
                    'addCash',
                    { args: { cash: queryResult.cost } },
                    (cashResult) => {
                        if (cashResult.error) {
                            console.log(
                                'Failed to add cash for scenery placement:',
                                cashResult.errorMessage,
                            );
                            return;
                        }
                        context.executeAction('smallsceneryplace', sceneryArgs, (placeResult) => {
                            if (placeResult.error) {
                                console.log(
                                    `Failed to place scenery at (${x}, ${y}), z: ${z} - ${placeResult.errorMessage}`,
                                );
                            }
                        });
                    },
                );
            } else {
                context.executeAction('smallsceneryplace', sceneryArgs, (placeResult) => {
                    if (placeResult.error) {
                        console.log(
                            `Failed to place scenery at (${x}, ${y}), z: ${z} - ${placeResult.errorMessage}`,
                        );
                    }
                });
            }
        });
    };

    if (hasMatchingScenery) {
        const removeAction = { x, y, z, object: objectId, quadrant: 0 };
        context.executeAction('smallsceneryremove', removeAction, () => {
            // Ignore remove errors; we verified presence already to avoid spam logs
            tryPlace();
        });
    } else {
        tryPlace();
    }
}

/**
 * Creates 4 player sections on the ground by dividing the map into quarters
 * Uses base tiles to create borders between sections
 */
export function createPlayerSections(callback: () => void): void {
    console.log("Creating 4 player sections on the ground...");
    
    try {
        const mapSize = { x: map.size.x, y: map.size.y };
        
        // Load the base tile object
        const identifier = MAP_DIVISION_OBJECT;
        const loadedObject = objectManager.load(identifier);
        
        if (!loadedObject) {
            console.log("Failed to load base tile object:", identifier);
            callback();
            return;
        }
        
        const objectId = loadedObject.index;
        const scale = 32;
        const baseZ = 0; // Ground level
        
        // Calculate the center of the map for dividing into 4 sections
        const centerX = (mapSize.x / 2) * scale;
        const centerY = (mapSize.y / 2) * scale;
        
        
        // Create borders to divide the map into 4 sections
        // Vertical line (divides left and right) - using 0-based indexing
        for (let y = 0; y < mapSize.y; y++) {
            const borderX = centerX;
            const borderY = y * scale;
            const borderZ = baseZ;
            
            
            // Place base tile for vertical border
            placeSceneryObject(borderX, borderY, borderZ, objectId, 0); // Black border
        }
        
        // Horizontal line (divides top and bottom) - using 0-based indexing
        for (let x = 0; x < mapSize.x; x++) {
            const borderX = x * scale;
            const borderY = centerY;
            const borderZ = baseZ;
            
            
            // Place base tile for horizontal border
            placeSceneryObject(borderX, borderY, borderZ, objectId, 0); // Black border
        }
        
        // Enable debug mode to allow land ownership changes
        debugMode(1, () => {
            
            // Add corner markers for each player section
            const cornerOffset = 5; // 5 tiles from the corner
            
            const player1X = cornerOffset * scale;
            const player1Y = cornerOffset * scale;
            placePlayerCornerMarker(player1X, player1Y, baseZ, objectId, config.playerColors.player1, scale, () => {
                const player2X = (mapSize.x - cornerOffset) * scale;
                const player2Y = cornerOffset * scale;
                placePlayerCornerMarker(player2X, player2Y, baseZ, objectId, config.playerColors.player2, scale, () => {
                    const player3X = cornerOffset * scale;
                    const player3Y = (mapSize.y - cornerOffset) * scale;
                    placePlayerCornerMarker(player3X, player3Y, baseZ, objectId, config.playerColors.player3, scale, () => {
                        const player4X = (mapSize.x - cornerOffset) * scale;
                        const player4Y = (mapSize.y - cornerOffset) * scale;
                        placePlayerCornerMarker(player4X, player4Y, baseZ, objectId, config.playerColors.player4, scale, () => {
                            
                            // Unown the land along the dividing lines first
                            unownDividingLines(mapSize, scale, () => {
                                // Then unown the land in each player section
                                unownPlayerSections(mapSize, scale, () => {
                                    // Create entrances for each player section (except RED) - still in debug mode
                                    createPlayerEntrancesAndFootpaths(mapSize, scale, () => {
                                        // Create guest spawners for each player section - still in debug mode
                                        createGuestSpawners(mapSize, scale, () => {
                                            // Disable debug mode after everything is done
                                            debugMode(0, () => {
                                                console.log("Player sections created successfully!");
                                                callback();
                                            });
                                        });
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
        
    } catch (error) {
        console.log("Error creating player sections:", error);
        callback();
    }
}


/**
 * Creates park entrances for each player section (except RED)
 */
function createPlayerEntrancesAndFootpaths(_mapSize: any, scale: number, callback: () => void) {
    console.log("Creating park entrances for player sections...");
    
    // Load the park entrance object using the traditional entrance
    const entranceObject = objectManager.load("rct2.park_entrance.pkent1");
    if (!entranceObject) {
        console.log("Failed to load traditional park entrance object");
        callback();
        return;
    }
    
    // Load footpath surface object for the entrance
    const footpathObject = objectManager.load("rct2.footpath_surface.ash");
    if (!footpathObject) {
        console.log("Failed to load tarmac footpath surface object");
        callback();
        return;
    }
    
    
    // Static tiles to unown
    const tilesToUnown = [
        // Entrance 1 area
        {x: 1, y: 99}, 
        {x: 2, y: 99}, 
        {x: 2, y: 100}, 
        {x: 2, y: 98}, 
        {x: 3, y: 98}, 
        {x: 3, y: 99}, 
        {x: 3, y: 100},

        // Entrance 2 area  
        {x: 128, y: 99}, 
        {x: 127, y: 99}, 
        {x: 127, y: 98}, 
        {x: 127, y: 100}, 
        {x: 126, y: 100}, 
        {x: 126, y: 99}, 
        {x: 126, y: 98},

        // Entrance 3 area
        {x: 128, y: 30}, 
        {x: 127, y: 30}, 
        {x: 127, y: 31}, 
        {x: 127, y: 29}, 
        {x: 126, y: 31}, 
        {x: 126, y: 30}, 
        {x: 126, y: 29}
    ];
    
    // Static footpath tiles (ONLY leading footpaths - NO entrance tile footpaths)
    const footpathTiles = [
        // Leading footpaths only - let entrance handle its own footpath surfaces
        {x: 128, y: 30}, {x: 127, y: 30}, // Entrance 3 leading footpaths
        {x: 128, y: 99}, {x: 127, y: 99}, // Entrance 2 leading footpaths  
        {x: 1, y: 99}, {x: 2, y: 99},      // Entrance 1 leading footpaths
        {x: 3, y: 99}, // Entrance 1 center tile
        {x: 126, y: 99}, // Entrance 2 center tile
        {x: 126, y: 30}, // Entrance 3 center tile
    ];
    
    // Static entrance definitions
    const entrances = [
        {
            name: "Entrance 1",
            tiles: [{x: 3, y: 100}, {x: 3, y: 99}, {x: 3, y: 98}],
            rotation: 2,
            z: 112 // Default Z level
        },
        {
            name: "Entrance 2", 
            tiles: [{x: 126, y: 98}, {x: 126, y: 99}, {x: 126, y: 100}],
            rotation: 0,
            z: 112
        },
        {
            name: "Entrance 3",
            tiles: [{x: 126, y: 29}, {x: 126, y: 30}, {x: 126, y: 31}],
            rotation: 0,
            z: 112
        }
    ];
    
    let unownCompleted = 0;
    const totalTiles = tilesToUnown.length;
    
    if (totalTiles === 0) {
        placeEntrancesAndFootpaths();
    } else {
        tilesToUnown.forEach((tile) => {
            context.executeAction("landsetrights", {
                x1: tile.x * scale,
                y1: tile.y * scale,
                x2: tile.x * scale,
                y2: tile.y * scale,
                setting: 0, // 0: unown land
                ownership: 0
            }, (unownResult) => {
                unownCompleted++;
                if (unownResult.error) {
                    console.log(`Failed to unown tile (${tile.x}, ${tile.y}): ${unownResult.errorMessage}`);
                }
                
                if (unownCompleted === totalTiles) {
                    placeEntrancesAndFootpaths();
                }
            });
        });
    }
    
    function placeEntrancesAndFootpaths() {
        let entranceCompleted = 0;
        const totalEntrances = entrances.length;
        
        entrances.forEach((entrance) => {
            // Place entrance at the center tile (middle of the 3-tile line)
            const centerTile = entrance.tiles[1]; // Middle tile
            
            
            context.executeAction("parkentranceplace", {
                x: centerTile.x * scale,
                y: centerTile.y * scale,
                z: entrance.z,
                direction: entrance.rotation,
                footpathSurfaceObject: footpathObject!.index,
                entranceObject: entranceObject!.index,
                footpathTypeIsLegacy: false
            }, (entranceResult) => {
                entranceCompleted++;
                if (entranceResult.error) {
                    console.log(`Failed to place ${entrance.name}: ${entranceResult.errorMessage}`);
                } else {
                    console.log(`Successfully placed ${entrance.name}`);
                }
                
                if (entranceCompleted === totalEntrances) {
                    // Place footpaths AFTER entrances
                    let footpathCompleted = 0;
                    const totalFootpaths = footpathTiles.length;
                    
                    footpathTiles.forEach((tile) => {
                        context.executeAction("footpathplace", {
                            x: tile.x * scale,
                            y: tile.y * scale,
                            z: 112, // Default Z level
                            direction: 0, // Default direction
                            object: footpathObject!.index,
                            railingsObject: 0,
                            slope: 0,
                            constructFlags: 0,
                            flags: 0
                        }, (footpathResult) => {
                            footpathCompleted++;
                            if (footpathResult.error) {
                                console.log(`Failed to place footpath at (${tile.x}, ${tile.y}): ${footpathResult.errorMessage}`);
                            }
                            
                            if (footpathCompleted === totalFootpaths) {
                                callback();
                            }
                        });
                    });
                }
            });
        });
    }
    
}

/**
 * Creates guest spawners for each player section
 */
function createGuestSpawners(_mapSize: any, scale: number, callback: () => void) {
    console.log("Creating guest spawners for player sections...");
    
    // Define spawner positions for each player section
    const spawners = [
        {
            name: "Player 2 Spawner (GREEN)",
            x: 1,
            y: 99,
            z: 112,
            direction: 3 // Facing east
        },
        {
            name: "Player 3 Spawner (YELLOW)", 
            x: 128,
            y: 30,
            z: 112,
            direction: 1 // Facing west
        },
        {
            name: "Player 4 Spawner (BLUE)",
            x: 128,
            y: 99,
            z: 112,
            direction: 1 // Facing west
        }
    ];
    
    let spawnerCompleted = 0;
    const totalSpawners = spawners.length;
    
    spawners.forEach((spawner) => {
        
        context.executeAction("peepspawnplace", {
            x: spawner.x * scale,
            y: spawner.y * scale,
            z: spawner.z,
            direction: spawner.direction
        }, (spawnerResult) => {
            spawnerCompleted++;
            if (spawnerResult.error) {
                console.log(`Failed to place ${spawner.name}: ${spawnerResult.errorMessage}`);
            }
            
            if (spawnerCompleted === totalSpawners) {
                callback();
            }
        });
    });
}
