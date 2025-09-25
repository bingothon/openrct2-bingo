export function addRandomTrees(callback: Function) {
    const mapSize = map.size;
    const excludedTiles = [
        { x: 1, y: 30 },
        { x: 2, y: 30 },
        { x: 3, y: 29 },
        { x: 3, y: 30 },
        { x: 3, y: 31 }
    ];

    const treeObjects = objectManager.getAllObjects("small_scenery").filter((object) => object.name.toLowerCase().search("tree") !== -1).filter((object) => object.name.toLowerCase().search("snow") === -1);

    if (treeObjects.length === 0) {
        ui.showError("No Trees", "There are no tree objects available.");
        return;
    }

    for (let x = 1; x < mapSize.x - 1; x++) {
        for (let y = 1; y < mapSize.y - 1; y++) {
            // Randomly decide whether to place a tree
            if (Math.random() < 0.05) { // Adjust the probability as needed
                const randomTree = treeObjects[Math.floor(Math.random() * treeObjects.length)];
                const tile = map.getTile(x, y);

                if (!tile) continue;
                const isExcluded = excludedTiles.some(tile => tile.x === x && tile.y === y);
                if (isExcluded) {
                    console.log(`Skipping tile at (${x}, ${y}) as it is in the excluded list.`);
                    continue;
                }
                context.queryAction('smallsceneryplace', {
                    x: x * 32, // Convert tile to subunits
                    y: y * 32, // Convert tile to subunits
                    z: 0,
                    direction: 0,
                    object: randomTree.index,
                    quadrant: 0,
                    primaryColour: 0,
                    secondaryColour: 0,
                    tertiaryColour: 0,
                }, (result) => {
                    if (result.error) {
                        console.log(`Failed to place tree at (${x}, ${y}): ${result.errorMessage}`);
                    } else {
                        if (result.cost && result.cost > 0) {
                            context.executeAction('addCash', { args: { cash: result.cost } }, (result) => {
                                if (result.error) {
                                    console.log('Failed to add cash:', result.errorMessage);
                                }
                            });
                        }
                        context.executeAction('smallsceneryplace', {
                            x: x * 32, // Convert tile to subunits
                            y: y * 32, // Convert tile to subunits
                            z: 0,
                            direction: 0,
                            object: randomTree.index,
                            quadrant: 0,
                            primaryColour: 0,
                            secondaryColour: 0,
                            tertiaryColour: 0,

                        }, (result) => {
                            if (result.error) {
                                console.log(`Failed to place tree at (${x}, ${y}): ${result.errorMessage}`);
                            } else {
                                // console.log(`Placed tree at (${x}, ${y})`);
                            }
                        });
                    }
                });

            }
        }
    }
    if (callback) {
        callback();
    }
}

