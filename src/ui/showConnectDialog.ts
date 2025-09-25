import { config } from "../config";
import { connectToServer } from "../bingo/bingosync-handler";

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


