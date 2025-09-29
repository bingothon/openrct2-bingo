// Billboard system for displaying PvP scores
import { debugMode } from 'src/utils';
import { config } from '../../config';
import { logger } from '../../logger';

// Billboard configuration - SQUARE LAYOUT (standing up like a real billboard)
const PADDING = 1; // 2 tiles padding on all sides
const BILLBOARD_SIZE = 46; // 36x36 tiles (square billboard) - increased for larger regions
const BILLBOARD_OFFSET_X = 42; // Distance from map edge
const BILLBOARD_OFFSET_Y = 185; // Distance from map edge
const BORDER_COLOR = 0;

// Player region configuration (2x2 grid within the square)
const REGION_SIZE = 20; // 16x16 tiles per player region (square regions) - increased for larger borders
const REGION_SPACING = 2; // 2 tiles spacing between regions

const EXTEND_MAP_SIZE_Y = 192;
const EXTEND_MAP_SIZE_X = 130;

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
        [1, 1, 1, 1, 1],
    ],
    1: [
        [0, 0, 1, 0, 0],
        [0, 1, 1, 0, 0],
        [0, 0, 1, 0, 0],
        [0, 0, 1, 0, 0],
        [0, 0, 1, 0, 0],
        [0, 0, 1, 0, 0],
        [1, 1, 1, 1, 1],
    ],
    2: [
        [1, 1, 1, 1, 1],
        [0, 0, 0, 0, 1],
        [0, 0, 0, 0, 1],
        [1, 1, 1, 1, 1],
        [1, 0, 0, 0, 0],
        [1, 0, 0, 0, 0],
        [1, 1, 1, 1, 1],
    ],
    3: [
        [1, 1, 1, 1, 1],
        [0, 0, 0, 0, 1],
        [0, 0, 0, 0, 1],
        [1, 1, 1, 1, 1],
        [0, 0, 0, 0, 1],
        [0, 0, 0, 0, 1],
        [1, 1, 1, 1, 1],
    ],
    4: [
        [1, 0, 0, 0, 1],
        [1, 0, 0, 0, 1],
        [1, 0, 0, 0, 1],
        [1, 1, 1, 1, 1],
        [0, 0, 0, 0, 1],
        [0, 0, 0, 0, 1],
        [0, 0, 0, 0, 1],
    ],
    5: [
        [1, 1, 1, 1, 1],
        [1, 0, 0, 0, 0],
        [1, 0, 0, 0, 0],
        [1, 1, 1, 1, 1],
        [0, 0, 0, 0, 1],
        [0, 0, 0, 0, 1],
        [1, 1, 1, 1, 1],
    ],
    6: [
        [1, 1, 1, 1, 1],
        [1, 0, 0, 0, 0],
        [1, 0, 0, 0, 0],
        [1, 1, 1, 1, 1],
        [1, 0, 0, 0, 1],
        [1, 0, 0, 0, 1],
        [1, 1, 1, 1, 1],
    ],
    7: [
        [1, 1, 1, 1, 1],
        [0, 0, 0, 0, 1],
        [0, 0, 0, 1, 0],
        [0, 0, 1, 0, 0],
        [0, 1, 0, 0, 0],
        [1, 0, 0, 0, 0],
        [1, 0, 0, 0, 0],
    ],
    8: [
        [1, 1, 1, 1, 1],
        [1, 0, 0, 0, 1],
        [1, 0, 0, 0, 1],
        [1, 1, 1, 1, 1],
        [1, 0, 0, 0, 1],
        [1, 0, 0, 0, 1],
        [1, 1, 1, 1, 1],
    ],
    9: [
        [1, 1, 1, 1, 1],
        [1, 0, 0, 0, 1],
        [1, 0, 0, 0, 1],
        [1, 1, 1, 1, 1],
        [0, 0, 0, 0, 1],
        [0, 0, 0, 0, 1],
        [1, 1, 1, 1, 1],
    ],
};

// Player colors for the billboard - imported from config
const PLAYER_COLORS = [
    config.playerColors.player1, // Player 1: Bright Red
    config.playerColors.player2, // Player 2: Light Blue
    config.playerColors.player3, // Player 3: Bright Green
    config.playerColors.player4, // Player 4: Yellow
];

// Player color names for reference - imported from config
// (Unused currently; remove to satisfy linter)

/**
 * Creates a colored border around a player region
 */
function createPlayerRegionBorder(
    centerX: number,
    centerZ: number,
    objectId: number,
    color: number,
    scale: number,
    baseY: number,
) {
    // Create a border around the player region (REGION_SIZE x REGION_SIZE)
    const borderSize = REGION_SIZE;
    const halfSize = borderSize / 2;
    const borderThickness = 2; // Make borders thicker to better accommodate numbers

    // Calculate the border area
    const startX = centerX - halfSize * scale;
    const startZ = centerZ - halfSize * 16 * 2;

    // Create border outline with thickness (only the edges, not filled)
    for (let i = 0; i < borderSize; i++) {
        // Top edge (thick border)
        for (let t = 0; t < borderThickness; t++) {
            const topX = startX + i * scale;
            const topZ = startZ + (borderSize - 1 - t) * 16 * 2;
            placeSceneryObject(topX, baseY, topZ, objectId, color);
            placeSceneryObject(topX, baseY, topZ + 16, objectId, color);
        }

        // Bottom edge (thick border)
        for (let t = 0; t < borderThickness; t++) {
            const bottomX = startX + i * scale;
            const bottomZ = startZ + t * 16 * 2;
            placeSceneryObject(bottomX, baseY, bottomZ, objectId, color);
            placeSceneryObject(bottomX, baseY, bottomZ + 16, objectId, color);
        }

        // Left edge (thick border)
        for (let t = 0; t < borderThickness; t++) {
            const leftX = startX + t * scale;
            const leftZ = startZ + i * 16 * 2;
            placeSceneryObject(leftX, baseY, leftZ, objectId, color);
            placeSceneryObject(leftX, baseY, leftZ + 16, objectId, color);
        }

        // Right edge (thick border)
        for (let t = 0; t < borderThickness; t++) {
            const rightX = startX + (borderSize - 1 - t) * scale;
            const rightZ = startZ + i * 16 * 2;
            placeSceneryObject(rightX, baseY, rightZ, objectId, color);
            placeSceneryObject(rightX, baseY, rightZ + 16, objectId, color);
        }
    }
}

/**
 * Splits a number into individual digits
 */
function getDigits(number: number): number[] {
    if (number < 0) return [0];
    if (number === 0) return [0];

    const digits: number[] = [];
    while (number > 0) {
        digits.unshift(number % 10);
        number = Math.floor(number / 10);
    }
    return digits;
}

/**
 * Creates a horizontal billboard divided into 4 player regions (side by side)
 */
export function createScoreboard(): void {
    debugMode(1, () => {
        context.executeAction(
            'mapchangesize',
            {
                targetSizeX: EXTEND_MAP_SIZE_X,
                targetSizeY: EXTEND_MAP_SIZE_Y,
                shiftX: 0,
                shiftY: 0,
            },
            (result) => {
                if (result.error) {
                    logger.debug('mapchangesize failed:', result.errorMessage);
                    return;
                }
                const field = billboardField();
                logger.debug('Billboard field (tiles):', {
                    x1: field.x1,
                    x2: field.x2,
                    y1: field.y1,
                    y2: field.y2,
                });
                context.executeAction(
                    'landsetrights',
                    {
                        x1: field.x1 * 32,
                        y1: field.y1 * 32,
                        x2: field.x2 * 32 - 1,
                        y2: field.y2 * 32,
                        setting: 2,
                        ownership: 0,
                    },
                    (result) => {
                        if (result.error) {
                            logger.debug('landsetrights failed:', result.errorMessage);
                            return;
                        }
                        logger.debug('[SCOREBOARD] landsetrights completed');
                        context.executeAction(
                            'landbuyrights',
                            {
                                x1: field.x1 * 32,
                                y1: field.y1 * 32,
                                x2: field.x2 * 32,
                                y2: field.y2 * 32,
                                setting: 0,
                            },
                            (result) => {
                                if (result.error) {
                                    logger.debug('landbuyrights failed:', result.errorMessage);
                                    return;
                                }
                                logger.debug('[SCOREBOARD] landbuyrights completed');

                                logger.debug('Creating scoreboard billboard...');

                                try {
                                    logger.debug('Step 1: Getting map size...');
                                    const mapSize = map.size;
                                    logger.debug('Map size:', mapSize);

                                    // Position vertical billboard on the right side, well within map bounds
                                    const billboardX =
                                        (mapSize.x - BILLBOARD_SIZE - BILLBOARD_OFFSET_X) * 32;
                                    const billboardY = BILLBOARD_OFFSET_Y * 32;
                                    logger.debug('Billboard position:', { billboardX, billboardY });

                                    // Load the scenery object
                                    logger.debug('Step 2: Loading scenery object...');
                                    const identifier = BILLBOARD_OBJECT;
                                    const loadedObject = objectManager.load(identifier);

                                    if (!loadedObject) {
                                        logger.debug(
                                            'Failed to load billboard object:',
                                            identifier,
                                        );
                                        return false;
                                    }
                                    logger.debug(
                                        'Scenery object loaded successfully, index:',
                                        loadedObject.index,
                                    );

                                    const objectId = loadedObject.index;
                                    const baseZ = 0;
                                    const scale = 32;

                                    // Create a REAL vertical billboard wall (standing up like a wall)
                                    const billboardZ = baseZ + 8 * 16; // 8 levels up in the air

                                    // Clear the billboard area to prevent "base block in the way" errors
                                    logger.debug('Step 3: Clearing billboard area...');
                                    clearBillboardArea(billboardX, billboardY, BILLBOARD_SIZE, scale);

                                    // Build a square vertical wall by stacking Z levels to create height (2x stacking like numbers)
                                    logger.debug('Step 5: Building billboard wall...');
                                    for (let zLevel = 0; zLevel < BILLBOARD_SIZE; zLevel++) {
                                        for (let x = 0; x < BILLBOARD_SIZE; x++) {
                                            // Build the wall by stacking Z levels - this creates a vertical surface
                                            const wallX = billboardX + x * scale;
                                            const wallY = billboardY; // Keep Y constant
                                            const wallZ = billboardZ + zLevel * 16 * 2; // 2x stacking like numbers (32 units per level)

                                            // Place 2 objects stacked vertically for each wall tile (same as numbers)
                                            placeSceneryObject(
                                                wallX,
                                                wallY,
                                                wallZ,
                                                objectId,
                                                BORDER_COLOR,
                                            ); // Gray wall
                                            placeSceneryObject(
                                                wallX,
                                                wallY,
                                                wallZ + 16,
                                                objectId,
                                                BORDER_COLOR,
                                            );
                                        }
                                    }
                                    logger.debug('Step 6: Wall creation completed');

                                    // Add black background behind the numbers
                                    logger.debug('Step 7: Creating black background...');
                                    createBlackBackground(
                                        billboardX,
                                        billboardY,
                                        objectId,
                                        billboardZ,
                                        scale,
                                    );
                                    logger.debug('Step 8: Black background completed');

                                    // Add the player regions on the vertical wall
                                    logger.debug('Step 9: Creating player regions...');
                                    createPlayerRegionsVertical(
                                        billboardX,
                                        billboardY,
                                        objectId,
                                        billboardZ,
                                        scale,
                                    );
                                    logger.debug('Step 10: Player regions completed');

                                    // Create mirrored billboard one tile behind
                                    logger.debug('Step 11: Creating mirrored billboard...');
                                    const mirroredY = (BILLBOARD_OFFSET_Y + 1) * 32; // One tile behind
                                    createMirroredBillboard(
                                        billboardX,
                                        mirroredY,
                                        objectId,
                                        billboardZ,
                                        scale,
                                    );
                                    logger.debug('Step 12: Mirrored billboard completed');

                                    logger.debug('Scoreboard created successfully!');
                                    debugMode(0, () => {
                                        logger.debug('[SCOREBOARD] Debug mode disabled.');
                                        return true;
                                    });
                                    
                                } catch (error: unknown) {
                                    logger.debug('Error creating scoreboard:', error);
                                    logger.debug('Error type:', typeof error);
                                    if (error instanceof Error) {
                                        logger.debug('Error message:', error.message);
                                        logger.debug('Error stack:', error.stack);
                                    }
                                    return false;
                                }
                                
                                return true;
                            },
                        );
                    },
                );
            },
        );
    });
}

/**
 * Creates a mirrored billboard one tile behind for correct viewing from the back
 */
function createMirroredBillboard(
    baseX: number,
    baseY: number,
    objectId: number,
    billboardZ: number,
    scale: number,
) {
    // Create mirrored wall (same as original but at different Y position)
    for (let zLevel = 0; zLevel < BILLBOARD_SIZE; zLevel++) {
        for (let x = 0; x < BILLBOARD_SIZE; x++) {
            const wallX = baseX + x * scale;
            const wallY = baseY; // Mirrored Y position
            const wallZ = billboardZ + zLevel * 16 * 2; // 2x stacking like numbers

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
function createBlackBackground(
    baseX: number,
    baseY: number,
    objectId: number,
    billboardZ: number,
    scale: number,
) {
    // Create a black background area behind where the numbers will be placed
    const backgroundSize = BILLBOARD_SIZE - PADDING * 2; // Square background with padding
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
function createMirroredBlackBackground(
    baseX: number,
    baseY: number,
    objectId: number,
    billboardZ: number,
    scale: number,
) {
    // Create a black background area behind where the numbers will be placed
    const backgroundSize = BILLBOARD_SIZE - PADDING * 2; // Square background with padding
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
function createPlayerRegionsVertical(
    baseX: number,
    baseY: number,
    objectId: number,
    billboardZ: number,
    scale: number,
) {
    // Calculate the center of the billboard for proper 2x2 grid positioning
    const centerX = baseX + (BILLBOARD_SIZE / 2) * scale;
    const centerZ = billboardZ + (BILLBOARD_SIZE / 2) * 16 * 2; // 2x stacking

    // Calculate region positions within the square billboard
    const regionOffset = (REGION_SIZE + REGION_SPACING) / 2; // Half the region size + spacing

    const regions = [
        // Top-left - GREEN (Player 1) - switched from RED
        {
            name: 'Player 1',
            x: centerX - regionOffset * scale,
            z: centerZ + regionOffset * 16 * 2,
            color: PLAYER_COLORS[2],
            score: 0,
        },
        // Top-right - YELLOW (Player 2) - keep YELLOW
        {
            name: 'Player 2',
            x: centerX + regionOffset * scale,
            z: centerZ + regionOffset * 16 * 2,
            color: PLAYER_COLORS[3],
            score: 0,
        },
        // Bottom-left - RED (Player 3) - switched from GREEN
        {
            name: 'Player 3',
            x: centerX - regionOffset * scale,
            z: centerZ - regionOffset * 16 * 2,
            color: PLAYER_COLORS[0],
            score: 0,
        },
        // Bottom-right - BLUE (Player 4) - keep BLUE
        {
            name: 'Player 4',
            x: centerX + regionOffset * scale,
            z: centerZ - regionOffset * 16 * 2,
            color: PLAYER_COLORS[1],
            score: 0,
        },
    ];

    regions.forEach((region) => {
        // Create colored border around each player region
        createPlayerRegionBorder(region.x, region.z, objectId, region.color, scale, baseY);

        // Center the number within each region - will be handled in placeNumberOnWall
        const numberX = region.x; // Center horizontally (will be handled in placeNumberOnWall)
        const numberY = baseY; // Keep Y constant for vertical wall
        const numberZ = region.z - 3 * 16 * 2; // Center vertically (number is ~6 tiles tall with 2x stacking)

        // Place numbers ON THE WALL
        placeNumberOnWall(region.score, numberX, numberY, numberZ, objectId, region.color, scale);
    });
}

/**
 * Creates mirrored player regions with horizontally flipped numbers
 */
function createMirroredPlayerRegions(
    baseX: number,
    baseY: number,
    objectId: number,
    billboardZ: number,
    scale: number,
) {
    // Calculate the center of the billboard for proper 2x2 grid positioning
    const centerX = baseX + (BILLBOARD_SIZE / 2) * scale;
    const centerZ = billboardZ + (BILLBOARD_SIZE / 2) * 16 * 2; // 2x stacking

    // Calculate region positions within the square billboard
    const regionOffset = (REGION_SIZE + REGION_SPACING) / 2; // Half the region size + spacing

    const regions = [
        // SWAPPED: Bottom-left becomes top-left (Player 3 -> 0) - RED
        {
            name: 'Player 3',
            x: centerX - regionOffset * scale,
            z: centerZ + regionOffset * 16 * 2,
            color: PLAYER_COLORS[0],
            score: 0,
        },
        // SWAPPED: Bottom-right becomes top-right (Player 4 -> 0) - BLUE
        {
            name: 'Player 4',
            x: centerX + regionOffset * scale,
            z: centerZ + regionOffset * 16 * 2,
            color: PLAYER_COLORS[1],
            score: 0,
        },
        // SWAPPED: Top-left becomes bottom-left (Player 1 -> 0) - GREEN
        {
            name: 'Player 1',
            x: centerX - regionOffset * scale,
            z: centerZ - regionOffset * 16 * 2,
            color: PLAYER_COLORS[2],
            score: 0,
        },
        // SWAPPED: Top-right becomes bottom-right (Player 2 -> 0) - YELLOW
        {
            name: 'Player 2',
            x: centerX + regionOffset * scale,
            z: centerZ - regionOffset * 16 * 2,
            color: PLAYER_COLORS[3],
            score: 0,
        },
    ];

    regions.forEach((region) => {
        // Create colored border around each player region (mirrored)
        createPlayerRegionBorder(region.x, region.z, objectId, region.color, scale, baseY);

        // Center the number within each region - will be handled in placeMirroredNumberOnWall
        const numberX = region.x; // Center horizontally (will be handled in placeMirroredNumberOnWall)
        const numberY = baseY; // Keep Y constant for vertical wall
        const numberZ = region.z - 3 * 16 * 2; // Center vertically (number is ~6 tiles tall with 2x stacking)

        // Place horizontally flipped numbers ON THE WALL
        placeMirroredNumberOnWall(
            region.score,
            numberX,
            numberY,
            numberZ,
            objectId,
            region.color,
            scale,
        );
    });
}

/**
 * Places a number using scenery objects ON A VERTICAL WALL
 * Uses 2 brbase objects stacked vertically to create square "pixels"
 * Handles both single and two-digit numbers
 */
function placeNumberOnWall(
    number: number,
    baseX: number,
    baseY: number,
    billboardZ: number,
    objectId: number,
    color: number,
    scale: number,
) {
    const digits = getDigits(number);

    // Center the digits within the region
    const digitSpacing = 0.5; // Half a tile spacing between digits
    const totalWidth = digits.length * 5 + (digits.length - 1) * digitSpacing; // Each digit is 5 tiles wide + spacing
    const startX = baseX - (totalWidth * scale) / 2; // Center the digits

    digits.forEach((digit, digitIndex) => {
        const pattern = NUMBER_PATTERNS[digit as keyof typeof NUMBER_PATTERNS];

        if (!pattern) {
            console.log(`No pattern found for digit: ${digit}`);
            return;
        }

        // Calculate X offset for this digit with spacing between digits
        const digitSpacing = 0.5; // Half a tile spacing between digits
        const digitX = startX + digitIndex * (5 + digitSpacing) * scale;

        // Place the digit pattern on the vertical wall using 2 stacked objects for each pixel
        pattern.forEach((row, rowIndex) => {
            row.forEach((cell, colIndex) => {
                if (cell === 1) {
                    // Create a square pixel by stacking 2 brbase objects vertically
                    const pixelX = digitX + colIndex * scale; // Normal width
                    const pixelY = baseY; // Keep Y constant for vertical wall
                    // Invert the row index to fix the upside-down numbers
                    const invertedRowIndex = pattern.length - 1 - rowIndex;
                    const pixelZ = billboardZ + invertedRowIndex * 16 * 2; // 2x stacking for height

                    // Place 2 objects stacked vertically
                    placeSceneryObject(pixelX, pixelY, pixelZ, objectId, color);
                    placeSceneryObject(pixelX, pixelY, pixelZ + 16, objectId, color);
                }
            });
        });
    });
}

/**
 * Places a number using scenery objects ON A VERTICAL WALL (mirrored view - identical to original)
 * Uses 2 brbase objects stacked vertically to create square "pixels"
 * Handles both single and two-digit numbers
 */
function placeMirroredNumberOnWall(
    number: number,
    baseX: number,
    baseY: number,
    billboardZ: number,
    objectId: number,
    color: number,
    scale: number,
) {
    const digits = getDigits(number);

    // Center the digits within the region
    const digitSpacing = 0.5; // Half a tile spacing between digits
    const totalWidth = digits.length * 5 + (digits.length - 1) * digitSpacing; // Each digit is 5 tiles wide + spacing
    const startX = baseX - (totalWidth * scale) / 2; // Center the digits

    // Reverse the digit order for mirrored view (10 becomes 01)
    digits.reverse().forEach((digit, digitIndex) => {
        const pattern = NUMBER_PATTERNS[digit as keyof typeof NUMBER_PATTERNS];

        if (!pattern) {
            console.log(`No pattern found for digit: ${digit}`);
            return;
        }

        // Calculate X offset for this digit with spacing between digits
        const digitSpacing = 0.5; // Half a tile spacing between digits
        const digitX = startX + digitIndex * (5 + digitSpacing) * scale;

        // Place the digit pattern on the vertical wall using 2 stacked objects for each pixel
        // HORIZONTALLY FLIP each digit for proper mirroring
        pattern.forEach((row, rowIndex) => {
            row.forEach((cell, colIndex) => {
                if (cell === 1) {
                    // Create a square pixel by stacking 2 brbase objects vertically
                    // HORIZONTALLY FLIP: reverse the column index
                    const flippedColIndex = row.length - 1 - colIndex;
                    const pixelX = digitX + flippedColIndex * scale; // Flipped X position
                    const pixelY = baseY; // Keep Y constant for vertical wall
                    // Invert the row index to fix the upside-down numbers
                    const invertedRowIndex = pattern.length - 1 - rowIndex;
                    const pixelZ = billboardZ + invertedRowIndex * 16 * 2; // 2x stacking for height

                    // Place 2 objects stacked vertically
                    placeSceneryObject(pixelX, pixelY, pixelZ, objectId, color);
                    placeSceneryObject(pixelX, pixelY, pixelZ + 16, objectId, color);
                }
            });
        });
    });
}

// Removed unused flat-surface number placement helper to satisfy linter

/**
 * Clears the billboard area to prevent placement conflicts
 */
function clearBillboardArea(baseX: number, baseY: number, size: number, _scale: number) {
    const tileX = Math.floor(baseX / 32);
    const tileY = Math.floor(baseY / 32);
    
    // Clear a square area for the billboard
    for (let x = 0; x < size; x++) {
        for (let y = 0; y < size; y++) {
            const currentTileX = tileX + x;
            const currentTileY = tileY + y;
            
            if (currentTileX >= 0 && currentTileX < map.size.x && currentTileY >= 0 && currentTileY < map.size.y) {
                const tile = map.getTile(currentTileX, currentTileY);
                
                // Remove all small scenery elements from this tile
                for (let i = tile.elements.length - 1; i >= 0; i--) {
                    if (tile.elements[i].type === 'small_scenery') {
                        const element = tile.elements[i] as SmallSceneryElement;
                        const removeAction = { 
                            x: currentTileX * 32, 
                            y: currentTileY * 32, 
                            z: element.baseZ, 
                            object: element.object, 
                            quadrant: 0 
                        };
                        context.executeAction('smallsceneryremove', removeAction, () => {
                            // Ignore errors - element might already be removed
                        });
                    }
                }
            }
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
                    // Rate-limit this specific error to 5 logs per second using a suppression key
                    logger.error(
                        'Land not owned by park - scenery placement failed',
                        5,
                        'land-rights',
                    );
                } else {
                    logger.error(
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
                            logger.error(
                                'Failed to add cash for scenery placement:',
                                cashResult.errorMessage,
                            );
                            return;
                        }
                        context.executeAction('smallsceneryplace', sceneryArgs, (placeResult) => {
                            if (placeResult.error) {
                                logger.error(
                                    `Failed to place scenery at (${x}, ${y}), z: ${z} - ${placeResult.errorMessage}`,
                                );
                            }
                        });
                    },
                );
            } else {
                context.executeAction('smallsceneryplace', sceneryArgs, (placeResult) => {
                    if (placeResult.error) {
                        logger.error(
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
        // Nothing to remove → avoid triggering engine "not found" logs
        tryPlace();
    }
}

/**
 * Clears the scoreboard area
 */
export function clearScoreboard() {
    console.log('Clearing scoreboard...');

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
                    if (elements[i].type === 'small_scenery') {
                        const element = elements[i] as SmallSceneryElement;
                        // Check for elements within the 2x stacked height range
                        if (
                            element.baseZ >= billboardZ &&
                            element.baseZ < billboardZ + BILLBOARD_SIZE * 16 * 2
                        ) {
                            tile.removeElement(i);
                        }
                    }
                }
            }
        }
    }

    // Clear mirrored billboard (one tile behind)
    const mirroredY = (BILLBOARD_OFFSET_Y + 1) * 32;
    for (let x = 0; x < BILLBOARD_SIZE; x++) {
        for (let y = 0; y < BILLBOARD_SIZE; y++) {
            const tileX = Math.floor((billboardX + x * 32) / 32);
            const tileY = Math.floor((mirroredY + y * 32) / 32);

            if (tileX >= 0 && tileX < mapSize.x && tileY >= 0 && tileY < mapSize.y) {
                const tile = map.getTile(tileX, tileY);
                const elements = tile.elements;

                // Remove small scenery elements at the billboard height
                for (let i = elements.length - 1; i >= 0; i--) {
                    if (elements[i].type === 'small_scenery') {
                        const element = elements[i] as SmallSceneryElement;
                        // Check for elements within the 2x stacked height range
                        if (
                            element.baseZ >= billboardZ &&
                            element.baseZ < billboardZ + BILLBOARD_SIZE * 16 * 2
                        ) {
                            tile.removeElement(i);
                        }
                    }
                }
            }
        }
    }

    console.log('Scoreboard cleared!');
}

/**
 * Updates a single player's score on both billboards
 */
export function updateScore(playerNumber: number, newScore: number) {
    console.log(`Updating Player ${playerNumber} score to: ${newScore}`);

    const mapSize = map.size;
    const billboardX = (mapSize.x - BILLBOARD_SIZE - BILLBOARD_OFFSET_X) * 32;
    const billboardY = BILLBOARD_OFFSET_Y * 32;
    const mirroredY = (BILLBOARD_OFFSET_Y + 1) * 32; // One tile behind

    const identifier = BILLBOARD_OBJECT;
    const loadedObject = objectManager.load(identifier);

    if (!loadedObject) {
        console.log('Failed to load billboard object:', identifier);
        return;
    }

    const objectId = loadedObject.index;
    const scale = 32;
    const billboardZ = 8 * 16; // Same height as creation

    // Clear and redraw the player's region on both billboards
    updatePlayerRegion(
        billboardX,
        billboardY,
        objectId,
        billboardZ,
        scale,
        playerNumber,
        newScore,
        false,
    );
    updatePlayerRegion(
        billboardX,
        mirroredY,
        objectId,
        billboardZ,
        scale,
        playerNumber,
        newScore,
        true,
    );

    console.log(`Player ${playerNumber} score updated to ${newScore}!`);
}

/**
 * Updates a single player's region on a billboard
 */
function updatePlayerRegion(
    baseX: number,
    baseY: number,
    objectId: number,
    billboardZ: number,
    scale: number,
    playerNumber: number,
    newScore: number,
    isMirrored: boolean,
) {
    // Calculate the center of the billboard for proper 2x2 grid positioning
    const centerX = baseX + (BILLBOARD_SIZE / 2) * scale;
    const centerZ = billboardZ + (BILLBOARD_SIZE / 2) * 16 * 2; // 2x stacking

    // Calculate region positions within the square billboard
    const regionOffset = (REGION_SIZE + REGION_SPACING) / 2; // Half the region size + spacing

    // Get the player's region position based on whether it's mirrored or not
    let regionX: number, regionZ: number;

    if (isMirrored) {
        // Mirrored layout: bottom becomes top, top becomes bottom
        switch (playerNumber) {
            case 0: // Player 1 -> top-left becomes bottom-left
                regionX = centerX - regionOffset * scale;
                regionZ = centerZ - regionOffset * 16 * 2;
                break;
            case 1: // Player 2 -> top-right becomes bottom-right
                regionX = centerX + regionOffset * scale;
                regionZ = centerZ - regionOffset * 16 * 2;
                break;
            case 2: // Player 3 -> bottom-left becomes top-left
                regionX = centerX - regionOffset * scale;
                regionZ = centerZ + regionOffset * 16 * 2;
                break;
            case 3: // Player 4 -> bottom-right becomes top-right
                regionX = centerX + regionOffset * scale;
                regionZ = centerZ + regionOffset * 16 * 2;
                break;
            default:
                console.log(`Invalid player number: ${playerNumber}`);
                return;
        }
    } else {
        // Original layout
        switch (playerNumber) {
            case 0: // Player 1 -> top-left
                regionX = centerX - regionOffset * scale;
                regionZ = centerZ + regionOffset * 16 * 2;
                break;
            case 1: // Player 2 -> top-right
                regionX = centerX + regionOffset * scale;
                regionZ = centerZ + regionOffset * 16 * 2;
                break;
            case 2: // Player 3 -> bottom-left
                regionX = centerX - regionOffset * scale;
                regionZ = centerZ - regionOffset * 16 * 2;
                break;
            case 3: // Player 4 -> bottom-right
                regionX = centerX + regionOffset * scale;
                regionZ = centerZ - regionOffset * 16 * 2;
                break;
            default:
                console.log(`Invalid player number: ${playerNumber}`);
                return;
        }
    }

    // Validate coordinates before proceeding
    const mapSize = map.size;
    const tileX = Math.floor(regionX / 32);
    const tileY = Math.floor(regionZ / 32);

    console.log(`Updating player ${playerNumber} at coordinates:`, {
        regionX,
        regionZ,
        tileX,
        tileY,
        mapBounds: { x: mapSize.x, y: mapSize.y },
        isMirrored,
    });

    // Check if coordinates are within map bounds
    if (tileX < 0 || tileX >= mapSize.x || tileY < 0 || tileY >= mapSize.y) {
        console.log(
            `Coordinates out of bounds: tileX=${tileX}, tileY=${tileY}, mapSize=${mapSize.x}x${mapSize.y}`,
        );
        return;
    }

    // Clear the player's region by redrawing the black background
    clearPlayerRegion(baseY, regionX, regionZ, objectId, scale);

    // Recreate the colored border around the player region
    let color: number;
    switch (playerNumber) {
        case 0: // Player 1 -> Green (top-left)
            color = PLAYER_COLORS[2]; // Bright Green
            break;
        case 1: // Player 2 -> Yellow (top-right)
            color = PLAYER_COLORS[3]; // Yellow
            break;
        case 2: // Player 3 -> Red (bottom-left)
            color = PLAYER_COLORS[0]; // Bright Red
            break;
        case 3: // Player 4 -> Blue (bottom-right)
            color = PLAYER_COLORS[1]; // Light Blue (this might be the issue)
            break;
        default:
            console.log(`Invalid player number: ${playerNumber}`);
            return;
    }

    createPlayerRegionBorder(regionX, regionZ, objectId, color, scale, baseY);

    // Place the new score number
    const numberX = regionX; // Center horizontally (will be handled in placeNumberOnWall)
    const numberY = baseY; // Keep Y constant for vertical wall
    const numberZ = regionZ - 3 * 16 * 2; // Center vertically (number is ~6 tiles tall with 2x stacking)

    if (isMirrored) {
        placeMirroredNumberOnWall(newScore, numberX, numberY, numberZ, objectId, color, scale);
    } else {
        placeNumberOnWall(newScore, numberX, numberY, numberZ, objectId, color, scale);
    }
}

/**
 * Clears a player's region by redrawing the black background
 * Always uses two-digit clearing area for consistency
 */
function clearPlayerRegion(
    baseY: number,
    regionX: number,
    regionZ: number,
    objectId: number,
    scale: number,
) {
    // Always use two-digit clearing area (10 tiles + 0.5 spacing + 4 padding = 14.5 tiles wide)
    const digitSpacing = 0.5; // Half a tile spacing between digits
    const twoDigitWidth = 10 + digitSpacing; // 2 digits * 5 tiles each + 1 spacing
    const regionStartX = regionX - (twoDigitWidth * scale) / 2; // Center the clearing area
    const regionStartZ = regionZ - 3 * 16 * 2; // Center vertically

    // Add extra padding to ensure complete clearing (2 tiles on each side + border thickness)
    const padding = 2;
    const borderThickness = 2; // Account for thicker borders
    const clearWidth = twoDigitWidth + padding * 2 + borderThickness * 2; // 14.5 + 4 = 18.5 tiles total
    const clearStartX = regionStartX - padding * scale - borderThickness * scale;
    const clearStartZ = regionStartZ - padding * 16 * 2 - borderThickness * 16 * 2;
    const clearHeight = 7 + padding * 2 + borderThickness * 2;

    // Clear the area by redrawing black background
    for (let x = 0; x < clearWidth; x++) {
        for (let z = 0; z < clearHeight; z++) {
            const clearX = clearStartX + x * scale;
            const clearY = baseY;
            const clearZ = clearStartZ + z * 16 * 2;

            // Place 2 black objects stacked vertically to clear the area
            placeSceneryObject(clearX, clearY, clearZ, objectId, 0); // Black color (0)
            placeSceneryObject(clearX, clearY, clearZ + 16, objectId, 0);
        }
    }
}

const billboardField = () => {
    const mapSize = map.size;
    const billboardX = (mapSize.x - BILLBOARD_SIZE - BILLBOARD_OFFSET_X) * 32;
    const billboardY = BILLBOARD_OFFSET_Y * 32;

    return {
        x1: billboardX / 32, // Left edge
        x2: billboardX / 32 + BILLBOARD_SIZE, // Right edge (46 tiles wide)
        y1: billboardY / 32, // Top edge
        y2: billboardY / 32 + 1, // Bottom edge (2 tiles thick: y1 to y1+1)
        // Also return the original coordinates for internal use
        x: billboardX,
        y: billboardY,
    };
};
