// Billboard system for displaying PvP scores

// Billboard configuration - SQUARE LAYOUT (standing up like a real billboard)
const PADDING = 2; // 2 tiles padding on all sides
const BILLBOARD_SIZE = 25; // 16x16 tiles (square billboard)
const BILLBOARD_OFFSET_X = 50; // Distance from map edge
const BILLBOARD_OFFSET_Y = 126; // Distance from map edge
const BORDER_COLOR = 6;

// Player region configuration (2x2 grid within the square)
const REGION_SIZE = 8; // 6x6 tiles per player region (square regions)
const REGION_SPACING = 2; // 2 tiles spacing between regions

// Scenery object for building the billboard
const BILLBOARD_OBJECT = 'rct2.scenery_small.brbase';

// Number patterns for displaying scores (5x7 grid)
const NUMBER_PATTERNS = {
    0: [
        [1, 1, 1, 1, 1],
        [1, 0, 0, 0, 1],
        [1, 0, 0, 0, 1],
        [1, 0, 0, 0, 1],
        [1, 0, 0, 0, 1],
        [1, 0, 0, 0, 1],
        [1, 1, 1, 1, 1]
    ],
    1: [
        [0, 0, 1, 0, 0],
        [0, 1, 1, 0, 0],
        [0, 0, 1, 0, 0],
        [0, 0, 1, 0, 0],
        [0, 0, 1, 0, 0],
        [0, 0, 1, 0, 0],
        [1, 1, 1, 1, 1]
    ],
    2: [
        [1, 1, 1, 1, 1],
        [0, 0, 0, 0, 1],
        [0, 0, 0, 0, 1],
        [1, 1, 1, 1, 1],
        [1, 0, 0, 0, 0],
        [1, 0, 0, 0, 0],
        [1, 1, 1, 1, 1]
    ],
    3: [
        [1, 1, 1, 1, 1],
        [0, 0, 0, 0, 1],
        [0, 0, 0, 0, 1],
        [1, 1, 1, 1, 1],
        [0, 0, 0, 0, 1],
        [0, 0, 0, 0, 1],
        [1, 1, 1, 1, 1]
    ],
    4: [
        [1, 0, 0, 0, 1],
        [1, 0, 0, 0, 1],
        [1, 0, 0, 0, 1],
        [1, 1, 1, 1, 1],
        [0, 0, 0, 0, 1],
        [0, 0, 0, 0, 1],
        [0, 0, 0, 0, 1]
    ],
    5: [
        [1, 1, 1, 1, 1],
        [1, 0, 0, 0, 0],
        [1, 0, 0, 0, 0],
        [1, 1, 1, 1, 1],
        [0, 0, 0, 0, 1],
        [0, 0, 0, 0, 1],
        [1, 1, 1, 1, 1]
    ],
    6: [
        [1, 1, 1, 1, 1],
        [1, 0, 0, 0, 0],
        [1, 0, 0, 0, 0],
        [1, 1, 1, 1, 1],
        [1, 0, 0, 0, 1],
        [1, 0, 0, 0, 1],
        [1, 1, 1, 1, 1]
    ],
    7: [
        [1, 1, 1, 1, 1],
        [0, 0, 0, 0, 1],
        [0, 0, 0, 1, 0],
        [0, 0, 1, 0, 0],
        [0, 1, 0, 0, 0],
        [1, 0, 0, 0, 0],
        [1, 0, 0, 0, 0]
    ],
    8: [
        [1, 1, 1, 1, 1],
        [1, 0, 0, 0, 1],
        [1, 0, 0, 0, 1],
        [1, 1, 1, 1, 1],
        [1, 0, 0, 0, 1],
        [1, 0, 0, 0, 1],
        [1, 1, 1, 1, 1]
    ],
    9: [
        [1, 1, 1, 1, 1],
        [1, 0, 0, 0, 1],
        [1, 0, 0, 0, 1],
        [1, 1, 1, 1, 1],
        [0, 0, 0, 0, 1],
        [0, 0, 0, 0, 1],
        [1, 1, 1, 1, 1]
    ]
};

// Player colors for the billboard
const PLAYER_COLORS = [1, 2, 3, 4]; // Different colors for each player

/**
 * Creates a horizontal billboard divided into 4 player regions (side by side)
 */
export function createScoreboard() {
    console.log("Creating scoreboard billboard...");
    
    const mapSize = map.size;
    // Position vertical billboard on the right side, well within map bounds
    const billboardX = (mapSize.x - BILLBOARD_SIZE - BILLBOARD_OFFSET_X) * 32;
    const billboardY = BILLBOARD_OFFSET_Y * 32;
    
    // Load the scenery object
    const identifier = BILLBOARD_OBJECT;
    const loadedObject = objectManager.load(identifier);
    
    if (!loadedObject) {
        console.log("Failed to load billboard object:", identifier);
        return;
    }
    
    const objectId = loadedObject.index;
    const baseZ = 0;
    const scale = 32;
    
    // Create a REAL vertical billboard wall (standing up like a wall)
    const billboardZ = baseZ + (8 * 16); // 8 levels up in the air
    
    // Build a square vertical wall by stacking Z levels to create height (2x stacking like numbers)
    for (let zLevel = 0; zLevel < BILLBOARD_SIZE; zLevel++) {
        for (let x = 0; x < BILLBOARD_SIZE; x++) {
            // Build the wall by stacking Z levels - this creates a vertical surface
            const wallX = billboardX + x * scale;
            const wallY = billboardY; // Keep Y constant
            const wallZ = billboardZ + (zLevel * 16 * 2); // 2x stacking like numbers (32 units per level)
            
            // Place 2 objects stacked vertically for each wall tile (same as numbers)
            placeSceneryObject(wallX, wallY, wallZ, objectId, BORDER_COLOR); // Gray wall
            placeSceneryObject(wallX, wallY, wallZ + 16, objectId, BORDER_COLOR);
        }
    }
    
    // Add black background behind the numbers
    createBlackBackground(billboardX, billboardY, objectId, billboardZ, scale);
    
    // Add the player regions on the vertical wall
    createPlayerRegionsVertical(billboardX, billboardY, objectId, billboardZ, scale);
    
    // Create mirrored billboard one tile behind (at Y=127)
    const mirroredY = 127 * 32; // One tile behind
    createMirroredBillboard(billboardX, mirroredY, objectId, billboardZ, scale);
    
    console.log("Scoreboard created successfully!");
}


/**
 * Creates a mirrored billboard one tile behind for correct viewing from the back
 */
function createMirroredBillboard(baseX: number, baseY: number, objectId: number, billboardZ: number, scale: number) {
    // Create mirrored wall (same as original but at different Y position)
    for (let zLevel = 0; zLevel < BILLBOARD_SIZE; zLevel++) {
        for (let x = 0; x < BILLBOARD_SIZE; x++) {
            const wallX = baseX + x * scale;
            const wallY = baseY; // Mirrored Y position
            const wallZ = billboardZ + (zLevel * 16 * 2); // 2x stacking like numbers
            
            // Place 2 objects stacked vertically for each wall tile
            placeSceneryObject(wallX, wallY, wallZ, objectId, BORDER_COLOR); // Gray wall
            placeSceneryObject(wallX, wallY, wallZ + 16, objectId, BORDER_COLOR);
        }
    }
    
    // Create mirrored black background
    createMirroredBlackBackground(baseX, baseY, objectId, billboardZ, scale);
    
    // Create mirrored player regions with horizontally flipped numbers
    createMirroredPlayerRegions(baseX, baseY, objectId, billboardZ, scale);
}

/**
 * Creates a black background behind the numbers
 */
function createBlackBackground(baseX: number, baseY: number, objectId: number, billboardZ: number, scale: number) {
    // Create a black background area behind where the numbers will be placed
    const backgroundSize = BILLBOARD_SIZE - (PADDING * 2); // Square background with padding
    const backgroundStartX = baseX + PADDING * scale; // Start with padding from the edge
    const backgroundStartZ = billboardZ + PADDING * 16 * 2; // Start with padding from the bottom (2x stacking)
    
    // Fill the background area with black objects (2x stacking like numbers)
    for (let z = 0; z < backgroundSize; z++) {
        for (let x = 0; x < backgroundSize; x++) {
            const bgX = backgroundStartX + x * scale;
            const bgY = baseY; // Keep Y constant for vertical wall
            const bgZ = backgroundStartZ + z * 16 * 2; // 2x stacking like numbers
            
            // Place 2 black objects stacked vertically for each background tile
            placeSceneryObject(bgX, bgY, bgZ, objectId, 0); // Black color (0)
            placeSceneryObject(bgX, bgY, bgZ + 16, objectId, 0);
        }
    }
}

/**
 * Creates a mirrored black background behind the numbers
 */
function createMirroredBlackBackground(baseX: number, baseY: number, objectId: number, billboardZ: number, scale: number) {
    // Create a black background area behind where the numbers will be placed
    const backgroundSize = BILLBOARD_SIZE - (PADDING * 2); // Square background with padding
    const backgroundStartX = baseX + PADDING * scale; // Start with padding from the edge
    const backgroundStartZ = billboardZ + PADDING * 16 * 2; // Start with padding from the bottom (2x stacking)
    
    // Fill the background area with black objects (2x stacking like numbers)
    for (let z = 0; z < backgroundSize; z++) {
        for (let x = 0; x < backgroundSize; x++) {
            const bgX = backgroundStartX + x * scale;
            const bgY = baseY; // Keep Y constant for vertical wall
            const bgZ = backgroundStartZ + z * 16 * 2; // 2x stacking like numbers
            
            // Place 2 black objects stacked vertically for each background tile
            placeSceneryObject(bgX, bgY, bgZ, objectId, 0); // Black color (0)
            placeSceneryObject(bgX, bgY, bgZ + 16, objectId, 0);
        }
    }
}

/**
 * Creates the 4 player regions on a vertical billboard wall in a 2x2 grid
 */
function createPlayerRegionsVertical(baseX: number, baseY: number, objectId: number, billboardZ: number, scale: number) {
    // Calculate the center of the billboard for proper 2x2 grid positioning
    const centerX = baseX + (BILLBOARD_SIZE / 2) * scale;
    const centerZ = billboardZ + (BILLBOARD_SIZE / 2) * 16 * 2; // 2x stacking
    
    // Calculate region positions within the square billboard
    const regionOffset = (REGION_SIZE + REGION_SPACING) / 2; // Half the region size + spacing
    
    const regions = [
        // Top-left
        { name: "Player 1", x: centerX - regionOffset * scale, z: centerZ + regionOffset * 16 * 2, color: PLAYER_COLORS[0], score: 1 },
        // Top-right
        { name: "Player 2", x: centerX + regionOffset * scale, z: centerZ + regionOffset * 16 * 2, color: PLAYER_COLORS[1], score: 2 },
        // Bottom-left
        { name: "Player 3", x: centerX - regionOffset * scale, z: centerZ - regionOffset * 16 * 2, color: PLAYER_COLORS[2], score: 3 },
        // Bottom-right
        { name: "Player 4", x: centerX + regionOffset * scale, z: centerZ - regionOffset * 16 * 2, color: PLAYER_COLORS[3], score: 5 }
    ];
    
    regions.forEach(region => {
        // Center the number within each region
        const numberX = region.x - (2 * scale); // Center horizontally (number is ~4 tiles wide)
        const numberY = baseY; // Keep Y constant for vertical wall
        const numberZ = region.z - (3 * 16 * 2); // Center vertically (number is ~6 tiles tall with 2x stacking)
        
        // Place numbers ON THE WALL
        placeNumberOnWall(region.score, numberX, numberY, numberZ, objectId, region.color, scale);
    });
}

/**
 * Creates mirrored player regions with horizontally flipped numbers
 */
function createMirroredPlayerRegions(baseX: number, baseY: number, objectId: number, billboardZ: number, scale: number) {
    // Calculate the center of the billboard for proper 2x2 grid positioning
    const centerX = baseX + (BILLBOARD_SIZE / 2) * scale;
    const centerZ = billboardZ + (BILLBOARD_SIZE / 2) * 16 * 2; // 2x stacking
    
    // Calculate region positions within the square billboard
    const regionOffset = (REGION_SIZE + REGION_SPACING) / 2; // Half the region size + spacing
    
    const regions = [
        // SWAPPED: Bottom-left becomes top-left (3)
        { name: "Player 3", x: centerX - regionOffset * scale, z: centerZ + regionOffset * 16 * 2, color: PLAYER_COLORS[2], score: 3 },
        // SWAPPED: Bottom-right becomes top-right (5)
        { name: "Player 4", x: centerX + regionOffset * scale, z: centerZ + regionOffset * 16 * 2, color: PLAYER_COLORS[3], score: 5 },
        // SWAPPED: Top-left becomes bottom-left (1)
        { name: "Player 1", x: centerX - regionOffset * scale, z: centerZ - regionOffset * 16 * 2, color: PLAYER_COLORS[0], score: 1 },
        // SWAPPED: Top-right becomes bottom-right (2)
        { name: "Player 2", x: centerX + regionOffset * scale, z: centerZ - regionOffset * 16 * 2, color: PLAYER_COLORS[1], score: 2 }
    ];
    
    regions.forEach(region => {
        // Center the number within each region
        const numberX = region.x - (2 * scale); // Center horizontally (number is ~4 tiles wide)
        const numberY = baseY; // Keep Y constant for vertical wall
        const numberZ = region.z - (3 * 16 * 2); // Center vertically (number is ~6 tiles tall with 2x stacking)
        
        // Place horizontally flipped numbers ON THE WALL
        placeMirroredNumberOnWall(region.score, numberX, numberY, numberZ, objectId, region.color, scale);
    });
}

/**
 * Places a number using scenery objects ON A VERTICAL WALL
 * Uses 2 brbase objects stacked vertically to create square "pixels"
 */
function placeNumberOnWall(number: number, baseX: number, baseY: number, billboardZ: number, objectId: number, color: number, scale: number) {
    const pattern = NUMBER_PATTERNS[number as keyof typeof NUMBER_PATTERNS];
    
    if (!pattern) {
        console.log(`No pattern found for number: ${number}`);
        return;
    }
    
    // Place the number pattern on the vertical wall using 2 stacked objects for each pixel
    // This creates square pixels by stacking 2 brbase objects vertically
    pattern.forEach((row, rowIndex) => {
        row.forEach((cell, colIndex) => {
            if (cell === 1) {
                // Create a square pixel by stacking 2 brbase objects vertically
                const pixelX = baseX + colIndex * scale; // Normal width
                const pixelY = baseY; // Keep Y constant for vertical wall
                // Invert the row index to fix the upside-down numbers
                const invertedRowIndex = pattern.length - 1 - rowIndex;
                const pixelZ = billboardZ + (invertedRowIndex * 16 * 2); // 2x stacking for height
                
                // Place 2 objects stacked vertically
                placeSceneryObject(pixelX, pixelY, pixelZ, objectId, color);
                placeSceneryObject(pixelX, pixelY, pixelZ + 16, objectId, color);
            }
        });
    });
}

/**
 * Places a horizontally mirrored number using scenery objects ON A VERTICAL WALL
 * Uses 2 brbase objects stacked vertically to create square "pixels"
 */
function placeMirroredNumberOnWall(number: number, baseX: number, baseY: number, billboardZ: number, objectId: number, color: number, scale: number) {
    const pattern = NUMBER_PATTERNS[number as keyof typeof NUMBER_PATTERNS];
    
    if (!pattern) {
        console.log(`No pattern found for number: ${number}`);
        return;
    }
    
    // Place the number pattern on the vertical wall using 2 stacked objects for each pixel
    // This creates square pixels by stacking 2 brbase objects vertically
    // HORIZONTALLY FLIP the pattern by reversing the column order
    pattern.forEach((row, rowIndex) => {
        row.forEach((cell, colIndex) => {
            if (cell === 1) {
                // Create a square pixel by stacking 2 brbase objects vertically
                // HORIZONTALLY FLIP: reverse the column index
                const flippedColIndex = row.length - 1 - colIndex;
                const pixelX = baseX + flippedColIndex * scale; // Flipped X position
                const pixelY = baseY; // Keep Y constant for vertical wall
                // Invert the row index to fix the upside-down numbers
                const invertedRowIndex = pattern.length - 1 - rowIndex;
                const pixelZ = billboardZ + (invertedRowIndex * 16 * 2); // 2x stacking for height
                
                // Place 2 objects stacked vertically
                placeSceneryObject(pixelX, pixelY, pixelZ, objectId, color);
                placeSceneryObject(pixelX, pixelY, pixelZ + 16, objectId, color);
            }
        });
    });
}

/**
 * Places a number using scenery objects (for flat surfaces)
 */
function placeNumber(number: number, baseX: number, baseY: number, z: number, objectId: number, color: number, scale: number) {
    const pattern = NUMBER_PATTERNS[number as keyof typeof NUMBER_PATTERNS];
    
    if (!pattern) {
        console.log(`No pattern found for number: ${number}`);
        return;
    }
    
    pattern.forEach((row, rowIndex) => {
        row.forEach((cell, colIndex) => {
            if (cell === 1) {
                const x = baseX + colIndex * scale;
                const y = baseY + rowIndex * scale;
                placeSceneryObject(x, y, z, objectId, color);
            }
        });
    });
}

/**
 * Places a single scenery object
 */
function placeSceneryObject(x: number, y: number, z: number, objectId: number, color: number) {
    context.executeAction("smallsceneryplace", {
        x: x,
        y: y,
        z: z,
        direction: 0,
        quadrant: 0,
        object: objectId,
        primaryColour: color,
        secondaryColour: 0,
        tertiaryColour: 0
    }, (result) => {
        if (result.error) {
            // Silently ignore placement errors for cleaner output
        }
    });
}

/**
 * Clears the scoreboard area
 */
export function clearScoreboard() {
    console.log("Clearing scoreboard...");
    
    const mapSize = map.size;
    // Position vertical billboard on the right side, well within map bounds
    const billboardX = (mapSize.x - BILLBOARD_SIZE - BILLBOARD_OFFSET_X) * 32;
    const billboardY = BILLBOARD_OFFSET_Y * 32;
    
    // Clear the billboard area at the specific height
    const billboardZ = 8 * 16; // Same height as creation
    
    // Clear original billboard
    for (let x = 0; x < BILLBOARD_SIZE; x++) {
        for (let y = 0; y < BILLBOARD_SIZE; y++) {
            const tileX = Math.floor((billboardX + x * 32) / 32);
            const tileY = Math.floor((billboardY + y * 32) / 32);
            
            if (tileX >= 0 && tileX < mapSize.x && tileY >= 0 && tileY < mapSize.y) {
                const tile = map.getTile(tileX, tileY);
                const elements = tile.elements;
                
                // Remove small scenery elements at the billboard height
                for (let i = elements.length - 1; i >= 0; i--) {
                    if (elements[i].type === "small_scenery") {
                        const element = elements[i] as SmallSceneryElement;
                        // Check for elements within the 2x stacked height range
                        if (element.baseZ >= billboardZ && element.baseZ < billboardZ + (BILLBOARD_SIZE * 16 * 2)) {
                            tile.removeElement(i);
                        }
                    }
                }
            }
        }
    }
    
    // Clear mirrored billboard (one tile behind at Y=127)
    const mirroredY = BILLBOARD_OFFSET_Y + 1 * 32;
    for (let x = 0; x < BILLBOARD_SIZE; x++) {
        for (let y = 0; y < BILLBOARD_SIZE; y++) {
            const tileX = Math.floor((billboardX + x * 32) / 32);
            const tileY = Math.floor((mirroredY + y * 32) / 32);
            
            if (tileX >= 0 && tileX < mapSize.x && tileY >= 0 && tileY < mapSize.y) {
                const tile = map.getTile(tileX, tileY);
                const elements = tile.elements;
                
                // Remove small scenery elements at the billboard height
                for (let i = elements.length - 1; i >= 0; i--) {
                    if (elements[i].type === "small_scenery") {
                        const element = elements[i] as SmallSceneryElement;
                        // Check for elements within the 2x stacked height range
                        if (element.baseZ >= billboardZ && element.baseZ < billboardZ + (BILLBOARD_SIZE * 16 * 2)) {
                            tile.removeElement(i);
                        }
                    }
                }
            }
        }
    }
    
    console.log("Scoreboard cleared!");
}
