// Tile Analyzer for OpenRCT2
// Generates JSON analysis from tile inspection data

export class TileAnalyzer {
    private inspectedTiles: Array<{
        coordinates: {x: number, y: number},
        tile: any,
        timestamp: number
    }> = [];

    /**
     * Records a tile inspection for analysis
     */
    recordTileInspection(x: number, y: number, tile: any) {
        this.inspectedTiles.push({
            coordinates: {x, y},
            tile: tile,
            timestamp: Date.now()
        });
    }

    /**
     * Analyzes all recorded tiles and generates JSON
     */
    generateAnalysis(): any {
        const analysis = {
            summary: {
                totalTilesInspected: this.inspectedTiles.length,
                entryTiles: 0,
                footpathTiles: 0,
                surfaceOnlyTiles: 0,
                unownedTiles: 0,
                ownedTiles: 0
            },
            tiles: [] as any[],
            categorizedTiles: {
                entryTiles: [] as {x: number, y: number}[],
                footpathTiles: [] as {x: number, y: number}[],
                surfaceOnlyTiles: [] as {x: number, y: number}[],
                unownedTiles: [] as {x: number, y: number}[],
                ownedTiles: [] as {x: number, y: number}[]
            },
            patterns: {} as any
        };

        // Process each tile
        this.inspectedTiles.forEach(({coordinates, tile}) => {
            const tileData = this.analyzeTile(coordinates, tile);
            analysis.tiles.push(tileData);

            // Categorize tiles
            if (tileData.type === 'entry') {
                analysis.categorizedTiles.entryTiles.push(coordinates);
                analysis.summary.entryTiles++;
            } else if (tileData.type === 'footpath') {
                analysis.categorizedTiles.footpathTiles.push(coordinates);
                analysis.summary.footpathTiles++;
            } else if (tileData.type === 'surface_only') {
                analysis.categorizedTiles.surfaceOnlyTiles.push(coordinates);
                analysis.summary.surfaceOnlyTiles++;
            }

            if (!tileData.ownership.owned) {
                analysis.categorizedTiles.unownedTiles.push(coordinates);
                analysis.summary.unownedTiles++;
            } else {
                analysis.categorizedTiles.ownedTiles.push(coordinates);
                analysis.summary.ownedTiles++;
            }
        });

        // Analyze patterns
        analysis.patterns = this.analyzePatterns(analysis.categorizedTiles);

        return analysis;
    }

    /**
     * Analyzes a single tile
     */
    private analyzeTile(coordinates: {x: number, y: number}, tile: any): any {
        const elements = tile.elements.map((element: any, index: number) => ({
            index,
            type: element.type,
            z: element.baseZ,
            properties: this.getElementProperties(element)
        }));

        const tileType = this.determineTileType(elements);
        
        return {
            coordinates,
            type: tileType,
            elements,
            ownership: {
                owned: (tile as any).ownership || false,
                constructionRights: (tile as any).constructionRights || false,
                parkEntrance: (tile as any).parkEntrance || false
            }
        };
    }

    /**
     * Determines the tile type based on elements
     */
    private determineTileType(elements: any[]): string {
        const elementTypes = elements.map(e => e.type);
        
        if (elementTypes.indexOf('entrance') !== -1) {
            return 'entry';
        } else if (elementTypes.indexOf('footpath') !== -1) {
            return 'footpath';
        } else if (elementTypes.length === 1 && elementTypes[0] === 'surface') {
            return 'surface_only';
        } else {
            return 'complex';
        }
    }

    /**
     * Extracts properties from tile elements
     */
    private getElementProperties(element: any): any {
        const properties: any = {};
        
        switch (element.type) {
            case 'surface':
                properties.slope = element.slope;
                properties.waterHeight = element.waterHeight;
                properties.surfaceStyle = element.surfaceStyle;
                properties.edgeStyle = element.edgeStyle;
                break;
            case 'footpath':
                properties.pathType = element.pathType;
                properties.direction = element.direction;
                properties.addition = element.addition;
                break;
            case 'entrance':
                properties.object = element.object;
                properties.direction = element.direction;
                properties.ride = element.ride;
                break;
            case 'track':
                properties.trackType = element.trackType;
                properties.sequence = element.sequence;
                properties.ride = element.ride;
                break;
            case 'small_scenery':
                properties.object = element.object;
                properties.quadrant = element.quadrant;
                break;
            case 'large_scenery':
                properties.object = element.object;
                properties.sequence = element.sequence;
                break;
            case 'wall':
                properties.object = element.object;
                properties.direction = element.direction;
                break;
        }
        
        return properties;
    }

    /**
     * Analyzes patterns in the tile data
     */
    private analyzePatterns(categorizedTiles: any): any {
        const patterns: any = {};

        // Analyze entry clusters
        if (categorizedTiles.entryTiles.length > 0) {
            patterns.entryCluster = this.analyzeEntryCluster(categorizedTiles.entryTiles);
        }

        // Analyze footpath patterns
        if (categorizedTiles.footpathTiles.length > 0) {
            patterns.footpathPattern = this.analyzeFootpathPattern(categorizedTiles.footpathTiles);
        }

        // Analyze surface-only areas
        if (categorizedTiles.surfaceOnlyTiles.length > 0) {
            patterns.surfaceOnlyArea = this.analyzeSurfaceOnlyArea(categorizedTiles.surfaceOnlyTiles);
        }

        return patterns;
    }

    /**
     * Analyzes entry tile clusters
     */
    private analyzeEntryCluster(entryTiles: {x: number, y: number}[]): any {
        const xGroups: {[key: number]: {x: number, y: number}[]} = {};
        const yGroups: {[key: number]: {x: number, y: number}[]} = {};

        entryTiles.forEach(tile => {
            if (!xGroups[tile.x]) xGroups[tile.x] = [];
            if (!yGroups[tile.y]) yGroups[tile.y] = [];
            xGroups[tile.x].push(tile);
            yGroups[tile.y].push(tile);
        });

        // Find the largest cluster
        const xGroupValues = Object.keys(xGroups).map(key => xGroups[parseInt(key)]);
        const yGroupValues = Object.keys(yGroups).map(key => yGroups[parseInt(key)]);
        const largestXGroup = xGroupValues.reduce((a: any, b: any) => a.length > b.length ? a : b);
        const largestYGroup = yGroupValues.reduce((a: any, b: any) => a.length > b.length ? a : b);

        if (largestXGroup.length > largestYGroup.length) {
            return {
                description: `Entry tiles form a vertical line at x=${largestXGroup[0].x}`,
                coordinates: largestXGroup,
                pattern: 'vertical'
            };
        } else {
            return {
                description: `Entry tiles form a horizontal line at y=${largestYGroup[0].y}`,
                coordinates: largestYGroup,
                pattern: 'horizontal'
            };
        }
    }

    /**
     * Analyzes footpath patterns
     */
    private analyzeFootpathPattern(footpathTiles: {x: number, y: number}[]): any {
        const xGroups: {[key: number]: {x: number, y: number}[]} = {};
        const yGroups: {[key: number]: {x: number, y: number}[]} = {};

        footpathTiles.forEach(tile => {
            if (!xGroups[tile.x]) xGroups[tile.x] = [];
            if (!yGroups[tile.y]) yGroups[tile.y] = [];
            xGroups[tile.x].push(tile);
            yGroups[tile.y].push(tile);
        });

        const xGroupValues = Object.keys(xGroups).map(key => xGroups[parseInt(key)]);
        const yGroupValues = Object.keys(yGroups).map(key => yGroups[parseInt(key)]);
        const largestXGroup = xGroupValues.reduce((a: any, b: any) => a.length > b.length ? a : b);
        const largestYGroup = yGroupValues.reduce((a: any, b: any) => a.length > b.length ? a : b);

        if (largestXGroup.length > largestYGroup.length) {
            return {
                description: `Footpath tiles form a vertical line at x=${largestXGroup[0].x}`,
                coordinates: largestXGroup,
                pattern: 'vertical'
            };
        } else {
            return {
                description: `Footpath tiles form a horizontal line at y=${largestYGroup[0].y}`,
                coordinates: largestYGroup,
                pattern: 'horizontal'
            };
        }
    }

    /**
     * Analyzes surface-only areas
     */
    private analyzeSurfaceOnlyArea(surfaceTiles: {x: number, y: number}[]): any {
        return {
            description: `Surface-only tiles in ${surfaceTiles.length} locations`,
            coordinates: surfaceTiles,
            pattern: 'scattered'
        };
    }

    /**
     * Exports analysis as JSON string
     */
    exportAsJSON(): string {
        return JSON.stringify(this.generateAnalysis(), null, 2);
    }

    /**
     * Clears all recorded data
     */
    clear() {
        this.inspectedTiles = [];
    }

    /**
     * Gets the count of inspected tiles
     */
    getTileCount(): number {
        return this.inspectedTiles.length;
    }
}

// Global instance
export const tileAnalyzer = new TileAnalyzer();

// Console commands for easy access
if (typeof console !== 'undefined') {
    (console as any).analyze = {
        record: (x: number, y: number) => {
            const tile = map.getTile(x, y);
            if (tile) {
                tileAnalyzer.recordTileInspection(x, y, tile);
                console.log(`Recorded tile (${x}, ${y}) for analysis`);
            } else {
                console.log(`Invalid tile at (${x}, ${y})`);
            }
        },
        generate: () => {
            const analysis = tileAnalyzer.generateAnalysis();
            console.log('Tile Analysis:', analysis);
            return analysis;
        },
        export: () => {
            const json = tileAnalyzer.exportAsJSON();
            console.log('JSON Export:', json);
            return json;
        },
        clear: () => {
            tileAnalyzer.clear();
            console.log('Analysis data cleared');
        },
        count: () => {
            console.log(`Recorded ${tileAnalyzer.getTileCount()} tiles`);
        }
    };
}
