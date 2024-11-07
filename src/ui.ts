// ui.ts

import { config } from "./config";
import { connectToServer } from "./bingosync-handler";
import { BingoBoard } from "./types";
import { addLineBreak, getSeed, configureBoard } from "./ui-helpers";


const colorRed = "\x1b[31m";
const colorBlue = "\x1b[34m";
const colorReset = "\x1b[0m";

/**
 * Updates the UI after a successful connection.
 */
export function updateUIOnConnect(roomUrl: string, roomPassphrase: string) {
    ui.closeAllWindows();
    ui.openWindow({
        classification: "bingo-sync",
        title: "BingoSync Connection",
        width: 200,
        height: 130,
        widgets: [
            { type: "label", text: "Connected to BingoSync!", x: 35, y: 22, width: 160, height: 20 },
            { type: "label", text: "Room URL:", x: 10, y: 40, width: 80, height: 20 },
            { type: "textbox", x: 100, y: 40, width: 90, height: 20, text: roomUrl },
            { type: "label", text: "Password:", x: 10, y: 70, width: 80, height: 20 },
            { type: "textbox", x: 100, y: 70, width: 90, height: 20, text: roomPassphrase },
        ],
    });
}

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
export function showBingoBoardDialog(board: BingoBoard) {
    const widgets = [];
    const gridSize = 5;
    const buttonSize = 100; // Button width and height
    const spacing = 5; // Space between buttons
    const startX = 0; // Starting X position for the first button
    const startY = 15; // Starting Y position for the first button

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
                onClick: void 0, // Disable button click
            } as ButtonDesc);
        }
    }

    // Open the UI window with the generated widgets
    ui.openWindow({
        classification: "bingo-board",
        title: "Bingo Board (goals automatically update)               To open press: [CTRL+SHIFT+B]",
        width: 520,
        height: 535,
        widgets: widgets,
    });
}

/**
 * Updates the UI to reflect a completed goal without refreshing the entire Bingo board.
 */
export function updateGoalUI(index: number, board: BingoBoard) {
    const window = ui.getWindow("bingo-board");
    if (window) {
        const button = window.findWidget<ButtonWidget>(`slot${index + 1}`);
        if (button) {
            button.isPressed = true;
            button.border = false;
            button.text = `✓ ${board[index].name}`;
        }
    }
}

export function openBingoBoardDialog() {
    const board = configureBoard(getSeed());
    openBingoBoard(board);
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

