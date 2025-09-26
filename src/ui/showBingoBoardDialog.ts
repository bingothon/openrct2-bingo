import { BingoBoard, Goal } from "../types";
import { addLineBreak } from "./helpers";
import { config } from "../config";

/**
 * Displays the Bingo board dialog with a 5x5 grid of buttons representing each Bingo slot.
 * @param {Goal[]} board - Array of 25 goals to display on the board.
 */
export function showBingoBoardDialog(board: BingoBoard) {
    const widgets = [];
    // Holds resolved image ids for overlay custom widgets
    
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

            const completedPrefix = goal.status === "completed" && goal.colors && goal.colors !== "blank"
                ? buildChecksPrefix(goal.colors)
                : (goal.status === "completed" ? "{RED}✓{BLACK} " : "");
            
            // In lockout mode, color the entire text with the player's color
            const displayText = goal.status === "completed" && config.gameMode === "lockout" && goal.colors && goal.colors !== "blank"
                ? buildColoredText(goal.colors, formattedName)
                : `${completedPrefix}${formattedName}`;
            
            // Base clickable button (can show image)
            widgets.push({
                type: "button",
                name: `slot${index + 1}`,
                text: "", // Use overlay label for text
                x: startX + col * (buttonSize + spacing),
                y: startY + row * (buttonSize + spacing),
                width: buttonSize,
                height: buttonSize,
                border: goal.status !== "completed",
                isPressed: goal.status === "completed",
                onClick: () => handleButtonClick(goal),
            } as ButtonDesc);

            // Overlay label to display text and coloured checkmarks
            const labelYOffset = Math.floor((buttonSize - 12) / 2);
            widgets.push({
                type: "label",
                name: `slot${index + 1}_text`,
                text: displayText,
                x: startX + col * (buttonSize + spacing),
                y: startY + row * (buttonSize + spacing) + labelYOffset,
                width: buttonSize,
                height: 12,
                textAlign: "centred",
            } as LabelDesc);
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

    // No deferred image refresh needed anymore
}

function buildChecksPrefix(colors: string | undefined): string {
    if (!colors || colors === "blank") return "";
    const parts = colors.split(/[ ,]+/).filter(Boolean);
    const tokens = parts.map((c) => colourTokenForName(c.toLowerCase())).filter(Boolean) as string[];
    if (tokens.length === 0) return "";
    let prefix = "";
    for (const t of tokens) {
        prefix += `{${t}}✓{BLACK}`;
    }
    return prefix + "\n";
}

function buildColoredText(colors: string | undefined, text: string): string {
    if (!colors || colors === "blank") return text;
    const parts = colors.split(/[ ,]+/).filter(Boolean);
    const tokens = parts.map((c) => colourTokenForName(c.toLowerCase())).filter(Boolean) as string[];
    if (tokens.length === 0) return text;
    
    // Use the first color to color the entire text
    const colorToken = tokens[0];
    return `{${colorToken}}${text}{BLACK}`;
}

function colourTokenForName(name: string): string | null {
    switch (name) {
        case "red": return "RED";
        case "blue": return "BABYBLUE"; // Using OpenRCT2's BABYBLUE token
        case "green": return "GREEN";
        case "yellow": return "YELLOW";
        case "purple": return "PALELAVENDER"; // Using OpenRCT2's PALELAVENDER token
        case "orange": return "PALEGOLD"; // Using OpenRCT2's PALEGOLD token
        case "white": return "WHITE";
        case "black": return "BLACK";
        default: return null;
    }
}


