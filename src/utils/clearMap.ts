/**
 * Utility function to remove all objects from the map.
 * This function iterates through all tiles and removes objects, including scenery and rides.
 */
export function clearMap() {
    const mapSize = map.size; // Get the map size in tiles
    const tilesX = mapSize.x; // Total tiles in the X direction
    const tilesY = mapSize.y; // Total tiles in the Y direction

    console.log(`Clearing map of size ${tilesX}x${tilesY} tiles...`);

    for (let x = 0; x < tilesX; x++) {
        for (let y = 0; y < tilesY; y++) {
            const tile = map.getTile(x, y);

            tile.elements.forEach((element) => {
                switch (element.type) {
                    case "small_scenery":
                        context.executeAction(
                            "smallsceneryremove",
                            {
                                x: x * 32, // Convert tile to subunits
                                y: y * 32, // Convert tile to subunits
                                z: element.baseZ,
                                object: element.object,
                                quadrant: element.quadrant,
                            },
                            (result) => {
                                if (result.error) {
                                    console.log(
                                        `Failed to remove small scenery at (${x}, ${y}), z: ${element.baseZ} - ${result.errorMessage}`
                                    );
                                } else {
                                    console.log(
                                        `Removed small scenery at (${x}, ${y}), z: ${element.baseZ}`
                                    );
                                }
                            }
                        );
                        break;

                    case "large_scenery":
                        context.executeAction(
                            "largesceneryremove",
                            {
                                x: x * 32, // Convert tile to subunits
                                y: y * 32, // Convert tile to subunits
                                z: element.baseZ,
                                object: element.object,
                            },
                            (result) => {
                                if (result.error) {
                                    console.log(
                                        `Failed to remove large scenery at (${x}, ${y}), z: ${element.baseZ} - ${result.errorMessage}`
                                    );
                                } else {
                                    console.log(
                                        `Removed large scenery at (${x}, ${y}), z: ${element.baseZ}`
                                    );
                                }
                            }
                        );
                        break;

                    // Add cases for other object types as needed
                    default:
                        break;
                }
            });
        }
    }

    console.log("Map clearing process complete.");
}

