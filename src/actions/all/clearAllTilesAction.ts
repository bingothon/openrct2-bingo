export function clearAllTilesAction() {
  return {
    name: "clearAllTiles",
    query: (event: GameActionEventArgs): GameActionResult => {
      console.log("Querying action with event args:", event.args);
      return { error: 0 };
    },
    execute: (event: GameActionEventArgs): GameActionResult => {
      // Dummy usage to avoid TypeScript warning
      void event;
      const mapSize = map.size;
      const tilesX = mapSize.x;
      const tilesY = mapSize.y;

      const excludedTiles = [
        { x: 1, y: 30 },
        { x: 2, y: 30 },
        { x: 3, y: 29 },
        { x: 3, y: 30 },
        { x: 3, y: 31 }
      ];

      console.log(`Clearing map of size ${tilesX}x${tilesY} tiles...`);

      for (let x = 0; x < tilesX; x++) {
        for (let y = 0; y < tilesY; y++) {
          const isExcluded = excludedTiles.some(tile => tile.x === x && tile.y === y);
          if (isExcluded) {
            console.log(`Skipping tile at (${x}, ${y}) as it is in the excluded list.`);
            continue;
          }

          const tile = map.getTile(x, y);
          const tileElements = tile.elements;

          for (let i = 0; i < tileElements.length; i++) {
            if (tileElements[i].type === "track") {
              tile.removeElement(i);
            }
          }
        }
      }
      return { error: 0 };
    }
  };
}


