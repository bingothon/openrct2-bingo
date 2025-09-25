import { selectGameMode } from "./selectGameMode";

/**
 * Displays a dialog to select the game mode (Singleplayer/COOP, PVP, or Lockout).
 */
export function showGameModeDialog() {
    if (!ui.getWindow("game-mode")) {
        ui.openWindow({
            classification: "game-mode",
            title: "Select Game Mode",
            width: 300,
            height: 250,
            widgets: [
                // Instructions label
                {
                    type: "label",
                    text: "Choose your game mode:",
                    x: 10,
                    y: 20,
                    width: 280,
                    height: 20,
                },

                // Singleplayer/COOP Mode button
                {
                    type: "button",
                    text: "Singleplayer/COOP",
                    x: 25,
                    y: 50,
                    width: 250,
                    height: 35,
                    onClick: () => selectGameMode("coop"),
                },

                // PVP Mode button
                {
                    type: "button",
                    text: "PVP",
                    x: 25,
                    y: 95,
                    width: 250,
                    height: 35,
                    onClick: () => selectGameMode("pvp"),
                },

                // Lockout Mode button
                {
                    type: "button",
                    text: "Lockout",
                    x: 25,
                    y: 140,
                    width: 250,
                    height: 35,
                    onClick: () => selectGameMode("lockout"),
                },

                // Mode descriptions
                {
                    type: "label",
                    text: "COOP: All players work together to complete goals",
                    x: 10,
                    y: 185,
                    width: 280,
                    height: 15,
                },
                {
                    type: "label",
                    text: "PVP: Players compete for goals (lockout bingo)",
                    x: 10,
                    y: 200,
                    width: 280,
                    height: 15,
                },
                {
                    type: "label",
                    text: "Lockout: Players compete for goals (lockout bingo)",
                    x: 10,
                    y: 215,
                    width: 280,
                    height: 15,
                },
            ],
        });
    }
}


