import { selectGameDuration } from "./selectGameDuration";

/**
 * Displays a dialog with buttons to select the game duration (2 years, 5 years, or 10 years).
 */
export function showGameDurationDialog() {
    if (!ui.getWindow("game-duration")) {
        ui.openWindow({
            classification: "game-duration",
            title: "Select Game Duration",
            width: 250,
            height: 200,
            widgets: [
                // Instructions label
                {
                    type: "label",
                    text: "Choose the game duration:",
                    x: 10,
                    y: 20,
                    width: 230,
                    height: 20,
                },

                // Button for 2-year game
                {
                    type: "button",
                    text: "2 Years",
                    x: 25,
                    y: 50,
                    width: 200,
                    height: 30,
                    onClick: () => selectGameDuration(2),
                },

                // Button for 5-year game
                {
                    type: "button",
                    text: "5 Years",
                    x: 25,
                    y: 90,
                    width: 200,
                    height: 30,
                    onClick: () => selectGameDuration(5),
                },

                // Button for 10-year game
                {
                    type: "button",
                    text: "10 Years",
                    x: 25,
                    y: 130,
                    width: 200,
                    height: 30,
                    onClick: () => selectGameDuration(10),
                },
            ],
        });
    }
}


