import { createPlayerSections } from "../../bingo/notifications/playerSections";

export function createPlayerSectionsAction() {
    return {
        name: "createPlayerSections",
        query: (event: GameActionEventArgs): GameActionResult => {
            // Dummy usage to avoid TypeScript warning
            void event;
            console.log("Querying createPlayerSections action");
            return { error: 0 };
        },
        execute: (event: GameActionEventArgs): GameActionResult => {
            // Dummy usage to avoid TypeScript warning
            void event;
            try {
                const success = createPlayerSections();
                if (success) {
                    console.log("Player sections created successfully");
                    return { error: 0 };
                } else {
                    console.log("Failed to create player sections");
                    return { error: 1, errorMessage: "Failed to create player sections" };
                }
            } catch (error) {
                console.log("Failed to create player sections:", error);
                return { error: 1, errorMessage: "Failed to create player sections" };
            }
        }
    };
}


