import type { GroundDivisionManager, PlayerRegionKey } from "../managers/GroundDivisionManager";
import { debugMode } from "../utils";

/*
 * Puts a region back the way it was when its colour was picked (leavingPlayers.ts). Nobody can
 * build in a region before it's picked, so a snapshot taken then is the region's original state:
 * the land (height, slope, water, terrain, ownership), the starting footpaths and scenery.
 *
 * Restoring removes everything that wasn't there (paths, scenery, walls, banners - rides are
 * demolished before), then puts back the land and the missing original paths and scenery. Other
 * elements, like the park entrance, are never touched. Sandbox mode is on while it runs (building
 * outside the park, ownership), and whatever the actions cost or refund is evened out, so the
 * park's money doesn't change.
 */

interface SurfaceState {
    x: number;
    y: number;
    height: number;
    slope: number;
    water: number;
    surfaceStyle: number;
    edgeStyle: number;
    ownership: number;
}

interface PathState {
    x: number;
    y: number;
    z: number;
    surfaceObject: number;
    railingsObject: number;
    slopeDirection: number | null;
}

interface SceneryState {
    x: number;
    y: number;
    z: number;
    object: number;
    quadrant: number;
    direction: number;
    primaryColour: number;
    secondaryColour: number;
    tertiaryColour: number;
}

export interface RegionSnapshot {
    surfaces: SurfaceState[];
    paths: PathState[];
    scenery: SceneryState[];
}

export interface PlannedAction {
    name: string;
    args: { [key: string]: unknown };
}

const snapshots: { [region: string]: RegionSnapshot } = {};

/** The region's buildable tiles (not the dividing lines or corner markers) */
function forEachRegionTile(ground: GroundDivisionManager, region: PlayerRegionKey, callback: (x: number, y: number) => void): void {
    const rect = ground.getRegion(region);
    for (let x = rect.x1; x <= rect.x2; x++) {
        for (let y = rect.y1; y <= rect.y2; y++) {
            if (ground.getRegionForTile({ x, y }) === region) callback(x, y);
        }
    }
}

const pathKey = (x: number, y: number, z: number) => `${x}:${y}:${z}`;
const sceneryKey = (x: number, y: number, z: number, object: number, quadrant: number) => `${x}:${y}:${z}:${object}:${quadrant}`;

export function takeRegionSnapshot(ground: GroundDivisionManager, region: PlayerRegionKey): RegionSnapshot {
    const snapshot: RegionSnapshot = { surfaces: [], paths: [], scenery: [] };
    forEachRegionTile(ground, region, (x, y) => {
        map.getTile(x, y).elements.forEach((element) => {
            if (element.type === "surface") {
                const surface = element as SurfaceElement;
                snapshot.surfaces.push({
                    x,
                    y,
                    height: surface.baseHeight,
                    slope: surface.slope,
                    water: surface.waterHeight,
                    surfaceStyle: surface.surfaceStyle,
                    edgeStyle: surface.edgeStyle,
                    ownership: surface.ownership,
                });
            } else if (element.type === "footpath") {
                const path = element as FootpathElement;
                snapshot.paths.push({
                    x,
                    y,
                    z: path.baseZ,
                    surfaceObject: path.surfaceObject || 0,
                    railingsObject: path.railingsObject || 0,
                    slopeDirection: path.slopeDirection,
                });
            } else if (element.type === "small_scenery") {
                const scenery = element as SmallSceneryElement;
                snapshot.scenery.push({
                    x,
                    y,
                    z: scenery.baseZ,
                    object: scenery.object,
                    quadrant: scenery.quadrant,
                    direction: scenery.direction,
                    primaryColour: scenery.primaryColour,
                    secondaryColour: scenery.secondaryColour,
                    tertiaryColour: scenery.tertiaryColour,
                });
            }
        });
    });
    return snapshot;
}

/** Server: remember the region's original state, once per game (when its colour is first picked) */
export function rememberRegion(ground: GroundDivisionManager, region: PlayerRegionKey): void {
    if (snapshots[region]) return;
    snapshots[region] = takeRegionSnapshot(ground, region);
    console.log(`[RegionRestore] Snapshot of ${region}: ${snapshots[region].surfaces.length} tiles, ${snapshots[region].paths.length} paths`);
}

export function forgetRegions(): void {
    for (const region in snapshots) delete snapshots[region];
}

/**
 * The actions that turn the region's current state back into the snapshot, in the order they
 * have to run: removals, land, ownership, placements
 */
export function planRegionRestore(ground: GroundDivisionManager, region: PlayerRegionKey, snapshot: RegionSnapshot): PlannedAction[][] {
    const originalPaths: { [key: string]: boolean } = {};
    snapshot.paths.forEach((path) => (originalPaths[pathKey(path.x, path.y, path.z)] = true));
    const originalScenery: { [key: string]: boolean } = {};
    snapshot.scenery.forEach((s) => (originalScenery[sceneryKey(s.x, s.y, s.z, s.object, s.quadrant)] = true));

    const removals: PlannedAction[] = [];
    const keptPaths: { [key: string]: boolean } = {};
    const keptScenery: { [key: string]: boolean } = {};
    const current: { [tile: string]: SurfaceElement } = {};

    forEachRegionTile(ground, region, (x, y) => {
        const at = { x: x * 32, y: y * 32 };
        map.getTile(x, y).elements.forEach((element) => {
            switch (element.type) {
                case "surface":
                    current[`${x}:${y}`] = element as SurfaceElement;
                    break;
                case "footpath": {
                    const key = pathKey(x, y, element.baseZ);
                    if (originalPaths[key]) keptPaths[key] = true;
                    else removals.push({ name: "footpathremove", args: { ...at, z: element.baseZ } });
                    break;
                }
                case "small_scenery": {
                    const scenery = element as SmallSceneryElement;
                    const key = sceneryKey(x, y, scenery.baseZ, scenery.object, scenery.quadrant);
                    if (originalScenery[key]) keptScenery[key] = true;
                    else removals.push({ name: "smallsceneryremove", args: { ...at, z: scenery.baseZ, object: scenery.object, quadrant: scenery.quadrant } });
                    break;
                }
                case "large_scenery": {
                    const scenery = element as LargeSceneryElement;
                    removals.push({ name: "largesceneryremove", args: { ...at, z: scenery.baseZ, direction: scenery.direction, tileIndex: scenery.sequence } });
                    break;
                }
                case "wall":
                    removals.push({ name: "wallremove", args: { ...at, z: element.baseZ, direction: (element as WallElement).direction } });
                    break;
                case "banner":
                    removals.push({ name: "bannerremove", args: { ...at, z: element.baseZ, direction: (element as BannerElement).direction } });
                    break;
                // Track and ride entrances go with their ride; the park entrance stays
            }
        });
    });

    const land: PlannedAction[] = [];
    const ownership: PlannedAction[] = [];
    snapshot.surfaces.forEach((original) => {
        const surface = current[`${original.x}:${original.y}`];
        if (!surface) return;
        const at = { x: original.x * 32, y: original.y * 32 };
        if (surface.baseHeight !== original.height || surface.slope !== original.slope) {
            land.push({ name: "landsetheight", args: { ...at, height: original.height, style: original.slope } });
        }
        if (surface.waterHeight !== original.water) {
            // The action takes land heights (the tile reports water x 8); water at or below the
            // land is removed
            const height = original.water > 0 ? original.water / 8 : original.height;
            land.push({ name: "watersetheight", args: { ...at, height } });
        }
        if (surface.surfaceStyle !== original.surfaceStyle || surface.edgeStyle !== original.edgeStyle) {
            land.push({
                name: "surfacesetstyle",
                // The colours (OpenRCT2 0.5.6+) only matter for terrain that can be coloured
                args: { x1: at.x, y1: at.y, x2: at.x, y2: at.y, surfaceStyle: original.surfaceStyle, edgeStyle: original.edgeStyle, surfaceColour1: 0, edgeColour1: 0 },
            });
        }
        if (surface.ownership !== original.ownership) {
            ownership.push({ name: "landsetrights", args: { x1: at.x, y1: at.y, x2: at.x, y2: at.y, setting: 4, ownership: original.ownership } });
        }
    });

    const placements: PlannedAction[] = [];
    snapshot.paths.forEach((path) => {
        if (keptPaths[pathKey(path.x, path.y, path.z)]) return;
        placements.push({
            name: "footpathplace",
            args: {
                x: path.x * 32,
                y: path.y * 32,
                z: path.z,
                direction: 0xff,
                object: path.surfaceObject,
                railingsObject: path.railingsObject,
                slopeType: path.slopeDirection === null ? 0 : 1,
                slopeDirection: path.slopeDirection === null ? 0 : path.slopeDirection,
                constructFlags: 0,
            },
        });
    });
    snapshot.scenery.forEach((s) => {
        if (keptScenery[sceneryKey(s.x, s.y, s.z, s.object, s.quadrant)]) return;
        placements.push({
            name: "smallsceneryplace",
            args: {
                x: s.x * 32,
                y: s.y * 32,
                z: s.z,
                direction: s.direction,
                object: s.object,
                quadrant: s.quadrant,
                primaryColour: s.primaryColour,
                secondaryColour: s.secondaryColour,
                tertiaryColour: s.tertiaryColour,
            },
        });
    });

    return [removals, land, ownership, placements];
}

/**
 * Runs actions and reports what they cost in total (negative: refunded) and how many failed,
 * once every callback has fired
 */
function runAll(actions: PlannedAction[], onDone: (cost: number, failures: number, firstError?: string) => void): void {
    if (actions.length === 0) {
        onDone(0, 0);
        return;
    }
    let remaining = actions.length;
    let cost = 0;
    let failures = 0;
    let firstError: string | undefined;
    actions.forEach((action) => {
        context.executeAction(action.name as ActionType, action.args, (result) => {
            if (result.error) {
                failures++;
                if (!firstError) firstError = `${action.name}: ${result.errorMessage}`;
            } else {
                cost += result.cost || 0;
            }
            if (--remaining === 0) onDone(cost, failures, firstError);
        });
    });
}

/** Server: restore the region from its snapshot; onDone gets false when there was no snapshot */
export function restoreRegion(ground: GroundDivisionManager, region: PlayerRegionKey, onDone: (restored: boolean) => void): void {
    const snapshot = snapshots[region];
    if (!snapshot) {
        console.log(`[RegionRestore] No snapshot of ${region} - can't restore it`);
        onDone(false);
        return;
    }

    const steps = planRegionRestore(ground, region, snapshot);
    const names = ["removals", "land", "ownership", "placements"];
    let totalCost = 0;

    const runStep = (index: number) => {
        if (index >= steps.length) {
            // Even out what it all cost or refunded
            const finish = () => debugMode(0, () => onDone(true));
            if (totalCost !== 0) context.executeAction("addCash", { args: { cash: totalCost } }, finish);
            else finish();
            return;
        }
        runAll(steps[index], (cost, failures, firstError) => {
            totalCost += cost;
            console.log(`[RegionRestore] ${region} ${names[index]}: ${steps[index].length - failures}/${steps[index].length}${failures ? `, first error: ${firstError}` : ""}`);
            runStep(index + 1);
        });
    };
    debugMode(1, () => runStep(0));
}
