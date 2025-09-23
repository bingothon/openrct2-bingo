import { checkGoals } from "src/bingo/main";
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