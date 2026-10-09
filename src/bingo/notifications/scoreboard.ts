// Billboard system for displaying PvP scores
import { debugMode } from 'src/utils';
import { config } from '../../config';
import { logger } from '../../logger';

/*
 * How the scoreboard works
 *
 * Two vertical walls of 'brbase' blocks stand back to back: the front face on tile row
 * BILLBOARD_OFFSET_Y and the back face one tile behind it. Each face is a grid of
 * BILLBOARD_SIZE x BILLBOARD_SIZE pixels (columns left to right as seen by the viewer, rows
 * bottom to top). A pixel is two blocks stacked at z and z + 16.
 *
 * createScoreboard() clears the area and places every block exactly once, already in its final
 * colour. After that, blocks are never removed or placed again: updateScore() only repaints the
 * blocks of one player's region whose colour actually changes (smallscenerysetcolour).
 *
 * Why: on a server, executeAction is validated against the map when it is called but executed
 * later from a queue. Painting the same pixel several times in one go (wall, background, border,
 * digit) used to stack duplicate blocks on the same spot, after which remove-then-place updates
 * failed with "Base Block in the way" and old digits stayed visible.
 */

const BILLBOARD_SIZE = 46; // pixels per side
const BILLBOARD_OFFSET_X = 42; // Distance from map edge
const BILLBOARD_OFFSET_Y = 185; // Tile row of the front face; the back face is one tile behind
const BILLBOARD_Z = 8 * 16; // Height of the bottom pixel row
const BACKGROUND_COLOUR = 0; // Black

// Player regions: 2x2 grid of REGION_SIZE squares with a coloured border
const REGION_SIZE = 20;
const BORDER_THICKNESS = 2;

const EXTEND_MAP_SIZE_Y = 192;
const EXTEND_MAP_SIZE_X = 130;

// Scenery object for building the billboard
const BILLBOARD_OBJECT = 'rct2.scenery_small.brbase';

// Highest score that fits in a region (two digits)
const MAX_DISPLAY_SCORE = 99;

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

const COLOUR_VALUES: { [colour: string]: number } = {
    red: config.playerColors.player1,
    blue: config.playerColors.player2,
    green: config.playerColors.player3,
    yellow: config.playerColors.player4,
};

/**
 * Scoreboard slots (the index is the "playerNumber" used by updateScore). front/back is the
 * bottom-left pixel of the region as seen by a viewer looking at that face. The back is the
 * front turned around, so seen from behind it reads:
 *
 *   front:  green  | yellow      back:  blue   | red
 *           red    | blue               yellow | green
 */
const SCOREBOARD_SLOTS = [
    { colour: 'green', front: { col: 2, row: 24 }, back: { col: 24, row: 2 } },
    { colour: 'yellow', front: { col: 24, row: 24 }, back: { col: 2, row: 2 } },
    { colour: 'red', front: { col: 2, row: 2 }, back: { col: 24, row: 24 } },
    { colour: 'blue', front: { col: 24, row: 2 }, back: { col: 2, row: 24 } },
];

/**
 * Scoreboard slot for a player colour (red, green, blue, yellow), or null if unknown
 */
export function getScoreboardSlotForColour(colour: string): number | null {
    for (let i = 0; i < SCOREBOARD_SLOTS.length; i++) {
        if (SCOREBOARD_SLOTS[i].colour === colour) return i;
    }
    return null;
}

interface Face {
    tileY: number;
    mirrored: boolean; // back face: viewer's left is +x
}

function getSlotOrigin(slot: (typeof SCOREBOARD_SLOTS)[number], face: Face): { col: number; row: number } {
    return face.mirrored ? slot.back : slot.front;
}

interface Block {
    x: number;
    y: number;
    z: number;
    key: string;
}

// Colour last requested for each block. Repaints are queued on the server, so the map can lag
// behind; diffing against what we asked for keeps quick successive updates correct.
let requestedColours: { [key: string]: number } = {};

function getFaces(): Face[] {
    return [
        { tileY: BILLBOARD_OFFSET_Y, mirrored: false },
        { tileY: BILLBOARD_OFFSET_Y + 1, mirrored: true },
    ];
}

function getBaseTileX(): number {
    return map.size.x - BILLBOARD_SIZE - BILLBOARD_OFFSET_X;
}

/**
 * The two stacked blocks that make up pixel (col, row) on a face
 */
function getPixelBlocks(face: Face, col: number, row: number): Block[] {
    const tileX = getBaseTileX() + (face.mirrored ? BILLBOARD_SIZE - 1 - col : col);
    const z = BILLBOARD_Z + row * 32;
    const blocks: Block[] = [];
    for (let k = 0; k < 2; k++) {
        blocks.push({
            x: tileX * 32,
            y: face.tileY * 32,
            z: z + k * 16,
            key: `${face.tileY}:${col}:${row}:${k}`,
        });
    }
    return blocks;
}

/**
 * Pixels (relative to the region's bottom-left) that are lit for a score
 */
function getDigitPixels(score: number): { [key: string]: boolean } {
    const clamped = Math.max(0, Math.min(MAX_DISPLAY_SCORE, Math.floor(score)));
    if (clamped !== score) {
        console.log(`[Scoreboard] Score ${score} can't be shown, displaying ${clamped}`);
    }

    const digits = String(clamped).split('').map(Number);
    const width = digits.length * 5 + (digits.length - 1); // 1 column gap between digits
    const startCol = Math.floor((REGION_SIZE - width) / 2);
    const startRow = Math.floor((REGION_SIZE - 7) / 2);

    const lit: { [key: string]: boolean } = {};
    digits.forEach((digit, digitIndex) => {
        const pattern = NUMBER_PATTERNS[digit as keyof typeof NUMBER_PATTERNS];
        pattern.forEach((patternRow, patternRowIndex) => {
            patternRow.forEach((cell, patternCol) => {
                if (cell === 1) {
                    const col = startCol + digitIndex * 6 + patternCol;
                    const row = startRow + (pattern.length - 1 - patternRowIndex); // pattern row 0 is the top
                    lit[`${col}:${row}`] = true;
                }
            });
        });
    });
    return lit;
}

/**
 * Colour of a pixel inside a region, (dc, dr) relative to the region's bottom-left
 */
function getRegionPixelColour(
    slotColour: number,
    digitPixels: { [key: string]: boolean },
    dc: number,
    dr: number,
): number {
    const isBorder =
        dc < BORDER_THICKNESS ||
        dr < BORDER_THICKNESS ||
        dc >= REGION_SIZE - BORDER_THICKNESS ||
        dr >= REGION_SIZE - BORDER_THICKNESS;
    return isBorder || digitPixels[`${dc}:${dr}`] ? slotColour : BACKGROUND_COLOUR;
}

/**
 * Colour of every pixel on a face for the given slot scores
 */
function getBoardColours(scores: number[], face: Face): number[][] {
    const colours: number[][] = [];
    for (let col = 0; col < BILLBOARD_SIZE; col++) {
        colours.push([]);
        for (let row = 0; row < BILLBOARD_SIZE; row++) {
            colours[col].push(BACKGROUND_COLOUR);
        }
    }

    SCOREBOARD_SLOTS.forEach((slot, index) => {
        const slotColour = COLOUR_VALUES[slot.colour];
        const digitPixels = getDigitPixels(scores[index] || 0);
        const origin = getSlotOrigin(slot, face);
        for (let dc = 0; dc < REGION_SIZE; dc++) {
            for (let dr = 0; dr < REGION_SIZE; dr++) {
                colours[origin.col + dc][origin.row + dr] = getRegionPixelColour(slotColour, digitPixels, dc, dr);
            }
        }
    });
    return colours;
}

function loadBillboardObject(): number | null {
    const loadedObject = objectManager.load(BILLBOARD_OBJECT);
    if (!loadedObject) {
        console.log('[Scoreboard] Failed to load billboard object:', BILLBOARD_OBJECT);
        return null;
    }
    return loadedObject.index;
}

interface ExistingBlock {
    primaryColour: number;
    quadrant: number;
}

/**
 * Billboard blocks on one tile, by z. Reading tile elements is slow (every read builds an
 * object per element and a billboard tile holds ~90 blocks), so callers read each tile once.
 */
function readBillboardTile(x: number, y: number, objectId: number): { [z: number]: ExistingBlock } {
    const blocks: { [z: number]: ExistingBlock } = {};
    const elements = map.getTile(x / 32, y / 32).elements;
    for (let i = 0; i < elements.length; i++) {
        const element = elements[i];
        if (element.type !== 'small_scenery') continue;
        const scenery = element as SmallSceneryElement;
        if (scenery.object !== objectId) continue;
        blocks[scenery.baseZ] = { primaryColour: scenery.primaryColour, quadrant: scenery.quadrant };
    }
    return blocks;
}

/**
 * Runs the given actions and calls onDone once every callback has fired (callbacks also fire
 * for actions that fail validation). Returns the number of failures through onDone.
 */
function executeAll(
    actions: { name: string; args: object }[],
    onDone: (failures: number, firstError: string | undefined) => void,
): void {
    if (actions.length === 0) {
        onDone(0, undefined);
        return;
    }

    let remaining = actions.length;
    let failures = 0;
    let firstError: string | undefined = undefined;
    actions.forEach((action) => {
        context.executeAction(action.name as ActionType, action.args, (result) => {
            if (result.error) {
                failures++;
                if (firstError === undefined) firstError = result.errorMessage;
            }
            remaining--;
            if (remaining === 0) {
                onDone(failures, firstError);
            }
        });
    });
}

/**
 * Removes every small scenery element from the billboard tiles
 */
function clearBillboardBlocks(onDone: () => void): void {
    const removals: { name: string; args: object }[] = [];
    const baseTileX = getBaseTileX();

    getFaces().forEach((face) => {
        for (let col = 0; col < BILLBOARD_SIZE; col++) {
            const tileX = baseTileX + col;
            if (tileX < 0 || tileX >= map.size.x || face.tileY >= map.size.y) continue;

            const tile = map.getTile(tileX, face.tileY);
            tile.elements.forEach((element) => {
                if (element.type !== 'small_scenery') return;
                const scenery = element as SmallSceneryElement;
                removals.push({
                    name: 'smallsceneryremove',
                    args: {
                        x: tileX * 32,
                        y: face.tileY * 32,
                        z: scenery.baseZ,
                        object: scenery.object,
                        quadrant: scenery.quadrant,
                    },
                });
            });
        }
    });

    requestedColours = {};
    executeAll(removals, (failures, firstError) => {
        console.log(`[Scoreboard] Removed ${removals.length - failures}/${removals.length} old blocks`);
        if (failures > 0) {
            console.log(`[Scoreboard] ${failures} removals failed, first error: ${firstError}`);
        }
        onDone();
    });
}

/**
 * Places every billboard block once, in its final colour, for the given scores
 */
function buildBillboard(objectId: number, scores: number[], onDone: () => void): void {
    const placements: { name: string; args: object }[] = [];

    getFaces().forEach((face) => {
        const colours = getBoardColours(scores, face);
        for (let col = 0; col < BILLBOARD_SIZE; col++) {
            for (let row = 0; row < BILLBOARD_SIZE; row++) {
                getPixelBlocks(face, col, row).forEach((block) => {
                    requestedColours[block.key] = colours[col][row];
                    placements.push({
                        name: 'smallsceneryplace',
                        args: {
                            x: block.x,
                            y: block.y,
                            z: block.z,
                            direction: 0,
                            object: objectId,
                            quadrant: 0,
                            primaryColour: colours[col][row],
                            secondaryColour: 0,
                            tertiaryColour: 0,
                        },
                    });
                });
            }
        }
    });

    // Pay for all blocks up front instead of once per block
    context.queryAction('smallsceneryplace', placements[0].args as SmallSceneryPlaceArgs, (query) => {
        const totalCost = query.error ? 0 : (query.cost || 0) * placements.length;
        const placeAll = () =>
            executeAll(placements, (failures, firstError) => {
                console.log(`[Scoreboard] Placed ${placements.length - failures}/${placements.length} blocks`);
                if (failures > 0) {
                    console.log(`[Scoreboard] ${failures} placements failed, first error: ${firstError}`);
                }
                onDone();
            });

        if (totalCost > 0) {
            context.executeAction('addCash', { args: { cash: totalCost } }, placeAll);
        } else {
            placeAll();
        }
    });
}

/**
 * Creates the scoreboard: a 2x2 grid of player regions on a two-sided vertical billboard
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

                                const objectId = loadBillboardObject();
                                if (objectId === null) {
                                    debugMode(0, () => {});
                                    return;
                                }

                                // Clear first, then place each block once - never on top of an old one
                                clearBillboardBlocks(() => {
                                    buildBillboard(objectId, [0, 0, 0, 0], () => {
                                        console.log('[Scoreboard] Scoreboard created');
                                        debugMode(0, () => {
                                            logger.debug('[SCOREBOARD] Debug mode disabled.');
                                        });
                                    });
                                });
                            },
                        );
                    },
                );
            },
        );
    });
}

/**
 * Removes the scoreboard
 */
export function clearScoreboard() {
    console.log('Clearing scoreboard...');
    clearBillboardBlocks(() => {
        console.log('Scoreboard cleared!');
    });
}

/**
 * Updates one scoreboard slot (see SCOREBOARD_SLOTS) on both faces by repainting only the
 * blocks whose colour changes
 */
export function updateScore(playerNumber: number, newScore: number) {
    const slot = SCOREBOARD_SLOTS[playerNumber];
    if (!slot) {
        console.log(`[Scoreboard] Invalid scoreboard slot: ${playerNumber}`);
        return;
    }

    const objectId = loadBillboardObject();
    if (objectId === null) return;

    const startedAt = Date.now();
    const slotColour = COLOUR_VALUES[slot.colour];
    const digitPixels = getDigitPixels(newScore);
    const repaints: { name: string; args: object }[] = [];
    let missing = 0;

    getFaces().forEach((face) => {
        const origin = getSlotOrigin(slot, face);
        for (let dc = 0; dc < REGION_SIZE; dc++) {
            // Only read the map for blocks we have no record of (e.g. after a server restart),
            // and then only once for the whole tile column
            let tileBlocks: { [z: number]: ExistingBlock } | null = null;

            for (let dr = 0; dr < REGION_SIZE; dr++) {
                const colour = getRegionPixelColour(slotColour, digitPixels, dc, dr);

                getPixelBlocks(face, origin.col + dc, origin.row + dr).forEach((block) => {
                    let current: number | undefined = requestedColours[block.key];
                    let quadrant = 0; // blocks we place always use quadrant 0
                    if (current === undefined) {
                        if (!tileBlocks) tileBlocks = readBillboardTile(block.x, block.y, objectId);
                        const existing: ExistingBlock | undefined = tileBlocks[block.z];
                        if (!existing) {
                            missing++;
                            return;
                        }
                        current = existing.primaryColour;
                        quadrant = existing.quadrant;
                        requestedColours[block.key] = current;
                    }
                    if (current === colour) return;

                    requestedColours[block.key] = colour;
                    repaints.push({
                        name: 'smallscenerysetcolour',
                        args: {
                            x: block.x,
                            y: block.y,
                            z: block.z,
                            quadrant: quadrant,
                            sceneryType: objectId,
                            primaryColour: colour,
                            secondaryColour: 0,
                            tertiaryColour: 0,
                        },
                    });
                });
            }
        }
    });

    if (missing > 0) {
        console.log(`[Scoreboard] ${missing} blocks missing for ${slot.colour} - recreate the scoreboard`);
    }

    const preparedAt = Date.now();
    executeAll(repaints, (failures, firstError) => {
        if (failures > 0) {
            console.log(`[Scoreboard] ${failures}/${repaints.length} repaints failed for ${slot.colour}: ${firstError}`);
        }
        console.log(`[Scoreboard] ${slot.colour} repaints applied ${Date.now() - preparedAt} ms after queueing`);
    });
    console.log(
        `[Scoreboard] ${slot.colour} score set to ${newScore}: ${repaints.length} blocks to repaint, prepared in ${preparedAt - startedAt} ms`,
    );
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
