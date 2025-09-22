import { bingosyncUI, connectToServer, resetServer } from "./bingo/bingosync-handler";
import { checkGoals } from "./bingo/main";
import { config } from "./config";
import { BingoBoard } from "./types";
import { showGameDurationDialog } from "./ui";
import { configureBoard, updateBoardWithSeed } from "./ui-helpers";
import { addRandomTrees, adjustWaterHeight, checkIfStarted, clearAllRides, clearAllTiles, clearAndSetForSale, clearMiddle, debugMode, flatAllLand, getSeed, ownMapSection, renewRides, setFootPaths, setPVPFootPaths, setSeed } from "./util";
let intervalSubscriptionGuestExplode: IDisposable | null = null;

let intervalSubscriptionBoard: IDisposable | null = null;
let intervalSubscriptionInventions: IDisposable | null = null;
let intervalSubscriptionServer: IDisposable | null = null;
let intervalSubscriptionRenewRides: IDisposable | null = null;
let intervalSubscriptionServerReset: IDisposable | null = null;
let intervalIfStarted: IDisposable | null = null;
let isRestarting = false;

export function subscribeToGoalChecks(board: BingoBoard) {
    // Dispose of any existing subscription to prevent duplicates
    if (intervalSubscriptionBoard) {
        intervalSubscriptionBoard.dispose();
    }

    let tickCounter = 0;

    // Create a new subscription and store the IDisposable reference
    intervalSubscriptionBoard = context.subscribe("interval.tick", () => {
        tickCounter++;
        if (tickCounter % 100 === 0) {
            checkGoals(board);
            tickCounter = 0;
        }
    });
}

export function subscribeToInventions() {
    // Dispose of any existing subscription to prevent duplicates
    if (intervalSubscriptionInventions) {
        intervalSubscriptionInventions.dispose();
    }

    let dayCounter = 0;

    // Create a new subscription and store the IDisposable reference
    intervalSubscriptionInventions = context.subscribe("interval.day", () => {
        dayCounter++;
        if (dayCounter % 1 === 0) {
            context.executeAction('inventNextItem', { args: {} }, (result) => {
                if (result.error) {
                    if (result.errorMessage === 'No uninvented items remaining.') return { error: 0 }
                    console.log('Failed to set seed:', result.errorMessage);
                }
            });
            dayCounter = 0;
        }
    });
}

export function subscribeIfStarted() {
    if (intervalIfStarted) {
        intervalIfStarted.dispose();
    }
    console.log(`subscribing to check if started`);
    intervalIfStarted = context.subscribe("interval.day", () => {
        console.log('checking if started', checkIfStarted())
        if (!checkIfStarted()) {
            console.log("Game not started, showing game duration dialog.");
            showGameDurationDialog();
        } else {
            console.log("Game already started, skipping game duration's dialog.");
        }
    });
}

export function subscribeToRenewRides() {
    if (intervalSubscriptionRenewRides) {
        intervalSubscriptionRenewRides.dispose();
    }

    let dayCounter = 0;

    intervalSubscriptionRenewRides = context.subscribe("interval.day", () => {
        dayCounter++;
        if (dayCounter % 100 === 0) {
            renewRides();
            dayCounter = 0;
        }
    });
}

/**
 * Sends a message to both park and network
 */
function sendGameMessage(message: string): void {
    context.executeAction("parkMessage", { args: { message } });
    if (network.mode === 'server') {
        network.sendMessage(message);
    }
    if (network.mode === 'client' || network.mode === 'server') {
        context.executeAction("networkMessage", { args: { message } });
    }
}

/**
 * Handles year progression notifications
 */
function handleYearProgression(remainingYears: number): void {
    if (date.yearsElapsed % 1 === 0 && date.month === 0 && date.day === 0) {
        const message = `A year has passed. You have ${remainingYears} years to finish!`;
        for (let i = 0; i < 3; i++) {
            sendGameMessage(message);
        }
    }
}

/**
 * Handles periodic game status updates
 */
function handleGameStatusUpdates(remainingYears: number, dayCounter: number): void {
    if (dayCounter % 15 === 0 && config.started) {
        const message = `Game started, remaining years: ${remainingYears - 1}`;
        sendGameMessage(message);
    }
}

/**
 * Handles end-of-game warnings
 */
function handleEndGameWarnings(duration: number): void {
    if (duration !== 0 && date.yearsElapsed === duration - 1 && date.month === 7 && date.day >= 21) {
        const remainingDays = 31 - date.day;
        const message = `Game ends in ${remainingDays} days!`;
        sendGameMessage(message);
    }
}

/**
 * Handles game restart when time is up
 */
function handleGameRestart(duration: number): void {
    console.log('DEBUGGING', date.yearsElapsed, duration, date.month, date.day, isRestarting);
    
    if (duration !== 0 && date.yearsElapsed === duration && date.month === 0 && date.day >= 1 && !isRestarting) {
        const message = `Game is restarting now!`;
        sendGameMessage(message);
        
        isRestarting = true;
        if (network.mode === 'server') {
            restart(true, true, () => {
                // Server restart completed
            });
        }
    }
}

/**
 * Handles game initialization when started flag is set
 */
function handleGameInitialization(parkStorage: any): void {
    const startRequest = parkStorage.get("started", false);
    console.log('Game started status:', config.started);
    
    if (startRequest && !config.started && !isRestarting) {
        config.started = true;
        initializeGame();
    }
}

/**
 * Handles multiplayer dialog when no players are present
 */
function handleMultiplayerDialog(noPlayersDayCounter: number): number {
    if (network.players.length === 0) {
        noPlayersDayCounter++;
    }
    
    if (noPlayersDayCounter > 1 && network.mode !== "none") {
        if (typeof ui !== 'undefined') {
            showGameDurationDialog();
        }
    }
    
    return noPlayersDayCounter;
}

/**
 * Main server initialization subscription - now clean and organized
 */
export function subscribeToServerInitialization() {
    if (intervalSubscriptionServer) {
        intervalSubscriptionServer.dispose();
    }

    let dayCounter = 0;
    let noPlayersDayCounter = 0;

    intervalSubscriptionServer = context.subscribe("interval.day", () => {
        // Get game state
        const parkStorage = context.getParkStorage();
        const duration = parkStorage.get('duration', 0);
        const remainingYears = duration - date.year;
        
        // Update counters
        dayCounter++;
        config.daysElapsed++;
        
        // Log progress
        console.log(`Day ${dayCounter} passed`);
        console.log(`Months elapsed: ${date.monthsElapsed}`);
        
        // Handle various game events
        handleYearProgression(remainingYears);
        handleGameStatusUpdates(remainingYears, dayCounter);
        handleEndGameWarnings(duration);
        handleGameRestart(duration);
        handleGameInitialization(parkStorage);
        
        // Handle multiplayer-specific logic
        noPlayersDayCounter = handleMultiplayerDialog(noPlayersDayCounter);
    });
}
export function unsubscribeFromGoalChecks() {
    if (intervalSubscriptionBoard) {
        intervalSubscriptionBoard.dispose();
        intervalSubscriptionBoard = null;
    }
}

export function unsubscribeFromInventions() {
    if (intervalSubscriptionInventions) {
        intervalSubscriptionInventions.dispose();
        intervalSubscriptionInventions = null;
    }
}


/**
 * Initializes COOP game mode - traditional bingo setup
 */
function initializeCoopGame(): void {
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

/**
 * Initializes PVP/LOCKOUT game mode - competitive setup
 */
function initializePvpGame(): void {
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

/**
 * Main game initialization - routes to appropriate mode
 */
function initializeGame(): void {
    if (config.gameMode === "pvp") {
        initializePvpGame();
    } else {
        initializeCoopGame();
    }
}

/**
 * Helper function to execute game actions with callbacks
 */
function executeActionCallback(action: string, args: any, callback: () => void): void {
    context.executeAction(action, args, (result) => {
        if (result.error) {
            console.log(`Action ${action} failed:`, result.errorMessage);
        }
        callback();
    });
}

/**
 * Fires all staff members
 */
function fireAllStaff(callback: () => void): void {
    const staffIds = map.getAllEntities("staff").map((staff) => staff.id);
    
    if (staffIds.length === 0) {
        console.log("No staff found, proceeding...");
        callback();
        return;
    }

    console.log(`Firing ${staffIds.length} staff members...`);
    let firedCount = 0;
    
    staffIds.forEach((id) => {
        executeActionCallback("stafffire", { id }, () => {
            firedCount++;
            console.log(`Fired staff with ID: ${id}`);
            if (firedCount === staffIds.length) {
                console.log("All staff fired, proceeding...");
                callback();
            }
        });
    });
}

/**
 * Handles guest explosion and cleanup
 */
function handleGuestCleanup(callback: () => void): void {
    console.log("Starting guest cleanup process...");
    
    intervalSubscriptionServerReset = context.subscribe("interval.day", () => {
        const guestsHandled = park.guests === 0;
        console.log(`Guests handled: ${guestsHandled}`);

        if (!guestsHandled) {
            const guestIds = map.getAllEntities("guest").map((guest) => guest.id);
            
            if (guestIds.length > 0) {
                console.log(`Found ${guestIds.length} guests. Exploding guests...`);
                context.executeAction("parkMessage", { 
                    args: { message: `Restarting, exploding ${guestIds.length} guests...` } 
                });
                
                guestIds.forEach((id) => {
                    executeActionCallback("guestsetflags", { peep: id, guestFlags: 262144 }, () => {
                        console.log(`Exploded guest with ID: ${id}`);
                    });
                });
            }
        } else {
            console.log("All guests have been handled.");
            if (intervalSubscriptionServerReset) {
                intervalSubscriptionServerReset.dispose();
                intervalSubscriptionServerReset = null;
            }
            callback();
        }
    });
}

/**
 * Finalizes the restart process
 */
function finalizeRestart(isServer: boolean, clientRestart?: boolean, callback?: Function): void {
    console.log("Finalizing restart...");
    
    // Step 1: Adjust water height
    adjustWaterHeight(112, () => {
        // Step 2: Remove all litter
        executeActionCallback('removeAllLitter', { args: {} }, () => {
            // Step 3: Set game speed
            executeActionCallback("gamesetspeed", { speed: 1 }, () => {
                // Step 4: Reset started flag
                executeActionCallback('setStorage', { args: { key: 'started', value: false } }, () => {
                    config.started = false;
                    console.log("Game restarted!");
                    
                    // Step 5: Server-specific setup
                    if (isServer) {
                        console.log("Subscribing to server initialization...");
                        subscribeToServerInitialization();
                        connectToServer();
                        debugMode(0);
                    }
                    
                    // Step 6: Client restart if needed
                    if (clientRestart) {
                        resetServer();
                    }
                    
                    // Step 7: Call callback if provided
                    if (callback) {
                        callback();
                    }
                });
            });
        });
    });
}

/**
 * Main restart function - organized callback chain
 */
export const restart = (isServer = false, clientRestart?: boolean, callback?: Function) => {
    console.log("Starting game restart process...");
    isRestarting = false;

    // Step 1: Enable debug mode
    debugMode(1, () => {
        // Step 2: Reset financial settings
        executeActionCallback("parksetloan", { value: 0 }, () => {
            executeActionCallback("setCash", { args: { cash: 1000000 } }, () => {
                executeActionCallback('parksetresearchfunding', { priorities: 31, fundingAmount: 0 }, () => {
                    // Step 3: Clear rides and middle area
                    clearAllRides(() => {
                        clearMiddle(() => {
                            // Step 4: Reset date
                            executeActionCallback("parksetdate", { day: 0, month: 0, year: 0 }, () => {
                                // Step 5: Fire all staff
                                fireAllStaff(() => {
                                    // Step 6: Handle guest cleanup
                                    handleGuestCleanup(() => {
                                        // Step 7: Finalize restart
                                        finalizeRestart(isServer, clientRestart, callback);
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
