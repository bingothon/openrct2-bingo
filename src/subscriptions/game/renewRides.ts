import { renewRides } from "src/utils";
import { config } from "../../config";
import { subscriptions } from "../manager";

export function subscribeToRenewRides() {
    let dayCounter = 0;
    subscriptions.upsert("renewRides", () =>
        context.subscribe("interval.day", () => {
            dayCounter++;
            if (dayCounter >= config.renewRidesIntervalDays) {
                renewRides();
                dayCounter = 0;
            }
        })
    );
}

export function unsubscribeFromRenewRides() {
    subscriptions.dispose("renewRides");
}
