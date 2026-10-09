import { checkGoals, updateGoalUI } from "src/bingo/main";
import { config } from "src/config";
import { configureBoard, getBoardGameMode } from "src/ui/helpers";
import { openBingoBoard } from "src/ui";
import { BingoBoard } from "src/types";
import { subscriptions } from "../manager";

export function subscribeToGoalChecks(board: BingoBoard) {
    let tickCounter = 0;
    subscriptions.upsert("goalChecks", () =>
        context.subscribe("interval.tick", () => {
            tickCounter++;
            if (tickCounter % 100 === 0) {
                checkGoals(board);
                tickCounter = 0;
            }
        })
    );
}

export function unsubscribeFromGoalChecks() {
    subscriptions.dispose("goalChecks");
}
/**
 * Client-side board sync. Clients don't check goals; they show what the server stored:
 * - rebuild the board when the game mode changes (PvP/Lockout boards use different goals)
 * - refresh completion and player colours of every goal
 */
export function subscribeToClientBoardSync(seed: number, initialBoard: BingoBoard) {
    let board = initialBoard;
    let boardMode = getBoardGameMode();
    let tickCounter = 0;

    subscriptions.upsert("clientBoardSync", () =>
        context.subscribe("interval.tick", () => {
            tickCounter++;
            if (tickCounter % 40 !== 0) return;

            const parkStorage = context.getParkStorage();
            const mode = getBoardGameMode();
            if (mode !== boardMode) {
                boardMode = mode;
                config.gameMode = mode;
                board = configureBoard(seed);
                if (typeof ui !== "undefined") {
                    const window = ui.getWindow("bingo-board");
                    if (window) window.close();
                    openBingoBoard(board);
                }
                console.log(`[BoardSync] Rebuilt board for ${mode} mode`);
            }

            board.forEach((goal, index) => {
                const goalKey = `goal_${goal.slot}`;
                const completed = parkStorage.get(goalKey, false);
                let colours = goal.colors;
                try {
                    const stored = JSON.parse(parkStorage.get(`${goalKey}_colors`, "[]"));
                    if (Array.isArray(stored) && stored.length > 0) colours = stored.join(" ");
                } catch (error) {
                    // Keep the current colours on malformed data
                }

                const status = completed ? "completed" : "incomplete";
                if (status !== goal.status || colours !== goal.colors) {
                    goal.status = status;
                    goal.colors = colours;
                    if (typeof ui !== "undefined") updateGoalUI(index, board);
                }
            });
        })
    );
}
