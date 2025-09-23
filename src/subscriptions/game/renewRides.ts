import { renewRides } from "src/util";
import { subscriptions } from "../manager";

export function subscribeToRenewRides() {
    let dayCounter = 0;
    subscriptions.upsert("renewRides", () =>
        context.subscribe("interval.day", () => {
            dayCounter++;
            if (dayCounter % 100 === 0) {
                renewRides();
                dayCounter = 0;
            }
        })
    );
}

export function unsubscribeFromRenewRides() {
    subscriptions.dispose("renewRides");
}
