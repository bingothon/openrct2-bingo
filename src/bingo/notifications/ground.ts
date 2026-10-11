import { debugMode, ownMapSection } from "../../utils";
import { celebrate } from "./celebration";
type RandomMapSectionKey = "top-left" | "top-right" | "bottom-left" | "bottom-right";

const predeterminedSections: RandomMapSectionKey[] = [
    "top-right", 
    "bottom-left", 
    "bottom-right"
];

// Copy of the predetermined sections to track what’s left
const remainingSections = [...predeterminedSections];

function handleMapSectionOwnership(callback: () => void) {
    console.log("[handleMapSectionOwnership] This should only be called in COOP mode!");
    
    // If no sections are left, log and call the callback
    if (remainingSections.length === 0) {
        console.log("All map sections have already been owned.");
        callback();
        return;
    }

    // Get the first section in the predetermined order
    const nextSection = remainingSections.shift(); // Removes the first item

    if (nextSection) {
        console.log(`Awarding map section: ${nextSection}`);
        ownMapSection(nextSection, callback); // Award the section
    } else {
        console.log("No sections left to award.");
        callback();
    }
}


/**
 * COOP bingo (server only): $1,000,000, the next map section and the celebration in front of
 * the billboard. Sandbox mode is only on while the map section is awarded.
 */
export function notifyGroundBingo() {
    if (network.mode === "client") return;

    context.executeAction("addCash", { args: { cash: 10000000 } }, (result) => {
        if (result.error) {
            console.log("Failed to add cash:", result.errorMessage);
        }
        debugMode(1, () => {
            handleMapSectionOwnership(() => {
                debugMode(0, () => {
                    celebrate(null);
                });
            });
        });
    });
}
