/// <reference path="../lib/openrct2.d.ts" />

import test from "ava";
import Mock from "openrct2-mocks";
import { GroundDivisionManager } from "../../src/managers/GroundDivisionManager";

test.before(() => {
    // Mock OpenRCT2 globals
    globalThis.context = Mock.context({
        getTypeIdForAction: () => 80,
    });
    
    globalThis.network = Mock.network({
        groups: [Mock.playerGroup({ permissions: ["ride_properties"] })]
    });
    
    globalThis.map = Mock.map({ entities: [] });
});

test("GroundDivisionManager initialization", t => {
    const groundManager = new GroundDivisionManager();
    
    t.truthy(groundManager, "GroundDivisionManager should be initialized");
    t.is(typeof groundManager.getState, "function", "Should have getState method");
    t.is(typeof groundManager.getRegionForTile, "function", "Should have getRegionForTile method");
    t.is(typeof groundManager.getRegion, "function", "Should have getRegion method");
});

test("GroundDivisionManager region retrieval", t => {
    const groundManager = new GroundDivisionManager();
    
    // Test getting all regions
    const regions = groundManager.getRegions();
    t.truthy(regions, "Should return regions object");
    t.true("top-left" in regions, "Should have top-left region");
    t.true("top-right" in regions, "Should have top-right region");
    t.true("bottom-left" in regions, "Should have bottom-left region");
    t.true("bottom-right" in regions, "Should have bottom-right region");
});

test("GroundDivisionManager tile to region mapping", t => {
    const groundManager = new GroundDivisionManager();
    
    // Test center tiles (should be in different regions)
    const topLeftRegion = groundManager.getRegionForTile({ x: 32, y: 32 });
    const topRightRegion = groundManager.getRegionForTile({ x: 96, y: 32 });
    const bottomLeftRegion = groundManager.getRegionForTile({ x: 32, y: 96 });
    const bottomRightRegion = groundManager.getRegionForTile({ x: 96, y: 96 });
    
    t.is(topLeftRegion, "top-left", "Center of top-left should be in top-left region");
    t.is(topRightRegion, "top-right", "Center of top-right should be in top-right region");
    t.is(bottomLeftRegion, "bottom-left", "Center of bottom-left should be in bottom-left region");
    t.is(bottomRightRegion, "bottom-right", "Center of bottom-right should be in bottom-right region");
});

test("GroundDivisionManager edge cases", t => {
    const groundManager = new GroundDivisionManager();
    
    // Test tiles outside the divided area
    const outsideRegion = groundManager.getRegionForTile({ x: 0, y: 0 });
    t.is(outsideRegion, null, "Tile outside divided area should return null");
    
    const farOutsideRegion = groundManager.getRegionForTile({ x: 200, y: 200 });
    t.is(farOutsideRegion, null, "Tile far outside divided area should return null");
});

test("GroundDivisionManager region properties", t => {
    const groundManager = new GroundDivisionManager();
    
    // Test individual region properties
    const topLeftRegion = groundManager.getRegion("top-left");
    t.truthy(topLeftRegion, "Should return top-left region");
    t.is(typeof topLeftRegion.x1, "number", "Region should have x1 property");
    t.is(typeof topLeftRegion.y1, "number", "Region should have y1 property");
    t.is(typeof topLeftRegion.x2, "number", "Region should have x2 property");
    t.is(typeof topLeftRegion.y2, "number", "Region should have y2 property");
    
    // Test that regions don't overlap
    const topRightRegion = groundManager.getRegion("top-right");
    t.true(topLeftRegion.x2 < topRightRegion.x1, "Top-left and top-right regions should not overlap");
});

test("GroundDivisionManager world to tile conversion", t => {
    const groundManager = new GroundDivisionManager();
    
    // Test world coordinate conversion
    const worldCoords = { x: 1000, y: 2000 };
    const tileCoords = groundManager.worldToTile(worldCoords);
    
    t.is(typeof tileCoords.x, "number", "Tile x should be a number");
    t.is(typeof tileCoords.y, "number", "Tile y should be a number");
    t.true(tileCoords.x >= 0, "Tile x should be non-negative");
    t.true(tileCoords.y >= 0, "Tile y should be non-negative");
});
