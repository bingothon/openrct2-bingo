import { getPvpStartingCash } from "src/bingo/budgets";
import { clearAllTiles, debugMode, setPVPFootPaths } from "src/utils";
import { unlockEntireMap } from "./shared";
import { GameManager } from "../../managers/GameManager";
import { createPlayerSections } from "src/bingo/notifications/playerSections";



export function initializeLockoutGame(): void {
    console.log("Initializing LOCKOUT game mode...");
    
    // Step 0: Initialize GameManager (this disables building restrictions during initialization)
    const gameManager = GameManager.getInstance();
    gameManager.initializeGame();
    
    // Step 1: Enable debug mode
    console.log("Step 1: About to call debugMode(1)...");
    debugMode(1, () => {
        console.log("Step 1: Debug mode enabled");
        // Step 2: Set entire map to open (no trees, clear land)
        clearAllTiles(() => {
            console.log("Step 2: All tiles cleared");
            // Step 3: Unlock entire map for PVP
            unlockEntireMap(() => {
                console.log("Step 3: Entire map unlocked");
                // Step 4: Reset research
                context.executeAction("resetResearch", { args: {} }, (result) => {
                    if (result.error) {
                        console.log("❌ Step 4 FAILED: Reset research failed:", result.errorMessage);
                    } else {
                        console.log("✅ Step 4: Research reset");
                    }
                    // Step 5: Set research funding
                    context.executeAction('parksetresearchfunding', { priorities: 31, fundingAmount: 3 }, (result) => {
                        if (result.error) {
                            console.log("❌ Step 5 FAILED: Set research funding failed:", result.errorMessage);
                        } else {
                            console.log("✅ Step 5: Research funding set");
                        }
                        // Step 6: Set park parameter
                        context.executeAction('parksetparameter', { parameter: 1, value: 1 }, (result) => {
                            if (result.error) {
                                console.log("❌ Step 6 FAILED: Set park parameter failed:", result.errorMessage);
                            } else {
                                console.log("✅ Step 6: Park parameter set");
                            }
                            // Step 7: Set entrance fee
                            context.executeAction('parksetentrancefee', { value: 0 }, (result) => {
                                if (result.error) {
                                    console.log("❌ Step 7 FAILED: Set entrance fee failed:", result.errorMessage);
                                } else {
                                    console.log("✅ Step 7: Entrance fee set");
                                }
                                // Step 8: Set loan
                                context.executeAction("parksetloan", { value: 0 }, (result) => {
                                    if (result.error) {
                                        console.log("❌ Step 8 FAILED: Set loan failed:", result.errorMessage);
                                    } else {
                                        console.log("✅ Step 8: Loan set");
                                    }
                                    // Step 9: Set cash
                                    context.executeAction("setCash", { args: { cash: getPvpStartingCash() } }, (result) => {
                                        if (result.error) {
                                            console.log("❌ Step 9 FAILED: Set cash failed:", result.errorMessage);
                                        } else {
                                            console.log("✅ Step 9: Cash set");
                                        }
                                        // Step 10: Set date
                                        context.executeAction("parksetdate", { day: 0, month: 0, year: 0 }, (result) => {
                                            if (result.error) {
                                                console.log("❌ Step 10 FAILED: Set date failed:", result.errorMessage);
                                            } else {
                                                console.log("✅ Step 10: Date set");
                                            }
                                            // Step 11: Disable debug mode
                                            debugMode(0, () => {
                                                console.log("Step 11: Debug mode disabled");
                                                // Step 12: Set foot paths
                                                setPVPFootPaths(() => {
                                                    console.log("Step 12: PVP foot paths set");
                                                    // Step 13: Create player sections on the ground
                                                    initializePlayerSections(() => {
                                                        console.log("✅ Step 13: Player sections created");
                                                        // Step 14: Initialize scoreboard with 0 0 / 0 0
                                                        initializeScoreboard(() => {
                                                            console.log("✅ Step 14: Scoreboard initialized");
                                                            // Step 15: Game initialization complete
                                                            gameManager.setInitializing(false);
                                                            console.log('🎉 LOCKOUT game initialized successfully!');
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
    
    try {
        // Create the player sections with callback
        createPlayerSections(() => {
            console.log("Player sections created successfully - map divided into 4 quarters");
            callback();
        });
    } catch (error) {
        console.log("❌ FAILED: Error in initializePlayerSections:", error);
        callback(); // Still call callback to continue the chain
    }
}

/**
 * Initializes the scoreboard for PVP mode with default scores
 */
function initializeScoreboard(callback: () => void): void {
    console.log("Initializing PVP scoreboard...");
    
    try {
        // Create the scoreboard using the game action
        context.executeAction("createScoreboard", { args: {} }, (result) => {
            if (result.error) {
                console.log("❌ FAILED: Create scoreboard failed:", result.errorMessage);
            } else {
                console.log("✅ Scoreboard created with initial scores: 0 0 / 0 0");
            }
            callback();
        });
    } catch (error) {
        console.log("❌ FAILED: Error in initializeScoreboard:", error);
        callback(); // Still call callback to continue the chain
    }
}

