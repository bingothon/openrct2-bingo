export function waterTiles(): Tile[] {
    let tiles = [];
    for (let x = 1; x < map.size.x - 1; x++) {
        for (let y = 1; y < map.size.y - 1; y++) {
            const tile = map.getTile(x, y);
            for (const element of tile.elements) {
                if (element.type === "surface" && (element as SurfaceElement).waterHeight !== 0) {
                    tiles.push(tile);
                }
            }
        }
    }
    tiles.forEach(tile => {
        console.log(`Water tile at (${tile.x}, ${tile.y}), height: ${(tile.elements[0] as SurfaceElement).waterHeight}`);
    });
    return tiles;
}

