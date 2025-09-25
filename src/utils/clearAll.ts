export function clearAllTiles(callback?: () => void) {
    context.executeAction('clearAllTiles', {}, (result) => {
        if (result.error) {
            console.log('Failed to clear all tiles:', result.errorMessage);
            if (callback) {
                callback();
            }
        } else {
            if (callback) {
                callback();
            }
            console.log('All tiles cleared.');
        }
    });
}

export function clearAllRides(callback?: () => void) {
    context.executeAction('clearAllRides', {}, (result) => {
        if (result.error) {
            console.log('Failed to clear all rides:', result.errorMessage);
            if (callback) {
                callback();
            }
        } else {
            if (callback) {
                callback();
            }
            console.log('All rides cleared.');
        }
    });
}

export function flatAllLand(callback?: () => void) {
    context.executeAction('flatAllLand', {}, (result) => {
        if (result.error) {
            console.log('Failed to flatten all land:', result.errorMessage);
        } else {
            if (callback) {
                callback();
            }
            console.log('All land flattened.');
        }
    });
}

