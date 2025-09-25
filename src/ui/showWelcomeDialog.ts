import { bingosyncUI } from "../bingo/bingosync-handler";
import { openBingoBoardDialog } from "./openBingoBoardDialog";

/**
 * Displays the Welcome dialog with general information and interactive buttons.
 */
export function showWelcomeDialog() {
    ui.openWindow({
        id: 1,
        classification: "welcome-dialog",
        title: "OpenRCT2 Bingo",
        width: 355,
        height: 300,
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
                width: 165,
                height: 20,
            },

            // Section: Copyable Discord Links
            {
                type: "label",
                text: "Join the Discord communities: (Ctrl+C to copy)",
                x: 10,
                y: 150,
                width: 330,
                height: 20,
            },
            {
                type: "label",
                text: "Bingothon Discord:",
                x: 10,
                y: 180,
                width: 100,
                height: 20,
            },
            {
                type: "textbox",
                x: 120,
                y: 180,
                width: 200,
                height: 20,
                text: "https://discord.gg/wY4pBEAjBb",
            },
            {
                type: "label",
                text: "OpenRCT2 Discord:",
                x: 10,
                y: 210,
                width: 100,
                height: 20,
            },
            {
                type: "textbox",
                x: 120,
                y: 210,
                width: 200,
                height: 20,
                text: "https://discord.com/invite/openrct2-264137540670324737",
            },

            // Close Button
            {
                type: "button",
                text: "Close",
                x: 125,
                y: 250,
                width: 100,
                height: 30,
                onClick: () => ui.getWindow("welcome-dialog")?.close(),
            },
        ],
    });
}


