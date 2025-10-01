import { subscriptions } from "../manager";
import { GroundDivisionManager } from "../../managers/GroundDivisionManager";
import { PlayerManager } from "../../managers/PlayerManager";
import { GameManager } from "../../managers/GameManager";

// Actions that should be restricted by player regions
// Any action with coordinates will be checked against player region ownership

// Interface for action arguments that have x, y coordinates
interface ActionArgs {
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
            
            // Check if game is initializing - if so, allow all building actions
            const gameManager = GameManager.getInstance();
            if (gameManager.isGameInitializing()) {
                return; // Allow all actions during initialization
            }
            
            // Check if action has coordinates - if not, allow it to proceed
            const args = e.args as ActionArgs;
            if (!args || typeof args.x !== 'number' || typeof args.y !== 'number') {
                return; // Action doesn't have coordinates, allow it
            }

            // Convert world coordinates to tile coordinates
            const tileX = Math.floor(args.x / 32);
            const tileY = Math.floor(args.y / 32);
            
            // Get the player who is trying to perform the action
            const playerId = e.player;
            
            // Check if tile is in a player region
            const region = groundDivisionManager.getRegionForTile({ x: tileX, y: tileY });
            if (!region) {
                // Check if this is a server action (player: -1) - allow server actions outside regions
                if (playerId === -1) {
                    // Server action - allow it to proceed (for scoreboard, etc.)
                    return;
                }
                
                // Player action outside divided area - block it
                console.log(`[BuildingRestrictions] BLOCKED: Action ${e.action} at (${tileX}, ${tileY}) is outside the divided area`);
                e.result = {
                    error: 1, // Generic error
                    errorTitle: "Action Restricted",
                    errorMessage: `Actions are only allowed within the divided player regions (1-128 x 1-128). This location is outside the play area.`
                };
                return;
            }

            // Get the player's assigned region
            const playerRegion = playerManager.getPlayerRegion(playerId);
            
            // If no players are registered, block all building
            const allPlayers = playerManager.getAllPlayers();
            if (allPlayers.length === 0) {
                console.log(`[BuildingRestrictions] BLOCKED: No players registered`);
                e.result = {
                    error: 1, // Generic error
                    errorTitle: "Building Restricted",
                    errorMessage: `No players registered. Please register first using /register COLOR command.`
                };
                return;
            }
            
            // Check if player is trying to perform action in their assigned region
            if (playerRegion !== region) {
                console.log(`[BuildingRestrictions] BLOCKED: Player ${playerId} (${playerRegion}) trying to perform ${e.action} in ${region}`);
                
                // Get player's color for the error message
                const player = playerManager.getPlayer(playerId.toString());
                const playerColor = player ? player.colour : "unknown";
                
                // Generic error message for any action in another player's region
                const errorTitle = "Action Restricted";
                const errorMessage = `You can only perform actions in your ${playerColor} region. This tile belongs to another player's region.`;
                
                // Player is trying to perform action in another player's region - deny the action
                e.result = {
                    error: 1, // Generic error
                    errorTitle: errorTitle,
                    errorMessage: errorMessage
                };
                return;
            }
            
            // Player is performing action in their own region - allow the action
        })
    );
}

export function unsubscribeFromBuildingRestrictions() {
    // Remove the subscription by setting it to an empty function
    subscriptions.upsert("buildingRestrictions", () => {
        return { dispose: () => {} };
    });
}
