import { updateScore } from "../../bingo/notifications/billboard";

export function updateScoreAction() {
    return {
        name: "updateScore",
        query: (event: GameActionEventArgs<{ playerNumber: number; newScore: number }>): GameActionResult => {
            // Dummy usage to avoid TypeScript warning
            void event;
            console.log("Querying updateScore action");
            return { error: 0 };
        },
        execute: (event: GameActionEventArgs<{ playerNumber: number; newScore: number }>): GameActionResult => {
            try {
                const playerNumber = event.args.playerNumber;
                const newScore = event.args.newScore;
                updateScore(playerNumber, newScore);
                console.log(`Player ${playerNumber} score updated to ${newScore} successfully`);
                return { error: 0 };
            } catch (error) {
                console.log("Failed to update score:", error);
                return { error: 1, errorMessage: "Failed to update score" };
            }
        }
    };
}


