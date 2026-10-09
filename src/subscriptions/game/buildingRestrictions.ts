import { subscriptions } from "../manager";
import { GroundDivisionManager } from "../../managers/GroundDivisionManager";
import { PlayerManager } from "../../managers/PlayerManager";
import { GameManager } from "../../managers/GameManager";
import { getRideRegion } from "../../bingo/goalScopes";
import { colourLabel, getStaffOwner } from "../../bingo/playerColours";
import { getBannerRegion } from "../../bingo/bannerRegions";
import { formatMoney, getBudget } from "../../bingo/budgets";

// Actions that should be restricted by player regions
// Any action with coordinates will be checked against player region ownership

// Actions that change a ride by id (no coordinates): only allowed on rides in your own region
const RIDE_ACTIONS = [
    "ridesetstatus", // open / close / test
    "ridedemolish",
    "ridesetname",
    "ridesetprice",
    "ridesetsetting",
    "ridesetvehicle",
    "ridesetappearance",
    "ridefreezerating",
];

// Actions that change the whole park (shared by all players): only the server may do these
const PARK_ACTIONS = [
    "parksetparameter", // open / close the park
    "parksetentrancefee",
    "parksetloan",
    "parksetresearchfunding",
    "parksetname",
    "parksetdate",
    "staffsetcolour", // uniform colour of all staff of a type
    "pausetoggle", // pauses the game for everyone
    "gamesetspeed",
];

// Banners/signs changed by banner index: only in your own region (see bannerRegions.ts)
const BANNER_ACTIONS = ["bannersetname", "bannersetstyle", "signsetname", "signsetstyle"];

// Actions on a staff member: only the player that hired them (see getStaffOwner)
const STAFF_ACTIONS = ["stafffire", "staffsetorders", "staffsetpatrolarea", "staffsetcostume", "staffsetname"];

// Actions on a guest: only on guests in your own region
const GUEST_ACTIONS = ["guestsetname", "guestsetflags"];

// parkmarketing types that target a single ride (args.item is the ride id); the rest are park-wide
const RIDE_CAMPAIGN_TYPES = [1, 5]; // free rides, ride advertising

const PEEP_PICKUP_PLACE = 2; // PeepPickupType: 0 pick up, 1 cancel, 2 place

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
            
            // Get the player who is trying to perform the action
            const playerId = e.player;

            // Server actions are always allowed, inside and outside the regions (scoreboard,
            // guest spawns, ...). Actions the server executes itself are attributed to the host
            // (player 0), or -1 outside multiplayer. Don't check network.mode here: this hook
            // runs on the server for every player's action, so that would exempt everyone.
            if (playerId === 0 || playerId === -1) {
                return;
            }

            if (PARK_ACTIONS.indexOf(e.action) !== -1) {
                console.log(`[BuildingRestrictions] BLOCKED: Player ${playerId} tried ${e.action} (park-wide)`);
                e.result = {
                    error: 1,
                    errorTitle: "Action Restricted",
                    errorMessage: "The park is shared by all players - park-wide settings can't be changed in PvP/Lockout."
                };
                return;
            }

            // Budgets: the park's cash is shared, so each player can only spend their own share
            // (spending is tracked on the server, so the server decides)
            const cost = e.result ? e.result.cost : undefined;
            const buyer = playerManager.getPlayer(playerId.toString());
            if (network.mode !== "client" && buyer && typeof cost === "number" && cost > 0) {
                const budget = getBudget(buyer.colour);
                if (cost > budget.left) {
                    console.log(`[BuildingRestrictions] BLOCKED: Player ${playerId} can't afford ${e.action} (${cost} > ${budget.left})`);
                    e.result = {
                        error: 1,
                        errorTitle: "Not enough budget",
                        errorMessage: `This costs ${formatMoney(cost)}, you have ${formatMoney(budget.left)} left. Type /budget for details.`
                    };
                    return;
                }
            }

            if (RIDE_ACTIONS.indexOf(e.action) !== -1) {
                const rideArgs = e.args as { ride?: number };
                const ride = typeof rideArgs.ride === "number" ? map.getRide(rideArgs.ride) : null;
                const rideRegion = ride ? getRideRegion(ride, groundDivisionManager) : null;
                // Rides without a station yet can't be attributed (and aren't anyone's)
                if (rideRegion && rideRegion !== playerManager.getPlayerRegion(playerId)) {
                    console.log(`[BuildingRestrictions] BLOCKED: Player ${playerId} tried ${e.action} on ride ${rideArgs.ride} in ${rideRegion}`);
                    e.result = {
                        error: 1,
                        errorTitle: "Action Restricted",
                        errorMessage: "This ride belongs to another player's region."
                    };
                }
                return;
            }

            const deny = (message: string) => {
                console.log(`[BuildingRestrictions] BLOCKED: Player ${playerId} tried ${e.action}: ${message}`);
                e.result = { error: 1, errorTitle: "Action Restricted", errorMessage: message };
            };
            const player = playerManager.getPlayer(playerId.toString());
            const playerRegion = player ? player.region : null;
            const tileRegion = (x: number, y: number) =>
                groundDivisionManager.getRegionForTile({ x: Math.floor(x / 32), y: Math.floor(y / 32) });
            // Staff hired by someone else can't be managed
            const checkStaffOwner = (staff: Entity | null): boolean => {
                const owner = staff && staff.type === "staff" ? getStaffOwner((staff as Staff).name) : null;
                if (owner && (!player || player.colour !== owner)) {
                    deny(`This staff member was hired by ${colourLabel(owner)}.`);
                    return false;
                }
                return true;
            };

            if (STAFF_ACTIONS.indexOf(e.action) !== -1) {
                const staffArgs = e.args as { id?: number; name?: string; mode?: number; x1?: number; y1?: number; x2?: number; y2?: number };
                const staff = typeof staffArgs.id === "number" ? map.getEntity(staffArgs.id) : null;
                if (!checkStaffOwner(staff)) return;

                const owner = staff && staff.type === "staff" ? getStaffOwner((staff as Staff).name) : null;
                if (e.action === "staffsetname" && owner && (staffArgs.name || "").indexOf(`${colourLabel(owner)} `) !== 0) {
                    deny(`Staff names must start with "${colourLabel(owner)} " so everyone can see who hired them.`);
                    return;
                }
                const isAreaChange = staffArgs.mode === 0 || staffArgs.mode === 1; // set / unset
                if (e.action === "staffsetpatrolarea" && isAreaChange && typeof staffArgs.x1 === "number") {
                    if (tileRegion(staffArgs.x1, staffArgs.y1!) !== playerRegion || tileRegion(staffArgs.x2!, staffArgs.y2!) !== playerRegion) {
                        deny("You can only set patrol areas in your own region.");
                    }
                }
                return;
            }

            if (GUEST_ACTIONS.indexOf(e.action) !== -1) {
                const guestArgs = e.args as { peep?: number };
                const guest = typeof guestArgs.peep === "number" ? map.getEntity(guestArgs.peep) : null;
                const guestRegion = guest ? tileRegion(guest.x, guest.y) : null;
                if (guestRegion && guestRegion !== playerRegion) {
                    deny("This guest is in another player's region.");
                }
                return;
            }

            if (e.action === "peeppickup") {
                const pickupArgs = e.args as { type?: number; id?: number; x?: number; y?: number };
                const peep = typeof pickupArgs.id === "number" ? map.getEntity(pickupArgs.id) : null;
                if (!checkStaffOwner(peep)) return;

                if (pickupArgs.type === PEEP_PICKUP_PLACE) {
                    // Drop spot must be in your own region
                    if (typeof pickupArgs.x !== "number" || tileRegion(pickupArgs.x, pickupArgs.y!) !== playerRegion) {
                        deny("You can only place people in your own region.");
                    }
                } else if (peep && peep.type === "guest") {
                    // No lifting guests out of someone else's region
                    const guestRegion = tileRegion(peep.x, peep.y);
                    if (guestRegion && guestRegion !== playerRegion) {
                        deny("This guest is in another player's region.");
                    }
                }
                return;
            }

            if (BANNER_ACTIONS.indexOf(e.action) !== -1) {
                const bannerArgs = e.args as { id?: number };
                const bannerRegion = typeof bannerArgs.id === "number" ? getBannerRegion(bannerArgs.id) : null;
                if (bannerRegion && bannerRegion !== playerRegion) {
                    deny("This sign is in another player's region.");
                }
                return;
            }

            if (e.action === "parkmarketing") {
                const marketingArgs = e.args as { type?: number; item?: number };
                if (RIDE_CAMPAIGN_TYPES.indexOf(marketingArgs.type!) === -1) {
                    deny("Park-wide campaigns affect all players - only campaigns for your own rides are allowed.");
                    return;
                }
                const ride = typeof marketingArgs.item === "number" ? map.getRide(marketingArgs.item) : null;
                const rideRegion = ride ? getRideRegion(ride, groundDivisionManager) : null;
                if (rideRegion && rideRegion !== playerRegion) {
                    deny("You can only advertise rides in your own region.");
                }
                return;
            }

            // Area actions (terraforming, water, clearing scenery, land rights): every tile of the
            // selected area must be in the player's own region - not just the clicked tile
            const area = e.args as { x1?: number; y1?: number; x2?: number; y2?: number };
            if (typeof area.x1 === "number" && typeof area.y1 === "number" && typeof area.x2 === "number" && typeof area.y2 === "number") {
                if (!playerRegion) {
                    deny("Pick your region first.");
                    return;
                }
                const minX = Math.floor(Math.min(area.x1, area.x2) / 32);
                const maxX = Math.floor(Math.max(area.x1, area.x2) / 32);
                const minY = Math.floor(Math.min(area.y1, area.y2) / 32);
                const maxY = Math.floor(Math.max(area.y1, area.y2) / 32);
                for (let x = minX; x <= maxX; x++) {
                    for (let y = minY; y <= maxY; y++) {
                        if (groundDivisionManager.getRegionForTile({ x, y }) !== playerRegion) {
                            deny("You can only change your own region - the selected area reaches outside it.");
                            return;
                        }
                    }
                }
            }

            // Check if action has coordinates - if not, allow it to proceed
            const args = e.args as ActionArgs;
            if (!args || typeof args.x !== 'number' || typeof args.y !== 'number') {
                return; // Action doesn't have coordinates, allow it
            }

            // Convert world coordinates to tile coordinates
            const tileX = Math.floor(args.x / 32);
            const tileY = Math.floor(args.y / 32);
            
            // Check if tile is in a player region
            const region = groundDivisionManager.getRegionForTile({ x: tileX, y: tileY });
            if (!region) {
                // Player action outside divided area - block it
                console.log(`[BuildingRestrictions] BLOCKED: Action ${e.action} at (${tileX}, ${tileY}) is outside the divided area`);
                e.result = {
                    error: 1, // Generic error
                    errorTitle: "Action Restricted",
                    errorMessage: `Actions are only allowed within the divided player regions (1-128 x 1-128). This location is outside the play area.`
                };
                return;
            }

            // If no players are registered, block all building
            const allPlayers = playerManager.getAllPlayers();
            if (allPlayers.length === 0) {
                console.log(`[BuildingRestrictions] BLOCKED: No players registered`);
                e.result = {
                    error: 1, // Generic error
                    errorTitle: "Building Restricted",
                    errorMessage: `No players registered. Pick your region in the "Pick your region" window first (or type /register COLOR).`
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

/**
 * While a game is being set up the region restrictions are off (the server builds everywhere),
 * so players' own actions are refused until setup has finished.
 */
export function subscribeToSetupLock() {
    subscriptions.upsert("setupLock", () =>
        context.subscribe("action.query", (e) => {
            if (e.player === 0 || e.player === -1 || e.action === "registerPlayer") return;
            if (!GameManager.getInstance().isGameInitializing()) return;

            e.result = {
                error: 1,
                errorTitle: "Please wait",
                errorMessage: "The game is being set up - you can play in a moment.",
            };
        })
    );
}
