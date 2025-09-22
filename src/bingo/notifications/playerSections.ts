// Player sections for PVP mode - ground floor divisions
import { config } from "../../config";
import { debugMode } from "../../util";

// Map division configuration for PVP player sections
const MAP_DIVISION_OBJECT = 'rct2.scenery_small.brbase'; // Base tile for ground borders

/**
 * Unowns the land in each player section to prevent building
 */
function unownPlayerSections(mapSize: any, scale: number, callback: () => void) {
    console.log("Unowning land in player sections...");
    
    const cornerOffset = 5; // 5 tiles from the corner
    const sectionSize = 10; // 10x10 tile area around each corner marker
    
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
    // Place the scenery directly without trying to remove first
    const sceneryArgs = {
        x: x,
        y: y,
        z: z,
        direction: 0,
        object: objectId,
        quadrant: 0,
        primaryColour: color,
        secondaryColour: 0,
        tertiaryColour: 0
    };
    
    // Query the action to check cost
    context.queryAction("smallsceneryplace", sceneryArgs, (queryResult) => {
        if (queryResult.cost && queryResult.cost > 0) {
            // Add cash to cover the cost
            context.executeAction('addCash', { args: { cash: queryResult.cost } }, (cashResult) => {
                if (cashResult.error) {
                    console.log("Failed to add cash for scenery placement:", cashResult.errorMessage);
                } else {
                    // Execute the scenery placement
                    context.executeAction("smallsceneryplace", sceneryArgs, (result) => {
                        if (result.error) {
                            console.log(`Failed to place scenery at (${x}, ${y}, ${z}): ${result.errorMessage}`);
                        }
                    });
                }
            });
        } else {
            // No cost, execute directly
            context.executeAction("smallsceneryplace", sceneryArgs, (result) => {
                if (result.error) {
                    console.log(`Failed to place scenery at (${x}, ${y}, ${z}): ${result.errorMessage}`);
                }
            });
        }
    });
}

/**
 * Creates 4 player sections on the ground by dividing the map into quarters
 * Uses base tiles to create borders between sections
 */
export function createPlayerSections(): boolean {
    console.log("Creating 4 player sections on the ground...");
    
    try {
        const mapSize = { x: 128, y: 128 };
        console.log("Map size:", mapSize);
        
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
        // Vertical line (divides left and right)
        for (let y = 0; y < mapSize.y; y++) {
            const borderX = centerX;
            const borderY = y * scale;
            const borderZ = baseZ;
            
            // Place base tile for vertical border
            placeSceneryObject(borderX, borderY, borderZ, objectId, 0); // Black border
        }
        
        // Horizontal line (divides top and bottom)
        for (let x = 0; x < mapSize.x; x++) {
            const borderX = x * scale;
            const borderY = centerY;
            const borderZ = baseZ;
            
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
            
            // Unown the land in each player section
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
        
        return true;
        
    } catch (error) {
        console.log("Error creating player sections:", error);
        return false;
    }
}

/**
 * Finds the existing park entrance and logs its position
 */
function findExistingEntrance(mapSize: any, scale: number) {
    console.log("=== SEARCHING FOR EXISTING ENTRANCE ===");
    console.log(`Map size: ${mapSize.x} x ${mapSize.y}`);
    console.log("Searching for existing park entrance...");
    
    let tilesChecked = 0;
    
    // Search through the map to find the existing entrance
    for (let x = 1; x <= mapSize.x; x++) {
        for (let y = 1; y <= mapSize.y; y++) {
            tilesChecked++;
            const tile = map.getTile(x, y);
            if (tile) {
                for (let i = 0; i < tile.numElements; i++) {
                    const element = tile.getElement(i);
                    if (element && element.type === "entrance") {
                        console.log(`Found existing entrance at tile (${x}, ${y})`);
                        console.log(`Entrance coordinates: x=${x * scale}, y=${y * scale}, z=${element.baseZ}`);
                        console.log(`Entrance direction: ${element.direction}`);
                        return {
                            x: x * scale,
                            y: y * scale,
                            z: element.baseZ,
                            direction: element.direction,
                            tileX: x,
                            tileY: y
                        };
                    }
                }
            }
        }
    }
    
    console.log(`Checked ${tilesChecked} tiles, no existing entrance found`);
    return null;
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
function createGuestSpawners(mapSize: any, scale: number, callback: () => void) {
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
