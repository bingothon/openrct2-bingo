import { bingosyncUI } from "../bingo/bingosync-handler";
import { openBingoBoardDialog } from "./openBingoBoardDialog";
import { copyableTextWidgets } from "./copyableText";

/** Wide enough for the full Discord links */
const WIDTH = 520;

/**
 * Displays the Welcome dialog with general information and interactive buttons.
 */
export function showWelcomeDialog() {
    ui.openWindow({
        id: 1,
        classification: "welcome-dialog",
        title: "OpenRCT2 Bingo",
        width: WIDTH,
        height: 260,
        widgets: [
            // Section: Instructions
            {
                type: "label",
                text: "Welcome to OpenRCT2 Bingo!",
                x: 10,
                y: 20,
                width: 330,
                height: 20,
            },
            {
                type: "label",
                text: "Objective: Complete a row, column, or diagonal to get a Bingo! \n You have 2 years to complete as many Bingos as possible.",
                x: 10,
                y: 50,
                width: 330,
                height: 40,
            },

            // Button for opening the Bingo board
            {
                type: "label",
                text: "Press",
                x: 10,
                y: 90,
                width: 40,
                height: 20,
            },
            {
                type: "button",
                text: "[B]",
                x: 50,
                y: 86,
                width: 120,
                height: 20,
                onClick: () => openBingoBoardDialog(),
            },
            {
                type: "label",
                text: "to open the Bingo board.",
                x: 180,
                y: 90,
                width: 160,
                height: 20,
            },

            // Button for opening BingoSync connection details
            {
                type: "label",
                text: "Press",
                x: 10,
                y: 120,
                width: 40,
                height: 20,
            },
            {
                type: "button",
                text: "[CTRL+SHIFT+C]",
                x: 50,
                y: 116,
                width: 120,
                height: 20,
                onClick: () => bingosyncUI(),
            },
            {
                type: "label",
                text: "for BingoSync connection details.",
                x: 180,
                y: 120,
                width: WIDTH - 190,
                height: 20,
            },

            // Section: Discord links (copyable)
            {
                type: "label",
                text: "Join the Discord communities:",
                x: 10,
                y: 150,
                width: WIDTH - 20,
                height: 20,
            },
            ...copyableTextWidgets("Bingothon:", "https://discord.gg/wY4pBEAjBb", 10, 172, WIDTH - 20),
            ...copyableTextWidgets("OpenRCT2:", "https://discord.com/invite/openrct2-264137540670324737", 10, 192, WIDTH - 20),

            // Close Button
            {
                type: "button",
                text: "Close",
                x: (WIDTH - 100) / 2,
                y: 220,
                width: 100,
                height: 30,
                onClick: () => ui.getWindow("welcome-dialog")?.close(),
            },
        ],
    });
}


