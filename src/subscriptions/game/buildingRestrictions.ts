import { subscriptions } from "../manager";
import { GroundDivisionManager } from "../../managers/GroundDivisionManager";
import { PlayerManager } from "../../managers/PlayerManager";

// Building actions that should be restricted by player regions
// (checked individually in the subscription function)

// Interface for building action arguments that have x, y coordinates
interface BuildingActionArgs {
    x: number;
    y: number;
    z?: number;
}

export function subscribeToBuildingRestrictions(
    groundDivisionManager: GroundDivisionManager,
    playerManager: PlayerManager
) {
    subscriptions.upsert("buildingRestrictions", () =>
        context.subscribe("action.query", (e) => {
            // Only intercept building actions
            const isBuildingAction = e.action === "smallsceneryplace" ||
                                   e.action === "largesceneryplace" ||
                                   e.action === "wallplace" ||
                                   e.action === "trackplace" ||
                                   e.action === "footpathplace" ||
                                   e.action === "footpathadditionplace" ||
                                   e.action === "bannerplace";
            
            if (!isBuildingAction) {
                return;
            }

            // Get coordinates from the action arguments
            const args = e.args as BuildingActionArgs;
            if (!args.x || !args.y) {
                return;
            }

            // Convert world coordinates to tile coordinates
            const tileX = Math.floor(args.x / 32);
            const tileY = Math.floor(args.y / 32);
            
            // Check if tile is in a player region
            const region = groundDivisionManager.getRegionForTile({ x: tileX, y: tileY });
            if (!region) {
                // Tile is outside divided area or in neutral area - allow building
                return;
            }

            // Get the player who is trying to build
            const playerId = e.player;
            const playerRegion = playerManager.getPlayerRegion(playerId);
            
            // Check if player is trying to build in their assigned region
            if (playerRegion !== region) {
                // Player is trying to build in another player's region - deny the action
                e.result = {
                    error: 1, // Generic error
                    errorTitle: "Building Restricted",
                    errorMessage: `You can only build in your assigned region (${region}). This tile belongs to ${region}.`,
                    position: { x: args.x, y: args.y, z: args.z || 0 }
                };
                return;
            }

            // Player is building in their own region - allow the action
        })
    );
}

export function unsubscribeFromBuildingRestrictions() {
    // Remove the subscription by setting it to an empty function
    subscriptions.upsert("buildingRestrictions", () => {
        return { dispose: () => {} };
    });
}
