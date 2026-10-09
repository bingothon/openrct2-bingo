import { subscriptions } from "../manager";

const RIDE_STATUS_OPEN = 1;
/** Preview placements while the player moves the mouse */
const GHOST_FLAG = 1 << 6;

/**
 * Stalls and facilities (toilets, info kiosks, ...) open as soon as they are placed instead of
 * starting closed. Only right after placing - a player can still close them afterwards.
 */
export function subscribeToAutoOpenStalls(): void {
    subscriptions.upsert("autoOpenStalls", () =>
        context.subscribe("action.execute", (e) => {
            if (e.action !== "trackplace" || e.result.error) return;

            const args = e.args as { ride?: number; flags?: number };
            if (typeof args.ride !== "number" || ((args.flags || 0) & GHOST_FLAG) !== 0) return;

            const ride = map.getRide(args.ride);
            if (!ride || (ride.classification !== "stall" && ride.classification !== "facility") || ride.status !== "closed") return;

            context.executeAction("ridesetstatus", { ride: args.ride, status: RIDE_STATUS_OPEN }, (result) => {
                if (result.error) {
                    console.log(`[AutoOpenStalls] Couldn't open ${ride.name}: ${result.errorMessage}`);
                }
            });
        })
    );
}
