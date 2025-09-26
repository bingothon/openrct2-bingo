/*
 * GroundDivisionManager
 *
 * Responsibilities:
 * - Compute per-player map regions (quarters) based on current map size
 * - Provide fast region membership checks for tiles/world coords
 * - Expose helpers to (un)own land for regions and dividing lines
 * - Offer a single source of truth for region geometry used by goal/placement rules
 */

export type TilePoint = { x: number; y: number };

export type RectRegion = {
    name: string;
    // Inclusive tile bounds in tile coordinates (1-based tiles expressed as integers)
    x1: number;
    y1: number;
    x2: number;
    y2: number;
};

export type PlayerRegionKey = "top-left" | "top-right" | "bottom-left" | "bottom-right";

// OpenRCT2 ownership constants (from SurfaceElement.h)
export const OWNERSHIP = {
    UNOWNED: 0,
    CONSTRUCTION_RIGHTS_OWNED: 1 << 4, // 16
    OWNED: 1 << 5, // 32
    CONSTRUCTION_RIGHTS_AVAILABLE: 1 << 6, // 64
    AVAILABLE: 1 << 7, // 128
} as const;

export interface GroundDivisionState {
    mapWidthTiles: number;
    mapHeightTiles: number;
    centerTileX: number;
    centerTileY: number;
    regions: Record<PlayerRegionKey, RectRegion>;
    // Areas that should remain neutral (not owned by any player)
    neutralAreas: RectRegion[];
}

export class GroundDivisionManager {
    private state: GroundDivisionState;

    constructor() {
        // Static division: always divide the original 130x130 map (128x128 with 1-based indexing)
        // This ignores any map extensions (like scoreboard area)
        const width = 128;
        const height = 128;
        const centerX = Math.floor(width / 2); // 64
        const centerY = Math.floor(height / 2); // 64

        this.state = {
            mapWidthTiles: width,
            mapHeightTiles: height,
            centerTileX: centerX,
            centerTileY: centerY,
            regions: this.computeQuarterRegions(width, height, centerX, centerY),
            neutralAreas: this.computeNeutralAreas(width, height, centerX, centerY),
        };
    }

    public getState(): GroundDivisionState {
        return this.state;
    }

    public getRegions(): Record<PlayerRegionKey, RectRegion> {
        return this.state.regions;
    }

    public getRegion(key: PlayerRegionKey): RectRegion {
        return this.state.regions[key];
    }

    public getRegionForTile(tile: TilePoint): PlayerRegionKey | null {
        // Check if tile is within the divided area (1-128 x 1-128)
        if (tile.x < 1 || tile.x > 128 || tile.y < 1 || tile.y > 128) {
            return null; // Outside divided area
        }

        // Check if tile is in a neutral area first (dividing lines, corner markers)
        const { neutralAreas } = this.state;
        for (const neutralArea of neutralAreas) {
            if (this.isTileInRegion(tile, neutralArea)) {
                return null; // Neutral area - not owned by any player
            }
        }

        const { regions } = this.state;
        for (const key in regions) {
            const r = regions[key as PlayerRegionKey];
            if (this.isTileInRegion(tile, r)) return key as PlayerRegionKey;
        }
        return null;
    }

    public isTileInRegion(tile: TilePoint, region: RectRegion): boolean {
        return (
            tile.x >= region.x1 &&
            tile.x <= region.x2 &&
            tile.y >= region.y1 &&
            tile.y <= region.y2
        );
    }

    // World coords to tile coords helper
    public worldToTile(world: { x: number; y: number }): TilePoint {
        return { x: Math.floor(world.x / 32), y: Math.floor(world.y / 32) };
    }

    // Check if a tile is within the divided area (1-128 x 1-128)
    public isTileInDividedArea(tile: TilePoint): boolean {
        return tile.x >= 1 && tile.x <= 128 && tile.y >= 1 && tile.y <= 128;
    }

    // Ownership utilities for regions and dividing lines
    public unownRegion(regionKey: PlayerRegionKey, callback?: () => void): void {
        const r = this.getRegion(regionKey);
        this.landSetRightsRect(r, 0, callback);
    }

    public ownRegion(regionKey: PlayerRegionKey, callback?: () => void): void {
        const r = this.getRegion(regionKey);
        this.landSetRightsRect(r, 1, callback);
    }

    // Set region ownership (park-wide, not player-specific)
    public setRegionOwnership(regionKey: PlayerRegionKey, ownership: number, callback?: () => void): void {
        const r = this.getRegion(regionKey);
        this.landSetRightsRectWithOwnership(r, ownership, callback);
    }

    // Unown all neutral areas (dividing lines and corner markers)
    public unownNeutralAreas(callback?: () => void): void {
        const { neutralAreas } = this.state;
        let completed = 0;
        const total = neutralAreas.length;

        if (total === 0) {
            callback?.();
            return;
        }

        neutralAreas.forEach((area) => {
            this.landSetRightsRect(area, 0, () => {
                completed++;
                if (completed === total) {
                    callback?.();
                }
            });
        });
    }

    public unownDividingLines(callback?: () => void): void {
        const { centerTileX, centerTileY, mapWidthTiles, mapHeightTiles } = this.state;
        let completed = 0;
        const total = 2;

        // Vertical line through center tiles
        context.executeAction(
            "landsetrights",
            {
                x1: centerTileX * 32,
                y1: 1 * 32,
                x2: centerTileX * 32,
                y2: mapHeightTiles * 32,
                setting: 0,
                ownership: 0,
            },
            () => {
                completed++;
                if (completed === total && callback) callback();
            }
        );

        // Horizontal line through center tiles
        context.executeAction(
            "landsetrights",
            {
                x1: 1 * 32,
                y1: centerTileY * 32,
                x2: mapWidthTiles * 32,
                y2: centerTileY * 32,
                setting: 0,
                ownership: 0,
            },
            () => {
                completed++;
                if (completed === total && callback) callback();
            }
        );
    }

    // Internal helpers
    private computeQuarterRegions(
        width: number,
        height: number,
        centerX: number,
        centerY: number
    ): Record<PlayerRegionKey, RectRegion> {
        // Use [1..center] and [center+1..max] to avoid overlap
        const leftX1 = 1;
        const leftX2 = centerX;
        const rightX1 = centerX + 1;
        const rightX2 = width;
        const topY1 = 1;
        const topY2 = centerY;
        const botY1 = centerY + 1;
        const botY2 = height;

        return {
            "top-left": { name: "top-left", x1: leftX1, y1: topY1, x2: leftX2, y2: topY2 },
            "top-right": { name: "top-right", x1: rightX1, y1: topY1, x2: rightX2, y2: topY2 },
            "bottom-left": { name: "bottom-left", x1: leftX1, y1: botY1, x2: leftX2, y2: botY2 },
            "bottom-right": { name: "bottom-right", x1: rightX1, y1: botY1, x2: rightX2, y2: botY2 },
        };
    }

    private computeNeutralAreas(width: number, height: number, centerX: number, centerY: number): RectRegion[] {
        const neutralAreas: RectRegion[] = [];
        
        // 1. Dividing lines (center X and Y lines)
        // Vertical dividing line (center X)
        neutralAreas.push({ name: "divider-x-1", x1: centerX, y1: 1, x2: centerX, y2: height });
        neutralAreas.push({ name: "divider-x-2", x1: centerX + 1, y1: 1, x2: centerX + 1, y2: height });
        
        // Horizontal dividing line (center Y)
        neutralAreas.push({ name: "divider-y-1", x1: 1, y1: centerY, x2: width, y2: centerY });
        neutralAreas.push({ name: "divider-y-2", x1: 1, y1: centerY + 1, x2: width, y2: centerY + 1 });
        
        // 2. Colored base block areas (3x3 squares at corners, 5 tiles from edge)
        const cornerOffset = 5;
        const markerSize = 3; // 3x3 squares
        
        // Top-left corner marker
        neutralAreas.push({ 
            name: "marker-tl",
            x1: cornerOffset, 
            y1: cornerOffset, 
            x2: cornerOffset + markerSize - 1, 
            y2: cornerOffset + markerSize - 1 
        });
        
        // Top-right corner marker
        neutralAreas.push({ 
            name: "marker-tr",
            x1: width - cornerOffset - markerSize + 1, 
            y1: cornerOffset, 
            x2: width - cornerOffset, 
            y2: cornerOffset + markerSize - 1 
        });
        
        // Bottom-left corner marker
        neutralAreas.push({ 
            name: "marker-bl",
            x1: cornerOffset, 
            y1: height - cornerOffset - markerSize + 1, 
            x2: cornerOffset + markerSize - 1, 
            y2: height - cornerOffset 
        });
        
        // Bottom-right corner marker
        neutralAreas.push({ 
            name: "marker-br",
            x1: width - cornerOffset - markerSize + 1, 
            y1: height - cornerOffset - markerSize + 1, 
            x2: width - cornerOffset, 
            y2: height - cornerOffset 
        });
        
        return neutralAreas;
    }

    private landSetRightsRect(region: RectRegion, own: 0 | 1, callback?: () => void): void {
        const x1 = region.x1 * 32;
        const y1 = region.y1 * 32;
        const x2 = region.x2 * 32;
        const y2 = region.y2 * 32;

        context.executeAction(
            "landsetrights",
            {
                x1,
                y1,
                x2,
                y2,
                setting: own, // 1 = own, 0 = unown
                ownership: own,
            },
            () => {
                if (callback) callback();
            }
        );
    }

    private landSetRightsRectWithOwnership(region: RectRegion, ownership: number, callback?: () => void): void {
        const x1 = region.x1 * 32;
        const y1 = region.y1 * 32;
        const x2 = region.x2 * 32;
        const y2 = region.y2 * 32;

        context.executeAction(
            "landsetrights",
            {
                x1,
                y1,
                x2,
                y2,
                setting: 4, // Set ownership with checks
                ownership: ownership,
            },
            () => {
                if (callback) callback();
            }
        );
    }
}


