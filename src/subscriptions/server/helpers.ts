import { config } from "src/config";
import { initializeGame } from "src/init";
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