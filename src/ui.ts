// ui.ts

import { config } from "./config";
import { bingosyncUI, connectToServer } from "./bingo/bingosync-handler";
import { BingoBoard, Goal } from "./types";
import { addLineBreak, configureBoard } from "./ui-helpers";
import { getSeed, startGame } from "./util";


const colorRed = "\x1b[31m";
const colorBlue = "\x1b[34m";
const colorReset = "\x1b[0m";

/**
 * Displays the Connect dialog with a button to trigger server connection
 */
export function showConnectDialog() {
    ui.openWindow({
        classification: "bingo-sync",
        title: "BingoSync Connection",
        width: 200,
        height: 200,
        widgets: [
            { type: "label", text: "Username:", x: 10, y: 20, width: 80, height: 20 },
            { type: "textbox", x: 100, y: 20, width: 90, height: 20, onChange: (text) => (config.userNameInput = text), },
            { type: "label", text: "Room Name:", x: 10, y: 50, width: 80, height: 20 },
            { type: "textbox", x: 100, y: 50, width: 90, height: 20, onChange: (text) => (config.roomNameInput = text), },
            { type: "label", text: "Password:", x: 10, y: 80, width: 180, height: 10 },
            { type: "textbox", x: 100, y: 80, width: 90, height: 20, onChange: (text) => (config.roomPasswordInput = text), },
            { type: "label", text: "(only enter to connect to an \nexisting board)", x: 10, y: 110, width: 180, height: 10 },
            { type: "label", text: "Room ID:", x: 10, y: 140, width: 180, height: 10 },
            { type: "textbox", x: 100, y: 140, width: 90, height: 20, onChange: (text) => (config.roomIdInput = text), },
            { type: "button", name: "connectButton", text: "Connect", x: 50, y: 170, width: 100, height: 20, onClick: connectToServer, },

        ],
    });
}

/**
 * Displays the Bingo board dialog with a 5x5 grid of buttons representing each Bingo slot.
 * @param {Goal[]} board - Array of 25 goals to display on the board.
 */
function showBingoBoardDialog(board: BingoBoard) {
    const widgets = [];
    const gridSize = 5;
    const buttonSize = 100; // Button width and height
    const spacing = 5; // Space between buttons
    const startX = 0; // Starting X position for the first button
    const startY = 15; // Starting Y position for the first button

    // Helper function to handle button clicks
    const handleButtonClick = (goal: Goal) => {
        if (goal.currentCondition) {
            const currentValue = goal.currentCondition();
            network.sendMessage(`[Goal: ${goal.name}] Current Value: ${currentValue}`);

            console.log(`Sent message for goal "${goal.name}" with value: ${currentValue}`);
        } else {
            console.log(`No current value for goal "${goal.name}"`);
        }
    };

    // Generate a 5x5 grid for Bingo board slots
    for (let row = 0; row < gridSize; row++) {
        for (let col = 0; col < gridSize; col++) {
            const index = row * gridSize + col;
            const goal = board[index];
            const formattedName = addLineBreak(goal.name);

            widgets.push({
                type: "button",
                name: `slot${index + 1}`,
                text: formattedName, // Use modified name with a line break
                x: startX + col * (buttonSize + spacing),
                y: startY + row * (buttonSize + spacing),
                width: buttonSize,
                height: buttonSize,
                border: goal.status !== "completed",
                isPressed: goal.status === "completed",
                onClick: () => handleButtonClick(goal),
            } as ButtonDesc);
        }
    }

    // Open the UI window with the generated widgets
    ui.openWindow({
        classification: "bingo-board",
        title: "Bingo Board (goals automatically update)               To open press: [B]",
        width: 520,
        height: 535,
        widgets: widgets,
    });
}

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
                    onClick: () => {
                        config.gameTime.year = 2;
                        startGame(2);
                        ui.getWindow("game-duration")?.close();
                    },
                },

                // Button for 5-year game
                {
                    type: "button",
                    text: "5 Years",
                    x: 25,
                    y: 90,
                    width: 200,
                    height: 30,
                    onClick: () => {
                        config.gameTime.year = 5;
                        startGame(5);
                        ui.getWindow("game-duration")?.close();
                    },
                },

                // Button for 10-year game
                {
                    type: "button",
                    text: "10 Years",
                    x: 25,
                    y: 130,
                    width: 200,
                    height: 30,
                    onClick: () => {
                        config.gameTime.year = 10;
                        startGame(10);
                        ui.getWindow("game-duration")?.close();
                    },
                },
            ],
        });
    }
}




export function openBingoBoardDialog() {
    const existingWindow = ui.getWindow("bingo-board");

    if (existingWindow) {
        // If the Bingo Board window is already open, close it
        existingWindow.close();
    } else {
        // If the Bingo Board window is not open, create and display it
        const board = configureBoard(getSeed());
        openBingoBoard(board);
    }
}

export function openBingoBoard(board: BingoBoard) {
    // Console output with colored text
    console.log(`${colorRed}--- Bingo Board ---${colorReset}`);
    board.forEach((goal) =>
        console.log(`${colorBlue}${goal.slot} - ${goal.name}${colorReset}`)
    );
    console.log(`
        --------------------------
        | 1  | 2  | 3  | 4  | 5  |
        -------------------------
        | 6  | 7  | 8  | 9  | 10 |
        -------------------------
        | 11 | 12 | 13 | 14 | 15 |
        -------------------------
        | 16 | 17 | 18 | 19 | 20 |
        -------------------------
        | 21 | 22 | 23 | 24 | 25 |
        --------------------------
    `);
    console.log(`${colorRed}--- Bingo Board ---${colorReset}`);
    showBingoBoardDialog(board);
}

