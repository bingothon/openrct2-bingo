import { subscriptions } from "../manager";
import { GroundDivisionManager } from "../../managers/GroundDivisionManager";
import { PlayerManager } from "../../managers/PlayerManager";
import { GameManager } from "../../managers/GameManager";

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
            console.log(`[BuildingRestrictions] Action ${e.action} from player ${e.player}`);
            
            // Check if game is initializing - if so, allow all building actions
            const gameManager = GameManager.getInstance();
            if (gameManager.isGameInitializing()) {
                console.log(`[BuildingRestrictions] Allowing action ${e.action} during initialization`);
                return; // Allow all actions during initialization
            }
            
            // Only intercept building actions
            const isBuildingAction = e.action === "smallsceneryplace" ||
                                   e.action === "largesceneryplace" ||
                                   e.action === "wallplace" ||
                                   e.action === "trackplace" ||
                                   e.action === "footpathplace" ||
                                   e.action === "footpathadditionplace" ||
                                   e.action === "bannerplace" ||
                                   e.action === "ridecreate" ||
                                   e.action === "ridedemolish" ||
                                   e.action === "ridesetname" ||
                                   e.action === "trackdesign";
            
            if (!isBuildingAction) {
                return;
            }

            // Get coordinates from the action arguments
            const args = e.args as BuildingActionArgs;
            if (!args || typeof args.x !== 'number' || typeof args.y !== 'number') {
                console.log(`[BuildingRestrictions] Invalid args:`, args);
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
            
            console.log(`[BuildingRestrictions] Player ${playerId} trying to build at (${tileX},${tileY}) in region ${region}, player's region: ${playerRegion}`);
            
            // If no players are registered, block all building
            const allPlayers = playerManager.getAllPlayers();
            if (allPlayers.length === 0) {
                console.log(`[BuildingRestrictions] No players registered, blocking building`);
                e.result = {
                    error: 1, // Generic error
                    errorTitle: "Building Restricted",
                    errorMessage: `No players registered. Please register first using /register COLOR command.`,
                    position: { x: args.x, y: args.y, z: (args.z && typeof args.z === 'number') ? args.z : 0 }
                };
                return;
            }
            
            // Check if player is trying to build in their assigned region
            if (playerRegion !== region) {
                console.log(`[BuildingRestrictions] Player ${playerId} (region: ${playerRegion}) trying to build in ${region} - BLOCKED`);
                
                // Get player's color for the error message
                const player = playerManager.getPlayer(playerId.toString());
                const playerColor = player ? player.colour : "unknown";
                
                // Player is trying to build in another player's region - deny the action
                e.result = {
                    error: 1, // Generic error
                    errorTitle: "Building Restricted",
                    errorMessage: `You can only build in your ${playerColor} region. This tile belongs to another player's region.`,
                    position: { x: args.x, y: args.y, z: (args.z && typeof args.z === 'number') ? args.z : 0 }
                };
                return;
            }
            
            console.log(`[BuildingRestrictions] Player ${playerId} building in their own region ${region} - ALLOWED`);

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
