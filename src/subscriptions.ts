import { bingosyncUI, connectToServer, resetServer } from "./bingo/bingosync-handler";
import { checkGoals } from "./bingo/main";
import { config } from "./config";
import { BingoBoard } from "./types";
import { showGameDurationDialog } from "./ui";
import { configureBoard, updateBoardWithSeed } from "./ui-helpers";
import { addRandomTrees, adjustWaterHeight, checkIfStarted, clearAllRides, clearAllTiles, clearAndSetForSale, clearMiddle, debugMode, flatAllLand, getSeed, ownMapSection, renewRides, setFootPaths, setSeed } from "./util";
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

export function subscribeToServerInitialization() {
    if (intervalSubscriptionServer) {
        intervalSubscriptionServer.dispose();
    }

    let dayCounter = 0;
    let noPlayersDayCounter = 0;

    intervalSubscriptionServer = context.subscribe("interval.day", () => {
        const parkStorage = context.getParkStorage();
        const duration = parkStorage.get('duration', 0);
        const getCurrentYear = date.year;
        const remainingYears = duration - getCurrentYear;
        dayCounter++;
        config.daysElapsed++
        console.log(`Day ${dayCounter} passed`);
        console.log(`Months elapsed.... ${date.monthsElapsed}`);
        let yearsRemaining = config.gameTime.year - date.yearsElapsed;
        // Notify when a year has passed
        if (date.yearsElapsed % 1 === 0 && date.month === 0 && date.day === 0) {
            for (let i = 0; i < 3; i++) {
                context.executeAction("parkMessage", { args: { message: `A year has passed. You have ${yearsRemaining} years to finish!` } });
                if (network.mode === 'server') {
                    context.executeAction("networkMessage", { args: { message: `A year has passed. You have ${yearsRemaining} years to finish!` } });
                }
            }
        }

        if (dayCounter % 15 === 0 && config.started) {

            context.executeAction("parkMessage", { args: { message: `Game started, remaining years: ${yearsRemaining - 1}` } });
            if (network.mode === 'server') {
                context.executeAction("networkMessage", { args: { message: `Game started, remaining years: ${yearsRemaining - 1}` } });
            }
        }

        if (network.players.length === 0) {
            noPlayersDayCounter++;
        }
        if (noPlayersDayCounter > 1) {

            if (typeof ui !== 'undefined') {
                showGameDurationDialog();
            }
        }

        // Notify during the last 10 days before the end of the game
        if (duration !== 0 && date.yearsElapsed === duration - 1 && date.month === 7 && date.day >= 21) {
            const remainingDays = 31 - date.day; // Calculate remaining days in the month
            context.executeAction("parkMessage", { args: { message: `Game ends in ${remainingDays} days!` } });
            if (network.mode === 'client' || network.mode === 'server') {
                context.executeAction("networkMessage", { args: { message: `Game ends in ${remainingDays} days!` } });
            }
        }

        // Restart the game when the game time is up
        console.log('DEBUGGING', date.yearsElapsed, duration, date.month, date.day, isRestarting)
        if (duration !== 0 && date.yearsElapsed === duration && date.month === 0 && date.day >= 1 && !isRestarting) {
            context.executeAction("parkMessage", { args: { message: `Game is restarting now!` } });
            if (network.mode === 'client' || network.mode === 'server') {
                context.executeAction("networkMessage", { args: { message: `Game is restarting now!` } });
            }
            isRestarting = true;
            if (network.mode === 'server') {
                restart(true, true, () => {
                    // restarting the entire server/openrct2 instance
                });
            }

        }


        let startRequest = parkStorage.get("started", false);
        console.log('oke tell me what isStarted is', config.started)
        if (startRequest && !config.started && !isRestarting) {
            config.started = true;
            debugMode(1, () => {
                addRandomTrees(() => {
                    context.executeAction("resetResearch", { args: {} }, () => {
                        context.executeAction("parksetloan", { value: 0 }, () => {
                            context.executeAction("setCash", { args: { cash: 1000000 } }, () => {
                                context.executeAction("parksetdate", { day: 0, month: 0, year: 0 }, () => {
                                    debugMode(0, () => {
                                        setFootPaths(() => {
                                            console.log('game started')
                                        });
                                    });
                                });
                            });
                        });
                    });
                });
            });
        }
    });





};

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


export const restart = (isServer = false, clientRestart?: boolean, callback?: Function) => {
    debugMode(1, () => {
        context.executeAction("parksetloan", { value: 0 }, () => {
            context.executeAction("setCash", { args: { cash: 1000000 } }, () => {
                clearAllRides(() => {
                    clearAllTiles(() => {
                        clearAllTiles(() => {
                            clearAllTiles(() => {
                                clearAndSetForSale('top-right', () => {
                                    clearAndSetForSale('bottom-right', () => {
                                        clearAndSetForSale('bottom-left', () => {
                                            clearMiddle(() => {
                                                context.executeAction("parksetdate", { day: 0, month: 0, year: 0 }, () => {

                                                    isRestarting = false;

                                                    // Handle staff
                                                    const staffIds = map.getAllEntities("staff").map((staff) => staff.id);
                                                    if (staffIds.length === 0) {
                                                        console.log("No staff found, proceeding to reset...");

                                                        handleReset();
                                                    } else {
                                                        let firedStaffCount = 0;
                                                        console.log(`Firing ${staffIds.length} staff members...`);
                                                        staffIds.forEach((id) => {
                                                            context.executeAction("stafffire", { id }, () => {
                                                                firedStaffCount++;
                                                                console.log(`Fired staff with ID: ${id}`);
                                                                if (firedStaffCount === staffIds.length) {
                                                                    console.log("All staff fired, proceeding to reset...");
                                                                    handleReset();
                                                                }
                                                            });
                                                        });
                                                    }

                                                    function handleReset() {
                                                        console.log("Starting reset process...");

                                                        intervalSubscriptionServerReset = context.subscribe("interval.day", () => {
                                                            let guestsHandled = park.guests === 0;

                                                            console.log(`Guests handled: ${guestsHandled}`);

                                                            if (!guestsHandled) {
                                                                const guestIds = map.getAllEntities("guest").map((guest) => guest.id);

                                                                if (guestIds.length > 0) {
                                                                    console.log(`Found ${guestIds.length} guests. Exploding guests...`);
                                                                    context.executeAction("parkMessage", { args: { message: `Restarting, exploding ${guestIds.length} guests...` } });
                                                                    guestIds.forEach((id) => {
                                                                        context.executeAction("guestsetflags", { peep: id, guestFlags: 262144 }, () => {
                                                                            console.log(`Exploded guest with ID: ${id}`);
                                                                        });
                                                                    });
                                                                }
                                                            } else {
                                                                console.log("All guests have been handled.");
                                                            }



                                                            if (guestsHandled) {
                                                                console.log("Guests handled and land flattened. Finalizing restart...");
                                                                if (clientRestart) {
                                                                    resetServer();
                                                                }
                                                                finalizeRestart();
                                                                if (intervalSubscriptionServerReset) {
                                                                    intervalSubscriptionServerReset.dispose();
                                                                    intervalSubscriptionServerReset = null;
                                                                }
                                                            }
                                                        });
                                                    }

                                                    function finalizeRestart() {
                                                        // Final game setup

                                                        adjustWaterHeight(112, () => {

                                                            context.executeAction('removeAllLitter', { args: {} }, () => {

                                                                context.executeAction("gamesetspeed", { speed: 1 }, () => {
                                                                    context.executeAction('setStorage', { args: { key: 'started', value: false } }, () => {
                                                                        config.started = false;
                                                                        console.log("Game restarted!");
                                                                        if (isServer) {
                                                                            console.log("Subscribing to server initialization...");
                                                                            subscribeToServerInitialization();
                                                                            connectToServer();

                                                                            debugMode(0)
                                                                        }
                                                                        if (callback) {
                                                                            callback();
                                                                        }
                                                                    });
                                                                });
                                                            });
                                                        });
                                                    }

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
};