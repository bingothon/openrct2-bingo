import { FOOT_PATH_LOCATIONS, PVP_FOOT_PATH_LOCATIONS } from "../constants";

export function setFootPaths(callback: () => void) {
    FOOT_PATH_LOCATIONS.forEach((location) => {
        const footpathAction = {
            x: location.x * 32,
            y: location.y * 32,
            z: 112, // Fixed Z-coordinate
            direction: 0xFF, // Auto direction
            object: 0, // Default footpath object
            railingsObject: 0, // No railings
            slopeType: 0, // Flat footpath
            slopeDirection: 0,
            constructFlags: 0 // No special flags
        };
        // queryAction throws on invalid args; don't let one tile abort the init chain
        try {
            context.queryAction("footpathplace", footpathAction, (result) => {
                if (result.cost && result.cost > 0) {
                    context.executeAction('addCash', { args: { cash: result.cost } }, (result) => {
                        if (result.error) {
                            console.log('Failed to add cash:', result.errorMessage);
                        }
                        context.executeAction("footpathplace", footpathAction, (result) => {
                            if (result.error) {
                                console.log(`Failed to place footpath at (${footpathAction.x}, ${footpathAction.y}):`, result.error);
                            } else {
                                console.log(`Footpath placed at (${footpathAction.x}, ${footpathAction.y})`);
                            }
                        });
                    });
                }
            });
        } catch (error) {
            console.log(`Footpath query failed at (${footpathAction.x}, ${footpathAction.y}):`, error);
        }
    });
    if (callback) {
        callback();
    }
}

export function setPVPFootPaths(callback: () => void) {
    PVP_FOOT_PATH_LOCATIONS.forEach((location) => {
        const footpathAction = {
            x: location.x * 32,
            y: location.y * 32,
            z: 112, // Fixed Z-coordinate
            direction: 0xFF, // Auto direction
            object: 0, // Default footpath object
            railingsObject: 0, // No railings
            slopeType: 0, // Flat footpath
            slopeDirection: 0,
            constructFlags: 0 // No special flags
        };
        // queryAction throws on invalid args; don't let one tile abort the init chain
        try {
            context.queryAction("footpathplace", footpathAction, (result) => {
                if (result.cost && result.cost > 0) {
                    context.executeAction('addCash', { args: { cash: result.cost } }, (result) => {
                        if (result.error) {
                            console.log('Failed to add cash:', result.errorMessage);
                        }
                        context.executeAction("footpathplace", footpathAction, (result) => {
                            if (result.error) {
                                console.log(`Failed to place footpath at (${footpathAction.x}, ${footpathAction.y}):`, result.error);
                            } else {
                                // console.log(`Footpath placed at (${footpathAction.x}, ${footpathAction.y})`);
                            }
                        });
                    });
                }
            });
        } catch (error) {
            console.log(`Footpath query failed at (${footpathAction.x}, ${footpathAction.y}):`, error);
        }
    });
    if (callback) {
        callback();
    }
}


