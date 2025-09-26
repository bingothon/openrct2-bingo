// Player sections for PVP mode - ground floor divisions
import { config } from "../../config";
import { debugMode } from "../../utils";

// Map division configuration for PVP player sections
const MAP_DIVISION_OBJECT = 'rct2.scenery_small.brbase'; // Base tile for ground borders

/**
 * Unowns the land along the dividing lines (center lines) where borders are placed
 */
function unownDividingLines(mapSize: any, scale: number, callback: () => void) {
    console.log("Unowning land along dividing lines...");
    
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
        } else {
            console.log("Successfully unowned vertical dividing line");
        }
        
        completed++;
        if (completed === totalOperations) {
            console.log("All dividing lines unowned successfully!");
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
        } else {
            console.log("Successfully unowned horizontal dividing line");
        }
        
        completed++;
        if (completed === totalOperations) {
            console.log("All dividing lines unowned successfully!");
            callback();
        }
    });
}

/**
 * Unowns the land in each player section to prevent building
 */
function unownPlayerSections(mapSize: any, scale: number, callback: () => void) {
    console.log("Unowning land in player sections...");
    
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
        
        console.log(`Unowning land for ${section.name}: (${x1}, ${y1}) to (${x2}, ${y2})`);
        
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
            } else {
                console.log(`Successfully unowned land for ${section.name}`);
            }
            
            completed++;
            if (completed === sections.length) {
                console.log("All player sections unowned successfully!");
                callback();
            }
        });
    });
}

/**
 * Places a corner marker for a player section
 */
function placePlayerCornerMarker(x: number, y: number, z: number, objectId: number, color: number, scale: number) {
    // Create a 3x3 colored square as a corner marker
    for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
            const markerX = x + (dx * scale);
            const markerY = y + (dy * scale);
            const markerZ = z;
            
            placeSceneryObject(markerX, markerY, markerZ, objectId, color);
        }
    }
}

/**
 * Places a single scenery object with cost handling
 */
function placeSceneryObject(x: number, y: number, z: number, objectId: number, color: number) {
    // Detect if a matching small scenery element exists at the exact location
    const tileX = Math.floor(x / 32);
    const tileY = Math.floor(y / 32);

    // Special debug logging for tile (64, 128)
    if (tileX === 64 && tileY === 128) {
        console.log(`🔍 DEBUG: placeSceneryObject called for tile (64, 128)`);
        console.log(`   Input coords: (${x}, ${y}, ${z})`);
        console.log(`   Tile coords: (${tileX}, ${tileY})`);
        console.log(`   Object ID: ${objectId}`);
        console.log(`   Color: ${color}`);
    }

    const inBounds = tileX >= 0 && tileX < map.size.x && tileY >= 0 && tileY < map.size.y;
    let hasMatchingScenery = false;

    if (inBounds) {
        const tile = map.getTile(tileX, tileY);
        
        // Special debug logging for tile (64, 128)
        if (tileX === 64 && tileY === 128) {
            console.log(`🔍 DEBUG: Tile (64, 128) has ${tile.elements.length} elements`);
            tile.elements.forEach((element, index) => {
                console.log(`   Element ${index}: ${element.type} at z=${element.baseZ}`);
                if (element.type === 'small_scenery') {
                    const scenery = element as SmallSceneryElement;
                    console.log(`     - Object: ${scenery.object}, Quadrant: ${scenery.quadrant}`);
                }
            });
        }
        
        for (const element of tile.elements) {
            if (
                element.type === 'small_scenery' &&
                element.baseZ === z &&
                (element as SmallSceneryElement).object === objectId
            ) {
                hasMatchingScenery = true;
                if (tileX === 64 && tileY === 128) {
                    console.log(`🔍 DEBUG: Found matching scenery at tile (64, 128)`);
                }
                break;
            }
        }
    } else {
        if (tileX === 64 && tileY === 128) {
            console.log(`🔍 DEBUG: Tile (64, 128) is out of bounds!`);
            console.log(`   Map size: ${map.size.x} x ${map.size.y}`);
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
            // Special debug logging for tile (64, 128)
            if (tileX === 64 && tileY === 128) {
                console.log(`🔍 DEBUG: Query result for tile (64, 128):`);
                console.log(`   Error: ${queryResult.error}`);
                console.log(`   Error Message: ${queryResult.errorMessage}`);
                console.log(`   Cost: ${queryResult.cost}`);
            }
            
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
                            // Special debug logging for tile (64, 128)
                            if (tileX === 64 && tileY === 128) {
                                console.log(`🔍 DEBUG: Final placement result for tile (64, 128):`);
                                console.log(`   Error: ${placeResult.error}`);
                                console.log(`   Error Message: ${placeResult.errorMessage}`);
                                console.log(`   Success: ${!placeResult.error}`);
                            }
                            
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
                    // Special debug logging for tile (64, 128)
                    if (tileX === 64 && tileY === 128) {
                        console.log(`🔍 DEBUG: No-cost placement result for tile (64, 128):`);
                        console.log(`   Error: ${placeResult.error}`);
                        console.log(`   Error Message: ${placeResult.errorMessage}`);
                        console.log(`   Success: ${!placeResult.error}`);
                    }
                    
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
        // Special debug logging for tile (64, 128)
        if (tileX === 64 && tileY === 128) {
            console.log(`🔍 DEBUG: Removing existing scenery at tile (64, 128) before placing new one`);
        }
        
        const removeAction = { x, y, z, object: objectId, quadrant: 0 };
        context.executeAction('smallsceneryremove', removeAction, () => {
            // Ignore remove errors; we verified presence already to avoid spam logs
            tryPlace();
        });
    } else {
        // Special debug logging for tile (64, 128)
        if (tileX === 64 && tileY === 128) {
            console.log(`🔍 DEBUG: No existing scenery found at tile (64, 128), proceeding with placement`);
        }
        tryPlace();
    }
}

/**
 * Creates 4 player sections on the ground by dividing the map into quarters
 * Uses base tiles to create borders between sections
 */
export function createPlayerSections(): boolean {
    console.log("Creating 4 player sections on the ground...");
    
    try {
        const mapSize = { x: 128, y: 128 };
        
        // Load the base tile object
        const identifier = MAP_DIVISION_OBJECT;
        const loadedObject = objectManager.load(identifier);
        
        if (!loadedObject) {
            console.log("Failed to load base tile object:", identifier);
            return false;
        }
        console.log("Base tile object loaded successfully, index:", loadedObject.index);
        
        const objectId = loadedObject.index;
        const scale = 32;
        const baseZ = 0; // Ground level
        
        // Calculate the center of the map for dividing into 4 sections
        const centerX = (mapSize.x / 2) * scale;
        const centerY = (mapSize.y / 2) * scale;
        
        console.log("Map center:", { centerX, centerY });
        
        // Create borders to divide the map into 4 sections
        // Vertical line (divides left and right) - using 1-based indexing
        console.log(`Creating vertical border at x=${centerX} (tile ${centerX/32}) from y=1 to y=${mapSize.y}`);
        for (let y = 1; y <= mapSize.y; y++) {
            const borderX = centerX;
            const borderY = y * scale;
            const borderZ = baseZ;
            
            // Special debug logging for tile (64, 128)
            if (borderX / 32 === 64 && y === 128) {
                console.log(`🔍 DEBUG: Attempting to place border at tile (64, 128)`);
                console.log(`   World coords: (${borderX}, ${borderY})`);
                console.log(`   Object ID: ${objectId}`);
                console.log(`   Color: 0 (black)`);
            }
            
            // Place base tile for vertical border
            placeSceneryObject(borderX, borderY, borderZ, objectId, 0); // Black border
        }
        
        // Horizontal line (divides top and bottom) - using 1-based indexing
        console.log(`Creating horizontal border at y=${centerY} (tile ${centerY/32}) from x=1 to x=${mapSize.x}`);
        for (let x = 1; x <= mapSize.x; x++) {
            const borderX = x * scale;
            const borderY = centerY;
            const borderZ = baseZ;
            
            // Special debug logging for tile (64, 128)
            if (x === 64 && borderY / 32 === 64) {
                console.log(`🔍 DEBUG: Attempting to place border at tile (64, 64) - center intersection`);
                console.log(`   World coords: (${borderX}, ${borderY})`);
                console.log(`   Object ID: ${objectId}`);
                console.log(`   Color: 0 (black)`);
            }
            
            // Place base tile for horizontal border
            placeSceneryObject(borderX, borderY, borderZ, objectId, 0); // Black border
        }
        
        // Enable debug mode to allow land ownership changes
        console.log("Enabling debug mode for land ownership changes...");
        debugMode(1, () => {
            console.log("Debug mode enabled successfully");
            
            // Add corner markers for each player section
            const cornerOffset = 5; // 5 tiles from the corner
            
            // Player 1: Top-left corner
            const player1X = cornerOffset * scale;
            const player1Y = cornerOffset * scale;
            placePlayerCornerMarker(player1X, player1Y, baseZ, objectId, config.playerColors.player1, scale);
            
            // Player 2: Top-right corner
            const player2X = (mapSize.x - cornerOffset) * scale;
            const player2Y = cornerOffset * scale;
            placePlayerCornerMarker(player2X, player2Y, baseZ, objectId, config.playerColors.player2, scale);
            
            // Player 3: Bottom-left corner
            const player3X = cornerOffset * scale;
            const player3Y = (mapSize.y - cornerOffset) * scale;
            placePlayerCornerMarker(player3X, player3Y, baseZ, objectId, config.playerColors.player3, scale);
            
            // Player 4: Bottom-right corner
            const player4X = (mapSize.x - cornerOffset) * scale;
            const player4Y = (mapSize.y - cornerOffset) * scale;
            placePlayerCornerMarker(player4X, player4Y, baseZ, objectId, config.playerColors.player4, scale);
            
            console.log("Colored markers placed, now unowning land...");
            
            // Unown the land along the dividing lines first
            unownDividingLines(mapSize, scale, () => {
                // Then unown the land in each player section
                unownPlayerSections(mapSize, scale, () => {
                    // Create entrances for each player section (except RED) - still in debug mode
                    createPlayerEntrancesAndFootpaths(mapSize, scale, () => {
                        // Create guest spawners for each player section - still in debug mode
                        createGuestSpawners(mapSize, scale, () => {
                            // Disable debug mode after everything is done
                            console.log("Disabling debug mode...");
                            debugMode(0, () => {
                                console.log("Debug mode disabled successfully");
                                console.log("Player sections, entrances, and guest spawners created successfully!");
                            });
                        });
                    });
                });
            });
        });
        
        return true;
        
    } catch (error) {
        console.log("Error creating player sections:", error);
        return false;
    }
}


/**
 * Creates park entrances for each player section (except RED)
 */
function createPlayerEntrancesAndFootpaths(mapSize: any, scale: number, callback: () => void) {
    console.log("=== ENTRANCE CREATION STARTED ===");
    console.log("Creating park entrances for player sections...");
    console.log("Function called with mapSize:", mapSize, "scale:", scale);
    
    // Load the park entrance object using the traditional entrance
    console.log("Loading traditional park entrance object...");
    const entranceObject = objectManager.load("rct2.park_entrance.pkent1");
    if (!entranceObject) {
        console.log("Failed to load traditional park entrance object");
        callback();
        return;
    }
    
    // Load footpath surface object for the entrance
    console.log("Loading ashphalt footpath surface object...");
    const footpathObject = objectManager.load("rct2.footpath_surface.ash");
    if (!footpathObject) {
        console.log("Failed to load tarmac footpath surface object");
        callback();
        return;
    }
    
    console.log(`Loaded entrance object at index: ${entranceObject.index}`);
    console.log(`Loaded footpath object at index: ${footpathObject.index}`);
    console.log("Objects loaded successfully, proceeding with entrance creation...");
    
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
    
    console.log("Unowning land tiles...");
    let unownCompleted = 0;
    const totalTiles = tilesToUnown.length;
    
    if (totalTiles === 0) {
        console.log("No tiles to unown, proceeding directly to entrance and footpath placement...");
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
                } else {
                    console.log(`Successfully unowned tile (${tile.x}, ${tile.y})`);
                }
                
                if (unownCompleted === totalTiles) {
                    console.log("All tiles unowned, proceeding to entrance and footpath placement...");
                    placeEntrancesAndFootpaths();
                }
            });
        });
    }
    
    function placeEntrancesAndFootpaths() {
        console.log("Placing entrances FIRST...");
        let entranceCompleted = 0;
        const totalEntrances = entrances.length;
        
        entrances.forEach((entrance) => {
            // Place entrance at the center tile (middle of the 3-tile line)
            const centerTile = entrance.tiles[1]; // Middle tile
            
            console.log(`🔍 About to place ${entrance.name} at (${centerTile.x}, ${centerTile.y})`);
            console.log(`🔍 All tiles for ${entrance.name}:`, entrance.tiles);
            console.log(`🔍 Center tile (index 1):`, centerTile);
            console.log(`🔍 World coordinates: (${centerTile.x * scale}, ${centerTile.y * scale})`);
            console.log(`🔍 Scale: ${scale}`);
            // console.log(`🔍 Sandbox mode should be enabled: ${context.cheats.sandboxMode}`);
            
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
                    console.log(`❌ FAILED to place ${entrance.name}: ${entranceResult.errorMessage}`);
                } else {
                    console.log(`✅ Successfully placed ${entrance.name}`);
                    console.log(`🔍 Entrance placement result:`, entranceResult);
                    console.log(`🔍 Expected coordinates: (${centerTile.x}, ${centerTile.y})`);
                    console.log(`🔍 World coordinates sent: (${centerTile.x * scale}, ${centerTile.y * scale})`);
                }
                
                if (entranceCompleted === totalEntrances) {
                    console.log("All entrances placed, now placing footpaths...");
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
                                console.log(`❌ FAILED to place footpath at (${tile.x}, ${tile.y}): ${footpathResult.errorMessage}`);
                            } else {
                                console.log(`✅ Successfully placed footpath at (${tile.x}, ${tile.y})`);
                            }
                            
                            if (footpathCompleted === totalFootpaths) {
                                console.log("All footpaths placed successfully!");
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
    console.log("=== GUEST SPAWNER CREATION STARTED ===");
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
    
    console.log("Placing guest spawners...");
    let spawnerCompleted = 0;
    const totalSpawners = spawners.length;
    
    spawners.forEach((spawner) => {
        console.log(`Placing ${spawner.name} at (${spawner.x}, ${spawner.y}, ${spawner.z})`);
        
        context.executeAction("peepspawnplace", {
            x: spawner.x * scale,
            y: spawner.y * scale,
            z: spawner.z,
            direction: spawner.direction
        }, (spawnerResult) => {
            spawnerCompleted++;
            if (spawnerResult.error) {
                console.log(`❌ FAILED to place ${spawner.name}: ${spawnerResult.errorMessage}`);
            } else {
                console.log(`✅ Successfully placed ${spawner.name}`);
            }
            
            if (spawnerCompleted === totalSpawners) {
                console.log("All guest spawners created successfully!");
                callback();
            }
        });
    });
}
