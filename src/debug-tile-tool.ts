
// Simple Debug Tile Tool for OpenRCT2
// Provides basic tile inspection without complex UI

import { tileAnalyzer } from "./tile-analyzer";

/**
 * Simple debug tool for inspecting tiles in OpenRCT2
 */
export class SimpleDebugTileTool {
    private isActive = false;
    private selectedTile: {x: number, y: number} | null = null;

    /**
     * Activates the simple debug tool
     */
    activate() {
        if (this.isActive) {
            console.log("Debug tool is already active");
            return;
        }

        this.isActive = true;
        this.activateTileSelectionTool();
        console.log("Debug tool activated! Click on any tile to inspect it.");
    }

    /**
     * Deactivates the debug tool
     */
    deactivate() {
        if (!this.isActive) {
            console.log("Debug tool is not active");
            return;
        }

        this.isActive = false;
        this.deactivateTileSelectionTool();
        this.selectedTile = null;
        console.log("Debug tool deactivated");
    }

    /**
     * Activates the tile selection tool
     */
    private activateTileSelectionTool() {
        if (typeof ui === 'undefined') {
            console.log("UI not available - debug tool requires UI access");
            return;
        }

        ui.activateTool({
            id: "simple-debug-tile-selector",
            cursor: "cross_hair",
            onDown: (e) => this.onTileSelect(e),
            onUp: (e) => this.onTileSelect(e)
        });
    }

    /**
     * Deactivates the tile selection tool
     */
    private deactivateTileSelectionTool() {
        // Tool will be cancelled when we deactivate
    }

    /**
     * Handles tile selection when clicking
     */
    private onTileSelect(e: any) {
        if (!e || !e.mapCoords) {
            return;
        }

        const tileCoords = this.worldToTile(e.mapCoords);
        this.selectedTile = tileCoords;
        
        // Record tile for analysis
        const tile = map.getTile(tileCoords.x, tileCoords.y);
        if (tile) {
            tileAnalyzer.recordTileInspection(tileCoords.x, tileCoords.y, tile);
        }
        
        this.logTileInfo(tileCoords.x, tileCoords.y);
    }

    /**
     * Converts world coordinates to tile coordinates
     */
    private worldToTile(worldCoords: {x: number, y: number}): {x: number, y: number} {
        return {
            x: Math.floor(worldCoords.x / 32),
            y: Math.floor(worldCoords.y / 32)
        };
    }

    /**
     * Logs detailed information about a tile
     */
    logTileInfo(x: number, y: number) {
        try {
            const tile = map.getTile(x, y);
            if (!tile) {
                console.log(`Invalid tile at (${x}, ${y})`);
                return;
            }

            console.log(`\nTILE INSPECTION: (${x}, ${y})`);
            console.log(`Coordinates: (${x}, ${y})`);
            console.log(`Elements: ${tile.elements.length}`);
            console.log(`Ownership: ${(tile as any).ownership ? 'Owned' : 'Unowned'}`);
            console.log(`Construction Rights: ${(tile as any).constructionRights ? 'Yes' : 'No'}`);
            console.log(`Park Entrance: ${(tile as any).parkEntrance ? 'Yes' : 'No'}`);
            
            console.log(`\nELEMENTS:`);
            tile.elements.forEach((element, index) => {
                console.log(`  ${index}: ${element.type} (z: ${element.baseZ})`);
                
                // Add specific element details
                switch (element.type) {
                    case 'surface':
                        const surface = element as any;
                        console.log(`    - Slope: ${surface.slope}`);
                        console.log(`    - Water Height: ${surface.waterHeight}`);
                        console.log(`    - Surface Style: ${surface.surfaceStyle}`);
                        console.log(`    - Edge Style: ${surface.edgeStyle}`);
                        break;
                    case 'footpath':
                        const path = element as any;
                        console.log(`    - Path Type: ${path.pathType}`);
                        console.log(`    - Direction: ${path.direction}`);
                        console.log(`    - Addition: ${path.addition}`);
                        break;
                    case 'track':
                        const track = element as any;
                        console.log(`    - Track Type: ${track.trackType}`);
                        console.log(`    - Sequence: ${track.sequence}`);
                        console.log(`    - Ride: ${track.ride}`);
                        break;
                    case 'small_scenery':
                        const smallScenery = element as any;
                        console.log(`    - Object: ${smallScenery.object}`);
                        console.log(`    - Quadrant: ${smallScenery.quadrant}`);
                        break;
                    case 'large_scenery':
                        const largeScenery = element as any;
                        console.log(`    - Object: ${largeScenery.object}`);
                        console.log(`    - Sequence: ${largeScenery.sequence}`);
                        break;
                    case 'wall':
                        const wall = element as any;
                        console.log(`    - Object: ${wall.object}`);
                        console.log(`    - Direction: ${wall.direction}`);
                        break;
                    case 'entrance':
                        const entrance = element as any;
                        console.log(`    - Object: ${entrance.object}`);
                        console.log(`    - Direction: ${entrance.direction}`);
                        console.log(`    - Ride: ${entrance.ride}`);
                        break;
                }
            });

            console.log(`\nTile inspection complete!\n`);

        } catch (error) {
            console.log(`Error inspecting tile (${x}, ${y}): ${(error as Error).message}`);
        }
    }

    /**
     * Gets the currently selected tile
     */
    getSelectedTile(): {x: number, y: number} | null {
        return this.selectedTile;
    }

    /**
     * Clears the current selection
     */
    clearSelection() {
        this.selectedTile = null;
        console.log("Selection cleared");
    }

    /**
     * Centers the view on the selected tile
     */
    centerOnSelected() {
        if (this.selectedTile) {
            const worldCoords = {
                x: this.selectedTile.x * 32,
                y: this.selectedTile.y * 32
            };
            ui.mainViewport.moveTo(worldCoords);
            console.log(`Centered view on tile (${this.selectedTile.x}, ${this.selectedTile.y})`);
        } else {
            console.log("No tile selected");
        }
    }

    /**
     * Finds tiles with specific element types
     */
    findTilesWithElement(elementType: string, area?: {x1: number, y1: number, x2: number, y2: number}): Array<{coords: {x: number, y: number}, tile: any, element: any}> {
        const results: Array<{coords: {x: number, y: number}, tile: any, element: any}> = [];
        const mapSize = map.size;
        
        const x1 = area ? Math.min(area.x1, area.x2) : 0;
        const y1 = area ? Math.min(area.y1, area.y2) : 0;
        const x2 = area ? Math.max(area.x1, area.x2) : mapSize.x - 1;
        const y2 = area ? Math.max(area.y1, area.y2) : mapSize.y - 1;
        
        console.log(`Searching for ${elementType} elements in area (${x1},${y1}) to (${x2},${y2})...`);
        
        for (let x = x1; x <= x2; x++) {
            for (let y = y1; y <= y2; y++) {
                try {
                    const tile = map.getTile(x, y);
                    if (tile) {
                        tile.elements.forEach(element => {
                            if (element.type === elementType) {
                                results.push({ coords: { x, y }, tile, element });
                            }
                        });
                    }
                } catch (error) {
                    // Skip invalid tiles
                }
            }
        }
        
        console.log(`Found ${results.length} tiles with ${elementType} elements`);
        return results;
    }

    /**
     * Shows current viewport information
     */
    showViewportInfo() {
        if (typeof ui === 'undefined') {
            console.log("UI not available");
            return;
        }

        const viewport = ui.mainViewport;
        const centerPos = viewport.getCentrePosition();
        const tileCoords = this.worldToTile(centerPos);
        
        console.log(`\nVIEWPORT INFO:`);
        console.log(`Center Position: (${centerPos.x}, ${centerPos.y})`);
        console.log(`Center Tile: (${tileCoords.x}, ${tileCoords.y})`);
        console.log(`Viewport Size: ${viewport.right - viewport.left} x ${viewport.bottom - viewport.top}`);
        console.log(`Zoom: ${viewport.zoom}`);
        console.log(`Rotation: ${viewport.rotation}\n`);
    }
}

// Global instance
export const debugTile = new SimpleDebugTileTool();

// Console commands for easy access
if (typeof console !== 'undefined') {
    (console as any).debug = {
        // Basic commands
        start: () => debugTile.activate(),
        stop: () => debugTile.deactivate(),
        info: (x: number, y: number) => debugTile.logTileInfo(x, y),
        
        // Selection commands
        selected: () => debugTile.getSelectedTile(),
        clear: () => debugTile.clearSelection(),
        center: () => debugTile.centerOnSelected(),
        
        // Search commands
        find: (elementType: string, x1?: number, y1?: number, x2?: number, y2?: number) => {
            const area = (x1 !== undefined && y1 !== undefined && x2 !== undefined && y2 !== undefined) 
                ? { x1, y1, x2, y2 } : undefined;
            return debugTile.findTilesWithElement(elementType, area);
        },
        
        // Viewport commands
        viewport: () => debugTile.showViewportInfo(),
        
        // Quick tile inspection
        tile: (x: number, y: number) => {
            console.log(`Inspecting tile (${x}, ${y}):`);
            debugTile.logTileInfo(x, y);
        }
    };
}