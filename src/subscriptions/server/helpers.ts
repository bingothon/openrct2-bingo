import { config } from "src/config";
import { initializeGame } from "src/init";
import { debugMode, clearAllRides, clearMiddle } from "src/util";
let isRestarting = false;
/*
 * Executes an action with a callback
 */
export function executeActionCallback(action: string, args: any, callback: () => void): void {
    context.executeAction(action, args, (result) => {
        if (result.error) {
            console.log(`Action ${action} failed:`, result.errorMessage);
        }
        callback();
    });
}

/**
 * Sends a message to both park and network
 */
export function sendGameMessage(message: string): void {
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
export function handleYearProgression(remainingYears: number): void {
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
export function handleGameStatusUpdates(remainingYears: number, dayCounter: number): void {
    if (dayCounter % 15 === 0 && config.started) {
        const message = `Game started, remaining years: ${remainingYears - 1}`;
        sendGameMessage(message);
    }
}

/**
 * Handles end-of-game warnings
 */
export function handleEndGameWarnings(duration: number): void {
    if (duration !== 0 && date.yearsElapsed === duration - 1 && date.month === 7 && date.day >= 21) {
        const remainingDays = 31 - date.day;
        const message = `Game ends in ${remainingDays} days!`;
        sendGameMessage(message);
    }
}

/**
 * Handles game restart when time is up
 */
export function handleGameRestart(duration: number): void {
    console.log('DEBUGGING', date.yearsElapsed, duration, date.month, date.day, isRestarting);
    
    if (duration !== 0 && date.yearsElapsed === duration && date.month === 0 && date.day >= 1 && !isRestarting) {
        const message = `Game is restarting now!`;
        sendGameMessage(message);
        
        isRestarting = true;
        if (network.mode === 'server') {
            restart();
        }
    }
}

/**
 * Handles game initialization when started flag is set
 */
export function handleGameInitialization(parkStorage: any): void {
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
export function handleMultiplayerDialog(noPlayersDayCounter: number, showGameDurationCallback?: () => void): number {
    if (network.players.length === 0) {
        noPlayersDayCounter++;
    }
    
    if (noPlayersDayCounter > 1 && network.mode !== "none") {
        if (typeof ui !== 'undefined' && showGameDurationCallback) {
            showGameDurationCallback();
        }
    }
    
    return noPlayersDayCounter;
}

/**
 * Main restart function - organized callback chain
 */
export const restart = ( callback?: Function) => {
    console.log("Starting game restart process...");

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
                                callback?.();
                            });
                        });
                    });
                });
            });
        });
    });
}