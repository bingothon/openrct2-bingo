import { GameManager } from "../managers/GameManager";
import type { RegisteredPlayer } from "../managers/PlayerManager";
import { PLAYER_COLOURS } from "../bingo/playerColours";
import { colourTokenForName } from "../bingo/main";
import { getPlayerIdentity } from "../utils/playerIdentity";

const WINDOW_CLASS = "region-picker";
const BUTTON_HEIGHT = 30;

/**
 * The local player's registration, also when it was made under an earlier connection
 */
export function getLocalRegistration(): RegisteredPlayer | null {
    if (network.mode === "none") return null;
    const me = network.currentPlayer;
    const gameManager = GameManager.getInstance();
    const identity = getPlayerIdentity(me.id);
    return (
        gameManager.getPlayer(me.id.toString()) ||
        (identity ? gameManager.getPlayerManager().getPlayerByIdentity(identity) : null) ||
        null
    );
}

function getTakenBy(colour: string): RegisteredPlayer | null {
    const players = GameManager.getInstance().getAllPlayers();
    for (let i = 0; i < players.length; i++) {
        if (players[i].colour === colour) return players[i];
    }
    return null;
}

function getButtonText(colour: string): string {
    const takenBy = getTakenBy(colour);
    if (takenBy) {
        return `${colour.toUpperCase()} - taken by ${takenBy.name}`;
    }
    const token = colourTokenForName(colour);
    return `${token ? `{${token}}` : ""}${colour.toUpperCase()}`;
}

function refresh(window: Window): void {
    PLAYER_COLOURS.forEach((colour) => {
        const button = window.findWidget<ButtonWidget>(`pick-${colour}`);
        if (!button) return;
        button.text = getButtonText(colour);
        button.isDisabled = getTakenBy(colour) !== null;
    });
}

/**
 * Lets a player pick their colour/region in PvP/Lockout. Colours that are taken are greyed out.
 */
export function showRegionPicker(onClose?: () => void): void {
    if (typeof ui === "undefined" || ui.getWindow(WINDOW_CLASS)) return;

    const widgets: WidgetDesc[] = [
        {
            type: "label",
            x: 10,
            y: 20,
            width: 280,
            height: 14,
            text: "Pick your colour - you can only build in its region:",
        },
    ];
    PLAYER_COLOURS.forEach((colour, index) => {
        widgets.push({
            type: "button",
            name: `pick-${colour}`,
            x: 10,
            y: 40 + index * (BUTTON_HEIGHT + 5),
            width: 280,
            height: BUTTON_HEIGHT,
            text: getButtonText(colour),
            isDisabled: getTakenBy(colour) !== null,
            onClick: () => {
                context.executeAction("registerPlayer", { args: { colour } }, (result) => {
                    if (result.error) {
                        ui.showError(result.errorTitle || "Can't register", result.errorMessage || "");
                    }
                });
            },
        });
    });

    let frames = 0;
    ui.openWindow({
        classification: WINDOW_CLASS,
        title: "Pick your region",
        width: 300,
        height: 40 + PLAYER_COLOURS.length * (BUTTON_HEIGHT + 5) + 10,
        widgets,
        onUpdate: () => {
            // Refresh about once a second: others may have picked a colour meanwhile
            frames++;
            if (frames % 40 !== 0) return;

            const window = ui.getWindow(WINDOW_CLASS);
            if (!window) return;
            if (getLocalRegistration()) {
                window.close();
            } else {
                refresh(window);
            }
        },
        onClose,
    });
}

/**
 * Open the region picker for players who haven't picked a colour yet once a PvP/Lockout game
 * runs. If they close it without picking, it comes back after a minute.
 */
export function subscribeToRegionPicker(): IDisposable | null {
    if (typeof ui === "undefined" || network.mode === "none") return null;

    let ticks = 0;
    let reopenAt = 0;
    return context.subscribe("interval.tick", () => {
        ticks++;
        if (ticks % 40 !== 0 || ticks < reopenAt) return;

        const parkStorage = context.getParkStorage();
        const mode: string = parkStorage.get("gameMode", "coop");
        const started = parkStorage.get("started", false);
        const gameOver = parkStorage.get("gameOver", false);
        if ((mode !== "pvp" && mode !== "lockout") || !started || gameOver || getLocalRegistration()) {
            return;
        }

        showRegionPicker(() => {
            reopenAt = ticks + 40 * 60; // about a minute
        });
    });
}
