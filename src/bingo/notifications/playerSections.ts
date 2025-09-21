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
        const mapSize = map.size;
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
                createPlayerEntrances(mapSize, scale, () => {
                    // Disable debug mode after everything is done
                    console.log("Disabling debug mode...");
                    debugMode(0, () => {
                        console.log("Debug mode disabled successfully");
                        console.log("Player sections and entrances created successfully!");
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
function createPlayerEntrances(mapSize: any, scale: number, callback: () => void) {
    console.log("=== ENTRANCE CREATION STARTED ===");
    console.log("Creating park entrances for player sections...");
    console.log("Debug mode status - Sandbox:", cheats.sandboxMode, "Clearance checks disabled:", !cheats.disableClearanceChecks);
    
    // First, find the existing entrance
    console.log("About to call findExistingEntrance...");
    const existingEntrance = findExistingEntrance(mapSize, scale);
    console.log("findExistingEntrance returned:", existingEntrance);
    
    if (!existingEntrance) {
        console.log("No existing entrance found, cannot create mirrored entrances");
        callback();
        return;
    }
    
    // Load the park entrance object using the traditional entrance
    console.log("Loading traditional park entrance object...");
    const entranceObject = objectManager.load("rct2.park_entrance.pkent1");
    if (!entranceObject) {
        console.log("Failed to load traditional park entrance object");
        callback();
        return;
    }
    
    // Load footpath surface object for the entrance
    console.log("Loading tarmac footpath surface object...");
    const footpathObject = objectManager.load("rct2.footpath_surface.tarmac");
    if (!footpathObject) {
        console.log("Failed to load tarmac footpath surface object");
        callback();
        return;
    }
    
    console.log(`Loaded entrance object at index: ${entranceObject.index}`);
    console.log(`Loaded footpath object at index: ${footpathObject.index}`);
    
    // Create mirrored entrances based on the existing entrance position
    // Calculate mirror positions relative to the existing entrance
    const existingTileX = existingEntrance.tileX;
    const existingTileY = existingEntrance.tileY;
    
    console.log(`Existing entrance at tile (${existingTileX}, ${existingTileY})`);
    console.log(`Map size: ${mapSize.x} x ${mapSize.y}`);
    
    // Define entrance positions as mirrors of the existing entrance
    // Map is actually 128x128 (tiles 1-128), not 130x130
    const entrances = [
        // Player 2 (YELLOW): Right edge, same Y as existing entrance
        {
            name: "Player 2 (YELLOW)",
            x: 127 * scale, // Right edge (tile 127)
            y: existingTileY * scale, // Same Y position as existing
            z: existingEntrance.z,
            direction: 2, // Facing west (towards the map)
            tileX: 127,
            tileY: existingTileY
        },
        // Player 3 (GREEN): Left edge, bottom Y
        {
            name: "Player 3 (GREEN)",
            x: 2 * scale, // Near left edge (tile 2)
            y: 127 * scale, // Bottom edge (tile 127)
            z: existingEntrance.z,
            direction: 0, // Facing east (towards the map)
            tileX: 2,
            tileY: 127
        },
        // Player 4 (BLUE): Right edge, bottom Y
        {
            name: "Player 4 (BLUE)",
            x: 127 * scale, // Right edge (tile 127)
            y: 127 * scale, // Bottom edge (tile 127)
            z: existingEntrance.z,
            direction: 1, // Facing north (towards the map)
            tileX: 127,
            tileY: 127
        }
    ];
    
    // Log the calculated positions and validate them
    console.log("Calculated mirrored entrance positions:");
    entrances.forEach(entrance => {
        const isValid = entrance.tileX >= 1 && entrance.tileX <= mapSize.x && 
                       entrance.tileY >= 1 && entrance.tileY <= mapSize.y;
        console.log(`${entrance.name}: tile (${entrance.tileX}, ${entrance.tileY}) -> world (${entrance.x}, ${entrance.y}) - ${isValid ? 'VALID' : 'INVALID'}`);
    });
    
    let completed = 0;
    
    entrances.forEach((entrance) => {
        console.log(`Creating entrance for ${entrance.name} at (${entrance.x}, ${entrance.y})`);
        
        // First, mark the ground purple where we want to place the entrance (3x3 area)
        console.log(`Marking purple ground for ${entrance.name} entrance location`);
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                const markerX = entrance.x + (dx * scale);
                const markerY = entrance.y + (dy * scale);
                const markerZ = 0;
                
                // Place purple marker to show entrance location
                const markerObjectId = objectManager.load("rct2.scenery_small.brbase");
                if (markerObjectId) {
                    context.executeAction("smallsceneryplace", {
                        x: markerX,
                        y: markerY,
                        z: markerZ,
                        direction: 0,
                        object: markerObjectId.index, // Use the index property
                        quadrant: 0,
                        primaryColour: 15, // Purple color
                        secondaryColour: 0,
                        tertiaryColour: 0
                    }, (markerResult) => {
                        if (markerResult.error) {
                            console.log(`Failed to place scenery at (${markerX}, ${markerY}, ${markerZ}): ${markerResult.errorMessage}`);
                        }
                    });
                }
            }
        }
        
        // First, unown the land where we want to place the entrance (3x3 area)
        const unownX1 = entrance.x - scale;
        const unownY1 = entrance.y - scale;
        const unownX2 = entrance.x + scale;
        const unownY2 = entrance.y + scale;
        
        console.log(`Unowning land for ${entrance.name} entrance: (${unownX1}, ${unownY1}) to (${unownX2}, ${unownY2})`);
        
        context.executeAction("landsetrights", {
            x1: unownX1,
            y1: unownY1,
            x2: unownX2,
            y2: unownY2,
            setting: 0, // 0: unown land
            ownership: 0
        }, (unownResult) => {
            if (unownResult.error) {
                console.log(`Failed to unown land for ${entrance.name} entrance: ${unownResult.errorMessage}`);
            } else {
                console.log(`Successfully unowned land for ${entrance.name} entrance`);
                
                // First, try to place footpath at the entrance location
                console.log(`=== FOOTPATH PLACEMENT FOR ${entrance.name} ===`);
                console.log(`Footpath coordinates: x=${entrance.x}, y=${entrance.y}, z=${entrance.z}, direction=${entrance.direction}`);
                console.log(`Footpath object index: ${footpathObject.index}`);
                
                context.executeAction("footpathplace", {
                    x: entrance.x,
                    y: entrance.y,
                    z: entrance.z,
                    direction: entrance.direction,
                    object: footpathObject.index,
                    railingsObject: 0, // No railings
                    slope: 0, // Flat
                    constructFlags: 0,
                    flags: 0
                }, (footpathResult) => {
                    console.log(`=== FOOTPATH RESULT FOR ${entrance.name} ===`);
                    console.log(`Footpath result:`, footpathResult);
                    if (footpathResult.error) {
                        console.log(`❌ FAILED to place footpath for ${entrance.name}: ${footpathResult.errorMessage}`);
                        console.log(`❌ Footpath error code: ${footpathResult.errorCode}`);
                    } else {
                        console.log(`✅ Successfully placed footpath for ${entrance.name}`);
                    }
                    
                    // Now place the entrance
                    console.log(`=== ENTRANCE PLACEMENT FOR ${entrance.name} ===`);
                    console.log(`Entrance coordinates: x=${entrance.x}, y=${entrance.y}, z=${entrance.z}, direction=${entrance.direction}, footpathObject=${footpathObject.index}`);
                    console.log(`Tile coordinates: x=${entrance.tileX}, y=${entrance.tileY}`);
                    console.log(`Calculated coordinates: x=${entrance.tileX * scale}, y=${entrance.tileY * scale}`);
                    
                    try {
                        console.log(`🚀 EXECUTING parkentranceplace action for ${entrance.name}...`);
                        // Use the calculated coordinates for each entrance
                        console.log(`🔍 Using calculated coordinates: x=${entrance.tileX * scale}, y=${entrance.tileY * scale}, z=${entrance.z}, direction=${entrance.direction}`);
                        console.log(`🔍 Object indices - entrance: ${entranceObject.index}, footpath: ${footpathObject.index}`);
                        context.executeAction("parkentranceplace", {
                            x: entrance.tileX * scale,
                            y: entrance.tileY * scale,
                            z: entrance.z,
                            direction: entrance.direction,
                            footpathSurfaceObject: footpathObject.index,
                            entranceObject: entranceObject.index
                        }, (entranceResult) => {
                            console.log(`=== ENTRANCE RESULT FOR ${entrance.name} ===`);
                            console.log(`Entrance result:`, entranceResult);
                            if (entranceResult.error) {
                                console.log(`❌ FAILED to place entrance for ${entrance.name}: ${entranceResult.errorMessage}`);
                                // console.log(`❌ Entrance error code: ${entranceResult.errorCode}`);
                            } else {
                                console.log(`✅ Successfully placed entrance for ${entrance.name}`);
                            }
                            
                            completed++;
                            if (completed === entrances.length) {
                                console.log("All player entrances created successfully!");
                                callback();
                            }
                        });
                        console.log(`✅ parkentranceplace action CALLED for ${entrance.name}`);
                    } catch (error) {
                        console.log(`❌ EXCEPTION during parkentranceplace for ${entrance.name}:`, error);
                        console.log(`❌ Error type:`, typeof error);
                        console.log(`❌ Error message:`, error?.message || 'No message');
                        console.log(`❌ Error stack:`, error?.stack || 'No stack');
                        console.log(`❌ Full error object:`, JSON.stringify(error, null, 2));
                        completed++;
                        if (completed === entrances.length) {
                            console.log("All player entrances processed (with errors)!");
                            callback();
                        }
                    }
                });
            }
        });
    });
}
