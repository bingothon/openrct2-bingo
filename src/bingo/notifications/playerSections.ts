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
                // Disable debug mode after unowning
                console.log("Disabling debug mode...");
                debugMode(0, () => {
                    console.log("Debug mode disabled successfully");
                    console.log("Player sections created and unowned successfully!");
                });
            });
        });
        
        return true;
        
    } catch (error) {
        console.log("Error creating player sections:", error);
        return false;
    }
}
