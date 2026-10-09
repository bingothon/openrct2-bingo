/*
 * Which region each banner/sign is in. Renaming or restyling them only passes a banner index,
 * so the region is recorded when they are placed (bannerplace, large scenery signs and wall
 * signs return the new bannerIndex). Banners that existed before belong to nobody.
 */

import type { GroundDivisionManager, PlayerRegionKey } from "../managers/GroundDivisionManager";
import { subscriptions } from "../subscriptions/manager";

const PLACE_ACTIONS = ["bannerplace", "largesceneryplace", "wallplace"];
const bannerRegions: { [bannerIndex: number]: PlayerRegionKey | null } = {};

export function getBannerRegion(bannerIndex: number): PlayerRegionKey | null {
    return bannerRegions[bannerIndex] || null;
}

export function subscribeToBannerRegions(ground: GroundDivisionManager): void {
    subscriptions.upsert("bannerRegions", () =>
        context.subscribe("action.execute", (e) => {
            if (PLACE_ACTIONS.indexOf(e.action) === -1 || e.result.error) return;

            const bannerIndex = (e.result as { bannerIndex?: number }).bannerIndex;
            const args = e.args as { x?: number; y?: number };
            if (typeof bannerIndex !== "number" || typeof args.x !== "number" || typeof args.y !== "number") return;

            bannerRegions[bannerIndex] = ground.getRegionForTile({ x: Math.floor(args.x / 32), y: Math.floor(args.y / 32) });
        })
    );
}
