import { debugMode } from "../../utils";
import { COLOUR_VALUES, executeAll, getBillboardTiles } from "./scoreboard";

/*
 * Bingo celebration: a big "BINGO" panel halfway between the player regions and the scoreboard
 * billboard (across the middle of the map in COOP), its letters and border recoloured as a moving
 * colour wave, then removed again.
 *
 * Like the scoreboard, every block is placed once and only recoloured afterwards
 * (smallscenerysetcolour), and removed at the exact height it was placed: placing and removing
 * the letters for every colour (the old animation) was slow and could leave blocks behind.
 * Sandbox mode (needed to build outside the park) is only on while placing and removing; the
 * sign's tile row is park land during the celebration, so it can be recoloured.
 */

const SIGN_OBJECT = "rct2.scenery_small.brbase";
/** The player regions cover the original 130x130 map; the billboard stands behind them */
const PLAYER_AREA_SIZE = 130;
/** A letter pixel is SCALE x SCALE sign pixels; a sign pixel is one tile wide and two blocks (32 z) tall */
const SCALE = 2;
const FRAMES = 16;
const FRAME_MS = 500;

// OpenRCT2 colours: bright red, dark orange, bright yellow, bright green, light blue, bright purple
const RAINBOW = [28, 21, 17, 14, 7, 5];
const WHITE = 2;
const BLACK = 0;

/** Letters top row first, 1 = block */
const LETTERS: number[][][] = [
    [
        [1, 1, 1, 1, 0],
        [1, 0, 0, 1, 0],
        [1, 1, 1, 1, 0],
        [1, 0, 0, 1, 0],
        [1, 1, 1, 1, 0],
    ],
    [[1], [1], [1], [1], [1]],
    [
        [1, 0, 0, 0, 1],
        [1, 1, 0, 0, 1],
        [1, 0, 1, 0, 1],
        [1, 0, 0, 1, 1],
        [1, 0, 0, 0, 1],
    ],
    [
        [0, 1, 1, 1],
        [1, 0, 0, 0],
        [1, 0, 1, 1],
        [1, 0, 0, 1],
        [0, 1, 1, 1],
    ],
    [
        [0, 1, 1, 1],
        [1, 0, 0, 1],
        [1, 0, 0, 1],
        [1, 0, 0, 1],
        [0, 1, 1, 1],
    ],
];
const LETTER_GAP = 1;
const LETTER_HEIGHT = 5;
/** Around the letters (in sign pixels): one black ring, then the coloured border */
const MARGIN = 2;
/** Land owned by the park: OwnershipFlag::landOwned is bit 1 of the surface's ownership flags */
const OWNERSHIP_OWNED = 1 << 1;

interface SignBlock {
    x: number;
    y: number;
    z: number;
    /** Column in letter pixels, for the colour wave; null for the black background */
    column: number | null;
}

interface SignLayout {
    blocks: SignBlock[];
    centre: CoordsXY;
    /** The sign's tiles with their land ownership before the celebration */
    tiles: { x: number; y: number; ownership: number }[];
}

let running = false;

/**
 * Where the sign stands: halfway between the player regions and the billboard (PvP/Lockout), or
 * across the middle of the map when there is no billboard (COOP)
 */
function getSignRow(width: number): { firstTileX: number; tileY: number } {
    const billboard = getBillboardTiles();
    if (billboard.frontRow < map.size.y) {
        return {
            firstTileX: billboard.x1 + Math.floor((billboard.width - width) / 2),
            tileY: Math.floor((PLAYER_AREA_SIZE + billboard.frontRow) / 2),
        };
    }
    return { firstTileX: Math.floor((map.size.x - width) / 2), tileY: Math.floor(map.size.y / 2) };
}

/** The word as a grid of letter pixels, [column][row from the bottom] */
function getWordPixels(): boolean[][] {
    const columns: boolean[][] = [];
    LETTERS.forEach((letter, index) => {
        if (index > 0) {
            for (let i = 0; i < LETTER_GAP; i++) columns.push([false, false, false, false, false]);
        }
        for (let col = 0; col < letter[0].length; col++) {
            const column: boolean[] = [];
            for (let row = 0; row < LETTER_HEIGHT; row++) {
                column.push(letter[LETTER_HEIGHT - 1 - row][col] === 1);
            }
            columns.push(column);
        }
    });
    return columns;
}

/**
 * A solid panel: coloured letters and border on a black background. It stands on the ground or,
 * where something is built in the row (COOP), floats just above it.
 */
function layoutSign(): SignLayout {
    const word = getWordPixels();
    // In sign pixels (one tile wide, two blocks tall)
    const panelColumns = word.length * SCALE + 2 * MARGIN;
    const panelRows = LETTER_HEIGHT * SCALE + 2 * MARGIN;
    const width = panelColumns;
    const { firstTileX, tileY } = getSignRow(width);

    let baseZ = 0;
    const tiles: SignLayout["tiles"] = [];
    for (let tileX = firstTileX; tileX < firstTileX + width; tileX++) {
        map.getTile(tileX, tileY).elements.forEach((element) => {
            if (element.type === "surface") {
                baseZ = Math.max(baseZ, element.baseZ);
                tiles.push({ x: tileX * 32, y: tileY * 32, ownership: (element as SurfaceElement).ownership });
            } else {
                baseZ = Math.max(baseZ, element.clearanceZ);
            }
        });
    }

    const blocks: SignBlock[] = [];
    for (let col = 0; col < panelColumns; col++) {
        for (let row = 0; row < panelRows; row++) {
            const isBorder = col === 0 || row === 0 || col === panelColumns - 1 || row === panelRows - 1;
            const wordColumn = col >= MARGIN ? word[Math.floor((col - MARGIN) / SCALE)] : undefined;
            const isLetter = !!wordColumn && row >= MARGIN && !!wordColumn[Math.floor((row - MARGIN) / SCALE)];
            const column = isBorder || isLetter ? Math.floor(col / SCALE) : null;

            for (let k = 0; k < 2; k++) {
                blocks.push({
                    // x runs left to right as seen from the player regions
                    x: (firstTileX + col) * 32,
                    y: tileY * 32,
                    z: baseZ + row * 32 + k * 16,
                    column,
                });
            }
        }
    }

    return {
        blocks,
        centre: { x: firstTileX * 32 + (width * 32) / 2, y: tileY * 32 },
        tiles,
    };
}

/**
 * Recolouring needs park-owned land, and the sign usually stands outside the park. Changing
 * ownership needs sandbox mode.
 */
function setOwnership(tiles: SignLayout["tiles"], ownership: number | null, onDone: () => void): void {
    const actions = tiles.map((tile) => ({
        name: "landsetrights",
        // null: back to what each tile had before
        args: { x1: tile.x, y1: tile.y, x2: tile.x, y2: tile.y, setting: 4, ownership: ownership === null ? tile.ownership : ownership },
    }));
    executeAll(actions, (failures, firstError) => {
        if (failures > 0) console.log(`[Celebration] Couldn't set the land ownership of ${failures} tiles: ${firstError}`);
        onDone();
    });
}

/** Rainbow wave, or the winner's colour with white stripes running through it */
function getPalette(winnerColour: string | null): number[] {
    const colour = winnerColour ? COLOUR_VALUES[winnerColour] : undefined;
    return colour === undefined ? RAINBOW : [colour, colour, colour, WHITE];
}

function colourAt(palette: number[], block: SignBlock, frame: number): number {
    return block.column === null ? BLACK : palette[(block.column + frame) % palette.length];
}

/**
 * Pays for a batch of placements/removals up front, so it works whatever the park's cash and
 * leaves the park's money as it was (removals refund)
 */
function withCostCovered(actions: { name: string; args: object }[], run: () => void): void {
    if (actions.length === 0) {
        run();
        return;
    }
    context.queryAction(actions[0].name as ActionType, actions[0].args, (query) => {
        const cost = query.error ? 0 : (query.cost || 0) * actions.length;
        if (cost === 0) {
            run();
            return;
        }
        context.executeAction("addCash", { args: { cash: cost } }, () => run());
    });
}

/**
 * Starts the celebration (server only). winnerColour colours it for a winner; null shows a
 * rainbow. Returns false when it couldn't start, e.g. because one is still running.
 */
export function celebrate(winnerColour: string | null): boolean {
    if (running || network.mode === "client") return false;

    const loaded = objectManager.load(SIGN_OBJECT);
    if (!loaded) {
        console.log(`[Celebration] Couldn't load ${SIGN_OBJECT}`);
        return false;
    }
    const objectId = loaded.index;
    const palette = getPalette(winnerColour);
    const { blocks, centre, tiles } = layoutSign();
    running = true;
    console.log(`[Celebration] ${winnerColour || "rainbow"}: ${blocks.length} blocks`);

    // Everyone looks at the celebration
    context.executeAction("moveTo", { args: { x: centre.x, y: centre.y } });

    const placements = blocks.map((block) => ({
        name: "smallsceneryplace",
        args: {
            x: block.x,
            y: block.y,
            z: block.z,
            direction: 0,
            object: objectId,
            quadrant: 0,
            primaryColour: colourAt(palette, block, 0),
            secondaryColour: 0,
            tertiaryColour: 0,
        },
    }));
    const removals = blocks.map((block) => ({
        name: "smallsceneryremove",
        args: { x: block.x, y: block.y, z: block.z, object: objectId, quadrant: 0 },
    }));

    const finish = () => {
        withCostCovered(removals, () => {
            debugMode(1, () => {
                executeAll(removals, (failures, firstError) => {
                    if (failures > 0) console.log(`[Celebration] ${failures} removals failed: ${firstError}`);
                    setOwnership(tiles, null, () => {
                        debugMode(0, () => {
                            running = false;
                        });
                    });
                });
            });
        });
    };

    const animate = (frame: number) => {
        if (frame >= FRAMES) {
            finish();
            return;
        }

        // Only blocks whose colour changes
        blocks.forEach((block) => {
            const colour = colourAt(palette, block, frame);
            if (colour === colourAt(palette, block, frame - 1)) return;
            context.executeAction("smallscenerysetcolour", {
                x: block.x,
                y: block.y,
                z: block.z,
                quadrant: 0,
                sceneryType: objectId,
                primaryColour: colour,
                secondaryColour: 0,
                tertiaryColour: 0,
            });
        });

        context.setTimeout(() => animate(frame + 1), FRAME_MS);
    };

    withCostCovered(placements, () => {
        debugMode(1, () => {
            setOwnership(tiles, OWNERSHIP_OWNED, () => {
                executeAll(placements, (failures, firstError) => {
                    if (failures > 0) console.log(`[Celebration] ${failures}/${placements.length} placements failed: ${firstError}`);
                    debugMode(0, () => animate(1));
                });
            });
        });
    });
    return true;
}
