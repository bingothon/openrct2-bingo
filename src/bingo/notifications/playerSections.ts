// Player sections for PVP mode - ground floor divisions
import { config } from "../../config";

// Map division configuration for PVP player sections
const MAP_DIVISION_OBJECT = 'rct2.scenery_small.brbase'; // Base tile for ground borders

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
    // First, try to remove any existing scenery at this location
    const removeAction = {
        x: x,
        y: y,
        z: z,
        object: objectId,
        quadrant: 0
    };
    
    context.executeAction("smallsceneryremove", removeAction, (removeResult) => {
        // Ignore remove errors - there might not be anything to remove
        
        // Now place the new scenery - use correct parameter order from @types/openrct2
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
        
        console.log("Player sections created successfully!");
        return true;
        
    } catch (error) {
        console.log("Error creating player sections:", error);
        return false;
    }
}
