/**
 * Toggles sandbox mode and clearance checks with a single boolean, using a callback.
 */
export function debugMode(bool: 1 | 0, callback?: () => void) {
    // Define the arguments globally for sandbox mode and clearance checks
    const sandboxArgs: CheatSetArgs = {
        type: 0, // CheatType index for SandboxMode
        param1: bool, // Enable or disable based on `bool`
        param2: 0, // No secondary parameter
    };

    const clearanceArgs: CheatSetArgs = {
        type: 1, // CheatType index for DisableClearanceChecks
        param1: bool, // Enable or disable based on `bool`
        param2: 0, // No secondary parameter
    };

    // Toggle sandbox mode first
    context.executeAction("cheatset", sandboxArgs, (sandboxResult) => {
        if (sandboxResult.error) {
            console.log("Failed to toggle sandbox mode:", sandboxResult.errorMessage);
        } else {
            console.log(`Sandbox mode ${bool === 1 ? "enabled" : "disabled"}.`);

            // Then toggle clearance checks
            context.executeAction("cheatset", clearanceArgs, (clearanceResult) => {
                if (clearanceResult.error) {
                    console.log(
                        `Failed to ${bool === 1 ? "disable" : "enable"} clearance checks:`,
                        clearanceResult.errorMessage
                    );
                } else {
                    console.log(
                        `Clearance checks ${bool === 1 ? "disabled" : "enabled"}.`
                    );

                    // Proceed to the callback if provided
                    if (callback) {
                        callback();
                    }
                }
            });
        }
    });
}

export function renewRides(callback?: () => void) {
    // Define the arguments for renewing rides
    const renewRidesArgs: CheatSetArgs = {
        type: 29, // CheatType::renewRides in OpenRCT2 (27 is removeLitter)
        param1: 0, // Enable the action (if required by the cheat)
        param2: 0, // No secondary parameter
    };

    // Execute the renew rides action
    context.executeAction("cheatset", renewRidesArgs, (result) => {
        if (result.error) {
            console.log("Failed to renew rides:", result.errorMessage);
        } else {
            console.log("Rides successfully renewed.");

            // Proceed to the callback if provided
            if (callback) {
                callback();
            }
        }
    });
}


