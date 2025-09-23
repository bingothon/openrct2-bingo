import { clearScoreboard } from "../../bingo/notifications/billboard";

export function clearScoreboardAction() {
    return {
        name: "clearScoreboard",
        query: (event: GameActionEventArgs): GameActionResult => {
            // Dummy usage to avoid TypeScript warning
            void event;
            console.log("Querying clearScoreboard action");
            return { error: 0 };
        },
        execute: (event: GameActionEventArgs): GameActionResult => {
            // Dummy usage to avoid TypeScript warning
            void event;
            try {
                clearScoreboard();
                console.log("Scoreboard cleared successfully");
                return { error: 0 };
            } catch (error) {
                console.log("Failed to clear scoreboard:", error);
                return { error: 1, errorMessage: "Failed to clear scoreboard" };
            }
        }
    };
}


