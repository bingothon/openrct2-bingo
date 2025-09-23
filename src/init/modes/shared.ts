/**
 * Unlocks the entire map for PVP mode by buying all land rights
 */
export function unlockEntireMap(callback: () => void): void {
    console.log("Unlocking entire map for PVP mode...");
    
    const mapSize = map.size;
    const tileSize = 32;
    
    // Calculate the full map boundaries
    const x1 = 0;
    const y1 = 0;
    const x2 = mapSize.x * tileSize - 1;
    const y2 = mapSize.y * tileSize - 1;
    
    console.log(`Unlocking entire map: (${x1}, ${y1}) to (${x2}, ${y2})`);
    
    // Query the cost of buying the entire map
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
                console.log(`Cost to unlock entire map: ${queryResult.cost}`);
                // Add cash to cover the cost
                context.executeAction('addCash', { args: { cash: queryResult.cost } }, (result) => {
                    if (result.error) {
                        console.log("Failed to add cash for map unlock:", result.errorMessage);
                        callback();
                    } else {
                        console.log("Cash added successfully for map unlock.");
                        // Buy the entire map
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
                                    console.log("Successfully unlocked entire map for PVP mode!");
                                    callback();
                                } else {
                                    console.log(`Failed to unlock entire map: ${executeResult.errorMessage}`);
                                    callback();
                                }
                            }
                        );
                    }
                });
            } else {
                console.log("No cost to unlock map or query failed");
                callback();
            }
        }
    );
}