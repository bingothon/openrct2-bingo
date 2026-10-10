const WINDOW_CLASS = "game-result";
const WIDTH = 420;

/**
 * Shows who won and the final scores. Clients only learn that the game is over through park
 * storage (set by the server's GoalManager), so the window shows the result as stored there.
 */
export function showGameResult(result: string, finalScores: string): void {
    if (typeof ui === "undefined" || ui.getWindow(WINDOW_CLASS)) return;

    const lines = [
        { text: `{BLACK}${result}`, gap: 18 },
        ...(finalScores ? [{ text: `Final scores: ${finalScores}`, gap: 18 }] : []),
        ...(network.mode === "client"
            ? [{ text: "The server starts a new game in a few minutes - rejoin it then!", gap: 14 }]
            : []),
    ];

    let y = 22;
    const widgets: WidgetDesc[] = lines.map((line) => {
        const widget: WidgetDesc = { type: "label", x: 10, y, width: WIDTH - 20, height: 14, text: line.text };
        y += line.gap;
        return widget;
    });
    widgets.push({
        type: "button",
        x: (WIDTH - 80) / 2,
        y: y + 6,
        width: 80,
        height: 16,
        text: "OK",
        onClick: () => {
            const window = ui.getWindow(WINDOW_CLASS);
            if (window) window.close();
        },
    });

    ui.openWindow({
        classification: WINDOW_CLASS,
        title: "Game over",
        width: WIDTH,
        height: y + 30,
        widgets,
    });
}

/**
 * Opens the result window once when the game ends, also for players who join after the end
 */
export function subscribeToGameResult(): IDisposable | null {
    if (typeof ui === "undefined") return null;

    let ticks = 0;
    let shownFor = "";
    return context.subscribe("interval.tick", () => {
        if (++ticks % 40 !== 0) return;

        const parkStorage = context.getParkStorage();
        const result: string = parkStorage.get("gameResult", "");
        if (!parkStorage.get("gameOver", false) || !result || result === shownFor) return;

        shownFor = result;
        showGameResult(result, parkStorage.get("finalScores", ""));
    });
}
