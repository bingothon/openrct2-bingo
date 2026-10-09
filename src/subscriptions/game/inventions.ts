import { config } from "../../config";
import { subscriptions } from "../manager";

/** OpenRCT2 advances research every 32 ticks */
const RESEARCH_UPDATE_TICKS = 32;

function countInvented(): number {
    return park.research.inventedItems.length;
}

/**
 * Speeds up research: one new invention every config.inventionIntervalDays. An invention takes
 * three research stages (initial research, designing, completing design), each finishing when its
 * progress is full, so when one is due the progress is filled (inventNextItem) at every research
 * update until the item is invented - a few seconds. OpenRCT2 then announces it as usual.
 * Server only: research is part of the synchronised game state.
 */
export function subscribeToInventions() {
    let dayCounter = 0;
    let inventing = false;
    let inventedBefore = 0;
    let ticks = 0;

    subscriptions.upsert("inventions", () =>
        context.subscribe("interval.day", () => {
            dayCounter++;
            if (dayCounter >= config.inventionIntervalDays && park.research.uninventedItems.length > 0) {
                dayCounter = 0;
                inventing = true;
                inventedBefore = countInvented();
            }
        })
    );

    subscriptions.upsert("inventionProgress", () =>
        context.subscribe("interval.tick", () => {
            if (!inventing || ++ticks % RESEARCH_UPDATE_TICKS !== 0) return;

            if (countInvented() > inventedBefore || park.research.uninventedItems.length === 0) {
                inventing = false;
                return;
            }
            context.executeAction("inventNextItem", { args: {} }, (result) => {
                if (result.error) {
                    console.log("Failed to advance research:", result.errorMessage);
                    inventing = false;
                }
            });
        })
    );
}

export function unsubscribeFromInventions() {
    subscriptions.dispose("inventions");
    subscriptions.dispose("inventionProgress");
}
