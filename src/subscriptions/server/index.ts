
import { subscriptions } from "../manager";
import { config } from "src/config";
import { checkIfStarted } from "src/util";
import { handleYearProgression, handleGameStatusUpdates, handleEndGameWarnings, handleGameRestart, handleGameInitialization, handleMultiplayerDialog, restart } from "./helpers";

// Re-export restart for external use
export { restart };

export function subscribeIfStarted(showGameDurationCallback?: () => void) {
    subscriptions.upsert("server-if-started", () => context.subscribe("interval.day", () => {
        console.log('checking if started', checkIfStarted())
        if (!checkIfStarted()) {
            console.log("Game not started, showing game duration dialog.");
            if (showGameDurationCallback) {
                showGameDurationCallback();
            }
        } else {
            console.log("Game already started, skipping game duration's dialog.");
        }
    }));
}

/**
 * Main server initialization subscription - now clean and organized
 */
export function subscribeToServerInitialization(showGameDurationCallback?: () => void) {
    let dayCounter = 0;
    let noPlayersDayCounter = 0;

    subscriptions.upsert("server-initialization", () => context.subscribe("interval.day", () => {
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
        noPlayersDayCounter = handleMultiplayerDialog(noPlayersDayCounter, showGameDurationCallback);
    }))
}



export function unsubscribeFromServerReset() {
    subscriptions.dispose("server-reset");
}




export function unsubscribeFromServerInitialization() {
    subscriptions.dispose("server-initialization");
}

export function unsubscribeFromIfStarted() {
    subscriptions.dispose("server-if-started");
}
