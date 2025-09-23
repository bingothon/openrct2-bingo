import { clearAllTiles, debugMode, setPVPFootPaths } from "src/util";

/**
 * Unlocks the entire map for PVP mode by buying all land rights
 */
function unlockEntireMap(callback: () => void): void {
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

export function initializePvpGame(): void {
    console.log("Initializing PVP/LOCKOUT game mode...");
    
    // Step 1: Enable debug mode
    debugMode(1, () => {
        // Step 2: Set entire map to open (no trees, clear land)
        clearAllTiles(() => {
            // Step 3: Unlock entire map for PVP
            unlockEntireMap(() => {
                // Step 4: Reset research
                context.executeAction("resetResearch", { args: {} }, () => {
                    // Step 5: Set research funding
                    context.executeAction('parksetresearchfunding', { priorities: 31, fundingAmount: 3 }, () => {
                        // Step 6: Set park parameter
                        context.executeAction('parksetparameter', { parameter: 1, value: 1 }, () => {
                            // Step 7: Set entrance fee
                            context.executeAction('parksetentrancefee', { value: 0 }, () => {
                                // Step 8: Set loan
                                context.executeAction("parksetloan", { value: 0 }, () => {
                                    // Step 9: Set cash
                                    context.executeAction("setCash", { args: { cash: 1000000 } }, () => {
                                        // Step 10: Set date
                                        context.executeAction("parksetdate", { day: 0, month: 0, year: 0 }, () => {
                                            // Step 11: Disable debug mode
                                            debugMode(0, () => {
                                                // Step 12: Set foot paths
                                                setPVPFootPaths(() => {
                                                    // Step 13: Create player sections on the ground
                                                    initializePlayerSections(() => {
                                                        // Step 14: Initialize scoreboard with 0 0 / 0 0
                                                        initializeScoreboard(() => {
                                                            console.log('PVP/LOCKOUT game initialized successfully!');
                                                        });
                                                    });
                                                });
                                            });
                                        });
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
    });
}

/**
 * Initializes player sections on the ground for PVP mode
 */
function initializePlayerSections(callback: () => void): void {
    console.log("Initializing PVP player sections...");
    
    // Create the player sections using the game action
    context.executeAction("createPlayerSections", { args: {} }, (result) => {
        if (result.error) {
            console.log("Failed to create player sections:", result.errorMessage);
        } else {
            console.log("Player sections created successfully - map divided into 4 quarters");
        }
        callback();
    });
}

/**
 * Initializes the scoreboard for PVP mode with default scores
 */
function initializeScoreboard(callback: () => void): void {
    console.log("Initializing PVP scoreboard...");
    
    // Create the scoreboard using the game action
    context.executeAction("createScoreboard", { args: {} }, (result) => {
        if (result.error) {
            console.log("Failed to create scoreboard:", result.errorMessage);
        } else {
            console.log("Scoreboard created with initial scores: 0 0 / 0 0");
        }
        callback();
    });
}

