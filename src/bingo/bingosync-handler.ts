import { goals } from "./goals";
import { debugMode, getSeed, setSeed } from "../util";
import { BingoBoard, BingoSyncBoardData } from "../types";
import { config } from "../config";
import { configureBoard, updateBoardWithData, updateBoardWithSeed } from "src/ui-helpers";
// import { restart } from "src/subscriptions";
config.socket = network.createSocket();
const socket = config.socket;
let isSocketConnected = false; // Track connection state globally
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

export function bingosyncUI() {
    ui.openWindow({
        classification: "bingosync-connection",
        title: "BingoSync Connection",
        width: 200,
        height: 130,
        widgets: [
            { type: "label", text: "Connected to BingoSync!", x: 35, y: 22, width: 160, height: 20 },
            { type: "label", text: "Room URL:", x: 10, y: 40, width: 80, height: 20 },
            { type: "textbox", x: 100, y: 40, width: 90, height: 20, text: context.getParkStorage().get('roomUrl') },
            { type: "label", text: "Password:", x: 10, y: 70, width: 80, height: 20 },
            { type: "textbox", x: 100, y: 70, width: 90, height: 20, text: context.getParkStorage().get('roomPassword') },
        ],
    });
}
/**
* Converts Bingo board goals to BingoSync format
*/
function convertForBingoSync(board: BingoBoard): { name: string }[] {
    return board.map((goal) => ({ name: goal.name }));
}

export function connectToServer() {
    console.log("before seed", getSeed());
    const seed = setSeed();
    console.log("seed after", seed);
    const board = configureBoard(seed);
    const bingoSyncFormat = convertForBingoSync(board);


    try {
        socket.connect(12414, "127.0.0.1", () => {
            isSocketConnected = true;
            console.log("Connected to server");
            const creationRequest = JSON.stringify({
                action: "connectOrCreate",
                room_name: config.roomNameInput,
                username: config.userNameInput,
                roomId: config.roomIdInput,
                roomPassword: config.roomPasswordInput,
                boardData: bingoSyncFormat,
            }) + "\n";
            socket.write(creationRequest);
        });

    } catch (connectError) {
        console.log("Error during connection:", connectError);
    }

    setupSocketDataHandler(socket);
}
/**
 * Sets up data handling and goal-check interval on server socket connection
 */
export function setupSocketDataHandler(socket: Socket) {
    let buffer = "";

    socket.on("data", (data) => {
        buffer += data.toString();
        const messages = buffer.split("\n");
        buffer = messages.pop() || "";

        for (const message of messages) {
            processMessage(message.trim());
        }
    });

    socket.on("error", (error) => console.log("Socket error:", error));
    socket.on("close", (hadError) => console.log("Connection closed", hadError ? "with error" : "without error"));
}

/**
* Processes each incoming message, checks conditions, and sends updates if needed
*/
export function processMessage(message: string) {
    try {
        const response = JSON.parse(message);

        // Check if an action is present in the response
        if (response.action === "addCash") {
            if (typeof response.amount !== "number" || response.amount <= 0) {
                console.log("Invalid or missing amount in addCash action.");
                return;
            }
            console.log(`Adding ${response.amount} cash to the park.`);
            // Example action: Update park cash
            context.executeAction("addCash", { args: { amount: response.amount } });
            return;
        }

        // Retain existing logic for handling `roomUrl`
        if (response.roomUrl) {
            // Extract room ID from the URL
            const roomId = response.roomUrl.split("/").pop();
            config.room = roomId;

            // Check and process board data if it exists
            if (response.boardData) {
                const boardData: BingoSyncBoardData[] = response.boardData || [];
                const convertedBoardData: BingoBoard = boardData.map((goal: BingoSyncBoardData) => {
                    const matchedGoal = goals(config.defaultSeed).filter((g) => g.name === goal.name)[0]; // No changes here

                    // Extract the numeric part of the slot
                    const slotNumber = goal.slot.replace(/^slot/, "");

                    return {
                        name: goal.name,
                        slot: slotNumber, // Assign the numeric part of the slot
                        colors: goal.colors,
                        status: matchedGoal ? "incomplete" : "completed",
                        checkCondition: matchedGoal ? matchedGoal.checkCondition : () => false,
                    };
                });
                updateBoardWithData(convertedBoardData);
            }

            configureBoard(getSeed(), true);
            context.executeAction("connectionDetails", { args: { roomUrl: response.roomUrl, roomPassword: response.passphrase } });
            if (typeof ui !== "undefined") {
                updateUIOnConnect(response.roomUrl, response.passphrase);
            }

            updateBoardWithSeed(getSeed());
            return;
        }
    } catch (error) {
        console.log("error processing bingosync:", error);
    }
}



/**
 * Sends a reset message to the server.
 */
export function resetServer() {
    if (!isSocketConnected) {
        console.log("Socket is not connected. Reconnecting...");
        socket.connect(12414, "127.0.0.1", () => {
            isSocketConnected = true;
            console.log("Reconnected to server");

            // Send the reset message after reconnection
            const resetMessage = JSON.stringify({
                action: "restart",
            }) + "\n";

            try {
                socket.write(resetMessage);
                console.log("Sent reset message to the server");
            } catch (error) {
                console.log("Error while sending reset message:", error);
            }
        });

        socket.on("error", (error) => {
            isSocketConnected = false;
            console.log("Socket error:", error);
        });

        socket.on("close", () => {
            isSocketConnected = false;
            console.log("Socket connection closed");
        });
    } else {
        const resetMessage = JSON.stringify({
            action: "restart",
        }) + "\n";

        try {
            socket.write(resetMessage);
            console.log("Sent reset message to the server");
        } catch (error) {
            console.log("Error while sending reset message:", error);
        }
    }
}
