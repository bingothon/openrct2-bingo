import { clearAllTiles, debugMode, setPVPFootPaths } from "src/utils";
import { unlockEntireMap } from "./shared";



export function initializeLockoutGame(): void {
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

