export function ownMapSection(section: "top-left" | "top-right" | "bottom-left" | "bottom-right", callback?: () => void) {
    const mapSize = map.size; // Map dimensions in tiles
    console.log(`Map size: ${mapSize.x}x${mapSize.y} tiles`);
    const tileSize = 32; // Tile size in subunits

    // Calculate midpoints for splitting the map into quadrants
    const midX = Math.floor(mapSize.x / 2) * tileSize; // Midpoint in subunits
    const midY = Math.floor(mapSize.y / 2) * tileSize;

    // Determine boundaries for the specified quadrant
    let x1 = 0, y1 = 0, x2 = 0, y2 = 0;

    switch (section) {
        case "top-left":
            x1 = 0;
            y1 = 0;
            x2 = midX - 1; // Top-left ends at the midpoints
            y2 = midY - 1;
            break;
        case "top-right":
            x1 = midX;
            y1 = 0;
            x2 = mapSize.x * tileSize - 1; // Top-right starts at midX
            y2 = midY - 1;
            break;
        case "bottom-left":
            x1 = 0;
            y1 = midY;
            x2 = midX - 1; // Bottom-left ends at midX
            y2 = mapSize.y * tileSize - 1;
            break;
        case "bottom-right":
            x1 = midX;
            y1 = midY;
            x2 = mapSize.x * tileSize - 1; // Bottom-right starts at midX
            y2 = mapSize.y * tileSize - 1;
            break;
    }

    console.log(`Processing section: ${section}, Coordinates: (${x1}, ${y1}) to (${x2}, ${y2})`);

    // Query and execute land purchase for the specified section
    context.queryAction(
        "landbuyrights",
        {
            x1,
            y1,
            x2,
            y2,
            setting: 0, // 0: Buy land
        },
        (queryResult) => {
            if (queryResult.cost && queryResult.cost > 0) {
                context.executeAction('addCash', { args: { cash: queryResult.cost } }, (result) => {
                    if (result.error) {
                        console.log("Failed to add cash:", result.errorMessage);
                    } else {
                        console.log("Cash added successfully.");
                        if (queryResult.error === 0) {
                            context.executeAction(
                                "landbuyrights",
                                {
                                    x1,
                                    y1,
                                    x2,
                                    y2,
                                    setting: 0, // 0: Buy land
                                },
                                (executeResult) => {
                                    if (executeResult.error === 0) {
                                        console.log(`Successfully bought land for section: ${section}`);
                                        if (callback) {
                                            callback();
                                        }
                                    } else {
                                        console.log(
                                            `Failed to buy land for section: ${section} - ${executeResult.errorMessage}`
                                        );
                                    }
                                }
                            );
                        } else {
                            console.log(
                                `Failed to query land for section: ${section} - ${queryResult.errorMessage}`
                            );
                        }
                    }
                });

            }
        }
    );
}

/**
 * Clear a map section (set to unowned) and then mark it for sale.
 */
export function clearAndSetForSale(
    section: "top-left" | "top-right" | "bottom-left" | "bottom-right" | "all",
    callback?: () => void
) {
    const mapSize = map.size;
    const tileSize = 32;

    // Calculate midpoints for splitting the map into quadrants
    const midX = Math.floor(mapSize.x / 2) * tileSize;
    const midY = Math.floor(mapSize.y / 2) * tileSize;

    // Determine boundaries for the specified section
    let x1 = 0,
        y1 = 0,
        x2 = mapSize.x * tileSize - 1,
        y2 = mapSize.y * tileSize - 1;

    switch (section) {
        case "top-left":
            x1 = 0;
            y1 = 0;
            x2 = midX - 1;
            y2 = midY - 1;
            break;
        case "top-right":
            x1 = midX;
            y1 = 0;
            x2 = mapSize.x * tileSize - 1;
            y2 = midY - 1;
            break;
        case "bottom-left":
            x1 = 0;
            y1 = midY;
            x2 = midX - 1;
            y2 = mapSize.y * tileSize - 1;
            break;
        case "bottom-right":
            x1 = midX;
            y1 = midY;
            x2 = mapSize.x * tileSize - 1;
            y2 = mapSize.y * tileSize - 1;
            break;
        case "all":
            // Default values already cover the full map
            break;
    }

    console.log(`Processing section: ${section}, Coordinates: (${x1}, ${y1}) to (${x2}, ${y2})`);

    // Step 1: Set the section to unowned (clear ownership)
    const clearArgs = {
        x1,
        y1,
        x2,
        y2,
        setting: 0, // Set to unowned
        ownership: 0, // Remove ownership
    };
    // Step 2: Mark the section for sale if clearing succeeded
    const forSaleArgs = {
        x1,
        y1,
        x2,
        y2,
        setting: 2, // Set for sale
        ownership: 0, // No ownership
    };

    context.executeAction("landsetrights", clearArgs, (clearResult) => {
        if (clearResult.error) {
            console.log(`Failed to clear section ${section}: ${clearResult.errorMessage}`);
            if (clearResult.errorMessage === 'Land not for sale!')
                console.log('Land not for sale!, skipping')
            if (callback) {
                callback();
            }
        } else {
            console.log(`Successfully cleared section: ${section}`);
            context.executeAction("landsetrights", forSaleArgs, (saleResult) => {
                if (saleResult.error) {
                    console.log(`Failed to set section ${section} for sale: ${saleResult.errorMessage}`);
                    if (callback) {
                        callback();
                    }
                } else {
                    console.log(`Successfully set section ${section} for sale.`);
                }

                // Execute the callback after completion
                if (callback) {
                    callback();
                }
            });
        }
    });
}

export function clearMiddle(callback?: () => void) {
    const tileSize = 32;

    // Coordinates for the "BINGO" area
    const baseX = 53 * tileSize;
    const baseY = 63 * tileSize;
    const width = 24 * tileSize;
    const height = 5 * tileSize;

    // Define boundaries for clearing the area
    const x1 = baseX, y1 = baseY, x2 = baseX + width, y2 = baseY + height;

    console.log(`Clearing middle section: Coordinates (${x1}, ${y1}) to (${x2}, ${y2})`);

    // Action arguments to set the land to unowned
    const clearArgs = { x1, y1, x2, y2, setting: 0, ownership: 0 }; // Unown land

    // Execute the land clearing action
    context.executeAction("landsetrights", clearArgs, (clearResult) => {
        if (clearResult.error) {
            console.log(`Failed to clear middle section: ${clearResult.errorMessage}`);
            return;
        }

        console.log("Middle section successfully cleared and set to unowned.");

        // Execute the callback if provided
        if (callback) callback();
    });
}


