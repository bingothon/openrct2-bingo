import { addRandomTrees, debugMode, setFootPaths } from "src/util";

export function initializeCoopGame(): void {
    console.log("Initializing COOP game mode...");
    
    // Step 1: Enable debug mode
    debugMode(1, () => {
        // Step 2: Add random trees
        addRandomTrees(() => {
            // Step 3: Reset research
            context.executeAction("resetResearch", { args: {} }, () => {
                // Step 4: Set research funding
                context.executeAction('parksetresearchfunding', { priorities: 31, fundingAmount: 3 }, () => {
                    // Step 5: Set park parameter
                    context.executeAction('parksetparameter', { parameter: 1, value: 1 }, () => {
                        // Step 6: Set entrance fee
                        context.executeAction('parksetentrancefee', { value: 0 }, () => {
                            // Step 7: Set loan
                            context.executeAction("parksetloan", { value: 0 }, () => {
                                // Step 8: Set cash
                                context.executeAction("setCash", { args: { cash: 1000000 } }, () => {
                                    // Step 9: Set date
                                    context.executeAction("parksetdate", { day: 0, month: 0, year: 0 }, () => {
                                        // Step 10: Disable debug mode
                                        debugMode(0, () => {
                                            // Step 11: Set foot paths
                                            setFootPaths(() => {
                                                console.log('COOP game initialized successfully!');
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