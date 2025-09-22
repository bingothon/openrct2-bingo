// Footpath Extractor for OpenRCT2
// Scans the entire map for footpaths using correct OpenRCT2 types and surface objects

export interface FootpathData {
    x: number;
    y: number;
    z: number;
    properties: {
        // Legacy footpath object (null for NSF footpaths)
        object: number | null;
        // NSF footpath surface object (the actual path type)
        surfaceObject: number | null;
        // NSF footpath railings object
        railingsObject: number | null;
        // Path connectivity
        edges: number;
        corners: number;
        slopeDirection: Direction | null;
        isBlockedByVehicle: boolean;
        // Base element properties
        baseHeight: number;
        clearanceHeight: number;
        occupiedQuadrants: number;
        isGhost: boolean;
        isHidden: boolean;
    };
}

export class FootpathExtractor {
    /**
     * Extracts all footpath locations from the map using correct OpenRCT2 types
     */
    extractAllFootpaths(): FootpathData[] {
        const footpaths: FootpathData[] = [];
        const mapSize = map.size;
        
        console.log(`Scanning map (${mapSize.x}x${mapSize.y}) for footpaths...`);
        
        for (let x = 0; x < mapSize.x; x++) {
            for (let y = 0; y < mapSize.y; y++) {
                try {
                    const tile = map.getTile(x, y);
                    if (tile) {
                        tile.elements.forEach(element => {
                            if (element.type === 'footpath') {
                                const footpathElement = element as FootpathElement;
                                const footpathData: FootpathData = {
                                    x: x,
                                    y: y,
                                    z: element.baseZ,
                                    properties: {
                                        object: footpathElement.object,
                                        surfaceObject: footpathElement.surfaceObject,
                                        railingsObject: footpathElement.railingsObject,
                                        edges: footpathElement.edges,
                                        corners: footpathElement.corners,
                                        slopeDirection: footpathElement.slopeDirection,
                                        isBlockedByVehicle: footpathElement.isBlockedByVehicle,
                                        baseHeight: element.baseHeight,
                                        clearanceHeight: element.clearanceHeight,
                                        occupiedQuadrants: element.occupiedQuadrants,
                                        isGhost: element.isGhost,
                                        isHidden: element.isHidden
                                    }
                                };
                                footpaths.push(footpathData);
                            }
                        });
                    }
                } catch (error) {
                    // Skip invalid tiles
                }
            }
        }
        
        console.log(`Found ${footpaths.length} footpath tiles`);
        return footpaths;
    }

    /**
     * Extracts footpaths by surface object type (NSF footpaths)
     */
    extractFootpathsBySurfaceObject(surfaceObjectType: number): FootpathData[] {
        const allFootpaths = this.extractAllFootpaths();
        
        return allFootpaths.filter(footpath => 
            footpath.properties.surfaceObject === surfaceObjectType
        );
    }

    /**
     * Extracts footpaths by legacy object type (old footpaths)
     */
    extractFootpathsByLegacyObject(objectType: number): FootpathData[] {
        const allFootpaths = this.extractAllFootpaths();
        
        return allFootpaths.filter(footpath => 
            footpath.properties.object === objectType
        );
    }

    /**
     * Extracts footpaths by railings object type
     */
    extractFootpathsByRailingsObject(railingsObjectType: number): FootpathData[] {
        const allFootpaths = this.extractAllFootpaths();
        
        return allFootpaths.filter(footpath => 
            footpath.properties.railingsObject === railingsObjectType
        );
    }

    /**
     * Gets footpaths with specific surface object name (e.g., "Tarmac Footpath")
     */
    extractFootpathsBySurfaceObjectName(surfaceObjectName: string): FootpathData[] {
        const allFootpaths = this.extractAllFootpaths();
        
        return allFootpaths.filter(footpath => {
            if (footpath.properties.surfaceObject === null) return false;
            
            try {
                if (typeof objectManager !== 'undefined') {
                    const object = objectManager.getObject('footpath_surface', footpath.properties.surfaceObject);
                    return object && object.name.indexOf(surfaceObjectName) !== -1;
                }
                return false;
            } catch (error) {
                return false;
            }
        });
    }

    /**
     * Gets the object index for a specific footpath surface object by identifier
     */
    private getFootpathSurfaceObjectIndex(identifier: string): number | null {
        try {
            if (typeof objectManager !== 'undefined') {
                console.log(`Loading object with identifier: ${identifier}`);
                const object = objectManager.load(identifier);
                if (object) {
                    console.log(`Successfully loaded object: ${object.name} (index: ${object.index})`);
                    // Use the object's index directly instead of searching in the array
                    return object.index;
                } else {
                    console.log(`Failed to load object with identifier: ${identifier}`);
                }
            }
            return null;
        } catch (error) {
            console.log(`Error loading object ${identifier}:`, error);
            return null;
        }
    }

    /**
     * Lists all available footpath surface objects
     */
    listFootpathSurfaceObjects(): void {
        try {
            if (typeof objectManager !== 'undefined') {
                const footpathSurfaceObjects = objectManager.getAllObjects('footpath_surface');
                console.log(`\n=== AVAILABLE FOOTPATH SURFACE OBJECTS ===`);
                console.log(`Found ${footpathSurfaceObjects.length} footpath surface objects:`);
                
                footpathSurfaceObjects.forEach((obj, index) => {
                    console.log(`${index}: ${obj.name} (identifier: ${obj.identifier})`);
                });
                console.log(`=== END FOOTPATH SURFACE OBJECTS ===\n`);
            }
        } catch (error) {
            console.log("Error listing footpath surface objects:", error);
        }
    }

    /**
     * Inspects specific tiles to see what footpath surface objects they have
     */
    inspectTilesForFootpaths(x1: number, y1: number, x2: number, y2: number): void {
        console.log(`\n=== INSPECTING TILES (${x1},${y1}) to (${x2},${y2}) FOR FOOTPATHS ===`);
        
        for (let x = x1; x <= x2; x++) {
            for (let y = y1; y <= y2; y++) {
                try {
                    const tile = map.getTile(x, y);
                    if (tile) {
                        tile.elements.forEach((element, index) => {
                            if (element.type === 'footpath') {
                                const footpathElement = element as FootpathElement;
                                console.log(`Tile (${x},${y}) - Element ${index}:`);
                                console.log(`  Surface Object: ${footpathElement.surfaceObject}`);
                                console.log(`  Railings Object: ${footpathElement.railingsObject}`);
                                console.log(`  Legacy Object: ${footpathElement.object}`);
                                
                                // Try to get object names
                                if (footpathElement.surfaceObject !== null) {
                                    try {
                                        const surfaceObj = objectManager.getObject('footpath_surface', footpathElement.surfaceObject);
                                        console.log(`  Surface Object Name: ${surfaceObj ? surfaceObj.name : 'Unknown'}`);
                                    } catch (e) {
                                        console.log(`  Surface Object Name: Error loading`);
                                    }
                                }
                            }
                        });
                    }
                } catch (error) {
                    // Skip invalid tiles
                }
            }
        }
        console.log(`=== END TILE INSPECTION ===\n`);
    }

    /**
     * Extracts footpaths by surface object identifier (e.g., "rct2.footpath_surface.tarmac")
     */
    extractFootpathsBySurfaceObjectIdentifier(identifier: string): FootpathData[] {
        const objectIndex = this.getFootpathSurfaceObjectIndex(identifier);
        if (objectIndex === null) {
            console.log(`Could not find object index for identifier: ${identifier}`);
            return [];
        }
        
        return this.extractFootpathsBySurfaceObject(objectIndex);
    }

    /**
     * Extracts footpaths in a specific area
     */
    extractFootpathsInArea(x1: number, y1: number, x2: number, y2: number): FootpathData[] {
        const footpaths: FootpathData[] = [];
        
        const minX = Math.min(x1, x2);
        const maxX = Math.max(x1, x2);
        const minY = Math.min(y1, y2);
        const maxY = Math.max(y1, y2);
        
        console.log(`Scanning area (${minX},${minY}) to (${maxX},${maxY}) for footpaths...`);
        
        for (let x = minX; x <= maxX; x++) {
            for (let y = minY; y <= maxY; y++) {
                try {
                    const tile = map.getTile(x, y);
                    if (tile) {
                        tile.elements.forEach(element => {
                            if (element.type === 'footpath') {
                                const footpathElement = element as FootpathElement;
                                const footpathData: FootpathData = {
                                    x: x,
                                    y: y,
                                    z: element.baseZ,
                                    properties: {
                                        object: footpathElement.object,
                                        surfaceObject: footpathElement.surfaceObject,
                                        railingsObject: footpathElement.railingsObject,
                                        edges: footpathElement.edges,
                                        corners: footpathElement.corners,
                                        slopeDirection: footpathElement.slopeDirection,
                                        isBlockedByVehicle: footpathElement.isBlockedByVehicle,
                                        baseHeight: element.baseHeight,
                                        clearanceHeight: element.clearanceHeight,
                                        occupiedQuadrants: element.occupiedQuadrants,
                                        isGhost: element.isGhost,
                                        isHidden: element.isHidden
                                    }
                                };
                                footpaths.push(footpathData);
                            }
                        });
                    }
                } catch (error) {
                    // Skip invalid tiles
                }
            }
        }
        
        console.log(`Found ${footpaths.length} footpath tiles in area`);
        return footpaths;
    }

    /**
     * Generates footpath_locations array (x, y coordinates only)
     */
    generateFootpathLocations(scale: number = 1): Array<{x: number, y: number}> {
        const footpaths = this.extractAllFootpaths();
        
        return footpaths.map(footpath => ({
            x: Math.floor(footpath.x / scale),
            y: Math.floor(footpath.y / scale)
        }));
    }

    /**
     * Generates detailed footpath_locations array with surface object information
     */
    generateDetailedFootpathLocations(scale: number = 1): Array<{
        x: number, 
        y: number, 
        z: number, 
        surfaceObject: number | null,
        railingsObject: number | null,
        edges: number,
        corners: number,
        slopeDirection: Direction | null
    }> {
        const footpaths = this.extractAllFootpaths();
        
        return footpaths.map(footpath => ({
            x: Math.floor(footpath.x / scale),
            y: Math.floor(footpath.y / scale),
            z: footpath.z,
            surfaceObject: footpath.properties.surfaceObject,
            railingsObject: footpath.properties.railingsObject,
            edges: footpath.properties.edges,
            corners: footpath.properties.corners,
            slopeDirection: footpath.properties.slopeDirection
        }));
    }

    /**
     * Generates footpath locations filtered by surface object type
     */
    generateFootpathLocationsBySurfaceObject(surfaceObjectType: number, scale: number = 1): Array<{x: number, y: number}> {
        const footpaths = this.extractFootpathsBySurfaceObject(surfaceObjectType);
        
        return footpaths.map(footpath => ({
            x: Math.floor(footpath.x / scale),
            y: Math.floor(footpath.y / scale)
        }));
    }

    /**
     * Generates footpath locations filtered by surface object name
     */
    generateFootpathLocationsBySurfaceObjectName(surfaceObjectName: string, scale: number = 1): Array<{x: number, y: number}> {
        const footpaths = this.extractFootpathsBySurfaceObjectName(surfaceObjectName);
        
        return footpaths.map(footpath => ({
            x: Math.floor(footpath.x / scale),
            y: Math.floor(footpath.y / scale)
        }));
    }

    /**
     * Generates footpath locations filtered by surface object identifier
     */
    generateFootpathLocationsBySurfaceObjectIdentifier(identifier: string, scale: number = 1): Array<{x: number, y: number}> {
        const footpaths = this.extractFootpathsBySurfaceObjectIdentifier(identifier);
        
        return footpaths.map(footpath => ({
            x: Math.floor(footpath.x / scale),
            y: Math.floor(footpath.y / scale)
        }));
    }

    /**
     * Generates footpath_locations for a specific area
     */
    generateFootpathLocationsInArea(x1: number, y1: number, x2: number, y2: number, scale: number = 1): Array<{x: number, y: number}> {
        const footpaths = this.extractFootpathsInArea(x1, y1, x2, y2);
        
        return footpaths.map(footpath => ({
            x: Math.floor(footpath.x / scale),
            y: Math.floor(footpath.y / scale)
        }));
    }

    /**
     * Analyzes footpath patterns and generates statistics using correct OpenRCT2 types
     */
    analyzeFootpathPatterns(): any {
        const footpaths = this.extractAllFootpaths();
        
        const analysis = {
            totalFootpaths: footpaths.length,
            surfaceObjects: {} as {[key: number]: number},
            railingsObjects: {} as {[key: number]: number},
            legacyObjects: {} as {[key: number]: number},
            edges: {} as {[key: number]: number},
            corners: {} as {[key: number]: number},
            slopeDirections: {} as {[key: number]: number},
            zLevels: {} as {[key: number]: number},
            patterns: {
                horizontal: [] as {x: number, y: number}[],
                vertical: [] as {x: number, y: number}[],
                diagonal: [] as {x: number, y: number}[],
                scattered: [] as {x: number, y: number}[]
            }
        };

        // Count surface objects, railings, etc.
        footpaths.forEach(footpath => {
            const surfaceObject = footpath.properties.surfaceObject;
            const railingsObject = footpath.properties.railingsObject;
            const legacyObject = footpath.properties.object;
            const edges = footpath.properties.edges;
            const corners = footpath.properties.corners;
            const slopeDirection = footpath.properties.slopeDirection;
            const z = footpath.z;

            if (surfaceObject !== null) {
                analysis.surfaceObjects[surfaceObject] = (analysis.surfaceObjects[surfaceObject] || 0) + 1;
            }
            if (railingsObject !== null) {
                analysis.railingsObjects[railingsObject] = (analysis.railingsObjects[railingsObject] || 0) + 1;
            }
            if (legacyObject !== null) {
                analysis.legacyObjects[legacyObject] = (analysis.legacyObjects[legacyObject] || 0) + 1;
            }
            
            analysis.edges[edges] = (analysis.edges[edges] || 0) + 1;
            analysis.corners[corners] = (analysis.corners[corners] || 0) + 1;
            if (slopeDirection !== null) {
                analysis.slopeDirections[slopeDirection] = (analysis.slopeDirections[slopeDirection] || 0) + 1;
            }
            analysis.zLevels[z] = (analysis.zLevels[z] || 0) + 1;
        });

        // Analyze patterns
        this.analyzeFootpathPatternsInternal(footpaths, analysis.patterns);

        return analysis;
    }

    /**
     * Analyzes footpath patterns
     */
    private analyzeFootpathPatternsInternal(footpaths: FootpathData[], patterns: any) {
        // Group by x and y coordinates
        const xGroups: {[key: number]: {x: number, y: number}[]} = {};
        const yGroups: {[key: number]: {x: number, y: number}[]} = {};

        footpaths.forEach(footpath => {
            if (!xGroups[footpath.x]) xGroups[footpath.x] = [];
            if (!yGroups[footpath.y]) yGroups[footpath.y] = [];
            xGroups[footpath.x].push({x: footpath.x, y: footpath.y});
            yGroups[footpath.y].push({x: footpath.x, y: footpath.y});
        });

        // Find horizontal patterns (same y)
        Object.keys(yGroups).forEach(y => {
            const group = yGroups[parseInt(y)];
            if (group.length >= 3) {
                patterns.horizontal.push(...group);
            }
        });

        // Find vertical patterns (same x)
        Object.keys(xGroups).forEach(x => {
            const group = xGroups[parseInt(x)];
            if (group.length >= 3) {
                patterns.vertical.push(...group);
            }
        });

        // Find diagonal patterns (x-y relationship)
        footpaths.forEach(footpath => {
            const diagonalNeighbors = footpaths.filter(other => 
                Math.abs(other.x - footpath.x) === 1 && 
                Math.abs(other.y - footpath.y) === 1
            );
            if (diagonalNeighbors.length >= 2) {
                patterns.diagonal.push({x: footpath.x, y: footpath.y});
            }
        });

        // Everything else is scattered
        const patternCoords: {[key: string]: boolean} = {};
        patterns.horizontal.forEach((p: any) => patternCoords[`${p.x},${p.y}`] = true);
        patterns.vertical.forEach((p: any) => patternCoords[`${p.x},${p.y}`] = true);
        patterns.diagonal.forEach((p: any) => patternCoords[`${p.x},${p.y}`] = true);

        footpaths.forEach(footpath => {
            const coord = `${footpath.x},${footpath.y}`;
            if (!patternCoords[coord]) {
                patterns.scattered.push({x: footpath.x, y: footpath.y});
            }
        });
    }

    /**
     * Exports footpath data as JSON
     */
    exportFootpathData(scale: number = 1): string {
        const data = {
            metadata: {
                mapSize: map.size,
                scale: scale,
                extractionTime: new Date().toISOString(),
                totalFootpaths: 0
            },
            footpathLocations: this.generateFootpathLocations(scale),
            detailedFootpathLocations: this.generateDetailedFootpathLocations(scale),
            analysis: this.analyzeFootpathPatterns()
        };

        data.metadata.totalFootpaths = data.footpathLocations.length;

        return JSON.stringify(data, null, 2);
    }
}

// Global instance
export const footpathExtractor = new FootpathExtractor();

// Console commands for easy access
if (typeof console !== 'undefined') {
    (console as any).footpath = {
        // Basic extraction
        extract: () => footpathExtractor.extractAllFootpaths(),
        extractArea: (x1: number, y1: number, x2: number, y2: number) => 
            footpathExtractor.extractFootpathsInArea(x1, y1, x2, y2),
        
        // Filter by object types
        bySurfaceObject: (surfaceObjectType: number) => 
            footpathExtractor.extractFootpathsBySurfaceObject(surfaceObjectType),
        byLegacyObject: (objectType: number) => 
            footpathExtractor.extractFootpathsByLegacyObject(objectType),
        byRailingsObject: (railingsObjectType: number) => 
            footpathExtractor.extractFootpathsByRailingsObject(railingsObjectType),
        bySurfaceObjectName: (surfaceObjectName: string) => 
            footpathExtractor.extractFootpathsBySurfaceObjectName(surfaceObjectName),
        bySurfaceObjectIdentifier: (identifier: string) => 
            footpathExtractor.extractFootpathsBySurfaceObjectIdentifier(identifier),
        listObjects: () => footpathExtractor.listFootpathSurfaceObjects(),
        inspectTiles: (x1: number, y1: number, x2: number, y2: number) => 
            footpathExtractor.inspectTilesForFootpaths(x1, y1, x2, y2),
        
        // Generate locations
        locations: (scale: number = 1) => footpathExtractor.generateFootpathLocations(scale),
        detailedLocations: (scale: number = 1) => footpathExtractor.generateDetailedFootpathLocations(scale),
        areaLocations: (x1: number, y1: number, x2: number, y2: number, scale: number = 1) => 
            footpathExtractor.generateFootpathLocationsInArea(x1, y1, x2, y2, scale),
        locationsBySurfaceObject: (surfaceObjectType: number, scale: number = 1) => 
            footpathExtractor.generateFootpathLocationsBySurfaceObject(surfaceObjectType, scale),
        locationsBySurfaceObjectName: (surfaceObjectName: string, scale: number = 1) => 
            footpathExtractor.generateFootpathLocationsBySurfaceObjectName(surfaceObjectName, scale),
        locationsBySurfaceObjectIdentifier: (identifier: string, scale: number = 1) => 
            footpathExtractor.generateFootpathLocationsBySurfaceObjectIdentifier(identifier, scale),
        
        // Analysis
        analyze: () => footpathExtractor.analyzeFootpathPatterns(),
        export: (scale: number = 1) => footpathExtractor.exportFootpathData(scale),
        
        // Quick examples
        example: () => {
            console.log("Example usage:");
            console.log("console.footpath.locations(2)  // Get footpath locations with scale 2");
            console.log("console.footpath.bySurfaceObject(8)  // Get footpaths with surface object 8 (Tarmac)");
            console.log("console.footpath.bySurfaceObjectName('Tarmac')  // Get footpaths with 'Tarmac' in name");
            console.log("console.footpath.bySurfaceObjectIdentifier('rct2.footpath_surface.tarmac')  // Get Tarmac footpaths by identifier");
            console.log("console.footpath.locationsBySurfaceObjectIdentifier('rct2.footpath_surface.tarmac', 1)  // Get Tarmac locations");
            console.log("console.footpath.analyze()     // Analyze footpath patterns");
            console.log("console.footpath.export(1)     // Export all data as JSON");
        }
    };
}
