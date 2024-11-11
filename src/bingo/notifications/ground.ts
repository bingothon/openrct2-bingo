import { clearAndSetForSale, clearMap, clearMiddle, debugMode, ownMapSection } from "../../util";
let bingoBeingNotified = false;
type RandomMapSectionKey = "top-left" | "top-right" | "bottom-left" | "bottom-right";

const mapSections: RandomMapSectionKey[] = ["top-left", "top-right", "bottom-left", "bottom-right"];
let remainingSections: RandomMapSectionKey[] = [...mapSections];

/**
 * Places a small scenery object at specified coordinates with given parameters.
 * This function can be used for any small scenery object.
 * @param x - The x-coordinate for the object (can be outside map bounds).
 * @param y - The y-coordinate for the object (can be outside map bounds).
 * @param z - The z-coordinate (height) for placement.
 * @param direction - The direction of the object.
 * @param object - The ID of the scenery object to place.
 * @param quadrant - The quadrant to place the object in.
 * @param primaryColour - Primary color of the object.
 * @param secondaryColour - Secondary color of the object.
 * @param tertiaryColour - Tertiary color of the object.
 */
export function placeSmallSceneryObject({
    x,
    y,
    z,
    direction,
    object,
    quadrant,
    primaryColour,
    secondaryColour,
    tertiaryColour,
}: SmallSceneryPlaceArgs) {
    const args: SmallSceneryPlaceArgs = {
        x,
        y,
        z,
        direction,
        object,
        quadrant,
        primaryColour,
        secondaryColour,
        tertiaryColour,
    };

    context.executeAction("smallsceneryplace", args, (result) => {
        if (result.error) {
            console.log("Failed to place scenery object:", result.errorMessage);
        } else {
            console.log(`Successfully placed scenery object ${object} at coordinates (${x}, ${y}, ${z}).`);
        }
    });
}


export function notifyGroundBingo() {
    console.log("Notifying ground bingo...");
    context.executeAction("addCash", { args: { cash: 10000000 } }, (result) => {
        if (result.error) {
            console.log("Failed to add cash:", result.errorMessage);
        } else {
            console.log("Successfully added cash.");
            debugMode(1, () => {
                console.log("Debug mode enabled.");

                if (!bingoBeingNotified && network.mode === "server") {
                    bingoBeingNotified = true;
                    notifyBingoHelper();
                }

                // clearAndSetForSale('bottom-right', () => {
                //     
                // });

            });
        }
    });

    // console.log("Notifying ground bingo...");





}

function writingBingo(baseX: number, baseY: number, callback?: () => void) {
    const identifier = 'rct2.scenery_small.brbase';
    const loadedObject = objectManager.load(identifier);

    const z = 0;
    const scale = 32;
    const colors = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    const tickDelay = 500; // Time to wait between placement and removal

    const letters = {
        B: [
            [1, 1, 1, 1, 0],
            [1, 0, 0, 1, 0],
            [1, 1, 1, 1, 0],
            [1, 0, 0, 1, 0],
            [1, 1, 1, 1, 0]
        ].reverse(),
        I: [[1], [1], [1], [1], [1]].reverse(),
        N: [
            [1, 0, 0, 0, 1],
            [1, 1, 0, 0, 1],
            [1, 0, 1, 0, 1],
            [1, 0, 0, 1, 1],
            [1, 0, 0, 0, 1]
        ].reverse(),
        G: [
            [0, 1, 1, 1],
            [1, 0, 0, 0],
            [1, 0, 1, 1],
            [1, 0, 0, 1],
            [0, 1, 1, 1]
        ].reverse(),
        O: [
            [0, 1, 1, 1],
            [1, 0, 0, 1],
            [1, 0, 0, 1],
            [1, 0, 0, 1],
            [0, 1, 1, 1]
        ].reverse()
    };

    if (loadedObject) {
        const objectId = loadedObject.index;
        const letterOffsets = [0, 6, 9, 15, 21];
        const letterKeys = ["B", "I", "N", "G", "O"];

        let currentColorIndex = 0;

        function cycleColor() {
            if (currentColorIndex >= colors.length) {
                console.log("Completed all color cycles.");
                if (callback) callback();
                return;
            }

            const color = colors[currentColorIndex];
            console.log(`Displaying color ${color}`);

            // Place letters for the current color
            letterKeys.forEach((letter, index) => {
                placeLetter(
                    letters[letter as keyof typeof letters],
                    letterOffsets[index],
                    objectId,
                    baseX,
                    baseY,
                    z,
                    scale,
                    color
                );
            });

            // Wait for `tickDelay` before removing letters
            context.setTimeout(() => {
                letterKeys.forEach((letter, index) => {
                    removeLetter(
                        letters[letter as keyof typeof letters],
                        letterOffsets[index],
                        objectId,
                        baseX,
                        baseY,
                        z + 112 + (50 * 16),
                        scale
                    );
                });

                // Move to the next color cycle
                currentColorIndex++;
                context.setTimeout(cycleColor, tickDelay);
            }, tickDelay);
        }

        // Start the color cycle
        cycleColor();
    } else {
        console.log("Failed to load object.");
    }
}


function notifyBingoHelper() {
    const baseX = 53 * 32; // Adjust these coordinates to center "BINGO"
    const baseY = 63 * 32; // Adjust these coordinates to center "BINGO"

    const width = 21 * 32; // Approximate width of "BINGO"
    const height = 5 * 32; // Approximate height of "BINGO"

    type RandomMapSectionKey = "top-right" | "bottom-left" | "bottom-right";
    const mapSections = ["top-right", "bottom-left", "bottom-right"] as RandomMapSectionKey[];

    // Use a static variable to track remaining sections across calls
    if (!notifyBingoHelper.remainingSections) {
        notifyBingoHelper.remainingSections = [...mapSections];
    }

    // Ensure there are remaining sections to choose from
    if (notifyBingoHelper.remainingSections.length === 0) {
        console.log("All map sections have already been owned.");
        return;
    }

    // Select a random remaining section
    const randomIndex = Math.floor(Math.random() * notifyBingoHelper.remainingSections.length);
    const randomMapSection = notifyBingoHelper.remainingSections[randomIndex];

    // Remove the selected section from remaining ones
    notifyBingoHelper.remainingSections.splice(randomIndex, 1);

    ownMapSection(randomMapSection, () => {
        raiseLandMultipleTimes(baseX, baseY, width, height, 50, () => {
            writingBingo(baseX, baseY, () => {
                lowerLandMultpleTimes(baseX, baseY, width, height, 50, () => {
                    clearMiddle(() => {
                        bingoBeingNotified = false;
                        console.log("Completed ground bingo notification.");
                    });
                });
            });
        });
    });
}

// Static property to track remaining sections
notifyBingoHelper.remainingSections = null as RandomMapSectionKey[] | null;

function raiseLand(baseX: number, baseY: number, width: number, height: number, callback?: () => void): void {
    const x1 = Math.min(baseX, baseX + width - 1);
    const y1 = Math.min(baseY, baseY + height - 1);
    const x2 = Math.max(baseX, baseX + width - 1) + 120;
    const y2 = Math.max(baseY, baseY + height - 1)

    const args = {
        x: (x1 + x2) / 2, // Center of the rectangle
        y: (y1 + y2) / 2, // Center of the rectangle
        x1: x1,
        y1: y1,
        x2: x2,
        y2: y2,
        selectionType: 4, // MAP_SELECT_TYPE_FULL ensures all corners are smoothed evenly
    };

    context.executeAction("landraise", args, (result) => {
        if (result.error) {
            console.log(`Failed to raise land: ${result.errorMessage}`);
        } else {
            console.log("Successfully raised land smoothly.");
            if (callback) callback();
        }
    });
}

function lowerLand(baseX: number, baseY: number, width: number, height: number, callback?: () => void): void {
    const x1 = Math.min(baseX, baseX + width - 1);
    const y1 = Math.min(baseY, baseY + height - 1);
    const x2 = Math.max(baseX, baseX + width - 1) + 120;
    const y2 = Math.max(baseY, baseY + height - 1)

    const args = {
        x: (x1 + x2) / 2, // Center of the rectangle
        y: (y1 + y2) / 2, // Center of the rectangle
        x1: x1,
        y1: y1,
        x2: x2,
        y2: y2,
        selectionType: 4, // MAP_SELECT_TYPE_FULL ensures all corners are smoothed evenly
    };

    context.executeAction("landlower", args, (result) => {
        if (result.error) {
            console.log(`Failed to lower land: ${result.errorMessage}`);
        } else {
            console.log("Successfully lowered land smoothly.");
            if (callback) callback();
        }
    });
}


function placeLetter(
    letter: number[][],
    offsetX: number,
    objectId: number,
    baseX: number,
    baseY: number,
    z: number,
    scale: number,
    color: number
) {
    letter.forEach((row, rowIndex) => {
        row.forEach((cell, colIndex) => {
            if (cell === 1) {
                const x = baseX + (offsetX + colIndex) * scale;
                const y = baseY + rowIndex * scale;
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
                        // console.log(`Failed to place object at x: ${x}, y: ${y} - Error: ${result.errorMessage}`);
                    }
                });
            }
        });
    });
}

function removeLetter(
    letter: number[][],
    offsetX: number,
    objectId: number,
    baseX: number,
    baseY: number,
    z: number,
    scale: number
) {
    letter.forEach((row, rowIndex) => {
        row.forEach((cell, colIndex) => {
            if (cell === 1) {
                const x = baseX + (offsetX + colIndex) * scale;
                const y = baseY + rowIndex * scale;

                context.executeAction("smallsceneryremove", {
                    x: x,
                    y: y,
                    z: z,
                    object: objectId,
                    quadrant: 0
                }, (result) => {
                    if (result.error) {
                        // console.log(`Failed to remove object at x: ${x}, y: ${y} - Error: ${result.errorMessage}`);
                    }
                });
            }
        });
    });
}

export function raiseLandMultipleTimes(
    baseX: number,
    baseY: number,
    width: number,
    height: number,
    times: number,
    finalCallback?: () => void
): void {
    let remaining = times;

    raiseLandIteration(baseX, baseY, width, height, remaining, finalCallback);
}

function raiseLandIteration(
    baseX: number,
    baseY: number,
    width: number,
    height: number,
    remaining: number,
    finalCallback?: () => void
): void {
    if (remaining <= 0) {
        console.log("Completed all land raises.");
        if (finalCallback) finalCallback();
        return;
    }

    raiseLand(baseX, baseY, width, height, () => {
        context.setTimeout(() => {
            raiseLandIteration(baseX, baseY, width, height, remaining - 1, finalCallback);
        }, 50); // Delay between raises (50ms)
    });
}

export function lowerLandMultpleTimes(
    baseX: number,
    baseY: number,
    width: number,
    height: number,
    times: number,
    finalCallback?: () => void
): void {
    let remaining = times;

    lowerLandIteration(baseX, baseY, width, height, remaining, finalCallback);
}

function lowerLandIteration(
    baseX: number,
    baseY: number,
    width: number,
    height: number,
    remaining: number,
    finalCallback?: () => void
): void {
    if (remaining <= 0) {
        console.log("Completed all land lowers.");
        if (finalCallback) finalCallback();
        return;
    }

    lowerLand(baseX, baseY, width, height, () => {
        context.setTimeout(() => {
            lowerLandIteration(baseX, baseY, width, height, remaining - 1, finalCallback);
        }, 50); // Delay between lowers (50ms)
    });
}

