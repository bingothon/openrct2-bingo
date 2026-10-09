import { goals } from "./goals";
import { getSeed, setSeed } from "../utils";
import { BingoBoard, BingoSyncBoardData } from "../types";
import { config } from "../config";
import { configureBoard, updateBoardWithData, updateBoardWithSeed } from "src/ui/helpers";
import type { ManagedServer } from "../utils/managedServer";
// import { restart } from "src/subscriptions";
// Created on the first connection, so games that never connect (every client) don't open one
let socket: Socket | null = null;

function getSocket(): Socket {
    if (!socket) {
        socket = network.createSocket();
        config.socket = socket;
    }
    return socket;
}
let isSocketConnected = false; // Track connection state globally
let dataHandlerAttached = false;

/** Set on servers started by the server manager: they link their BingoSync room automatically */
let managedLink: { serverId: string; mode: string } | null = null;
/** Board waiting for the manager connection before its room can be created */
let pendingBoard: BingoBoard | null = null;

function send(message: object): void {
    try {
        getSocket().write(JSON.stringify(message) + "\n");
    } catch (error) {
        console.log("Error writing to the server manager:", error);
    }
}

function attachDataHandler(): void {
    if (dataHandlerAttached) return;
    dataHandlerAttached = true;
    setupSocketDataHandler(getSocket());
}
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
        getSocket().connect(12414, "127.0.0.1", () => {
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
            getSocket().write(creationRequest);
        });

    } catch (connectError) {
        console.log("Error during connection:", connectError);
    }

    attachDataHandler();
}

/**
 * Managed server: connect to the server manager and tell it which server this is
 */
export function connectToManager(server: ManagedServer): void {
    managedLink = { serverId: server.id, mode: server.mode };
    attachDataHandler();
    try {
        getSocket().connect(server.managerPort, "127.0.0.1", () => {
            isSocketConnected = true;
            console.log(`[BingoSync] Connected to the server manager as "${server.id}"`);
            send({ action: "hello", serverId: server.id });
            if (pendingBoard) {
                sendBoard(pendingBoard);
                pendingBoard = null;
            }
        });
    } catch (error) {
        console.log("[BingoSync] Couldn't connect to the server manager:", error);
    }
}

/**
 * Managed server: create the BingoSync room for this game's board (keeps the board as it is)
 */
export function linkBingoSyncRoom(board: BingoBoard): void {
    if (!managedLink) return;
    if (!isSocketConnected) {
        pendingBoard = board;
        return;
    }
    sendBoard(board);
}

function sendBoard(board: BingoBoard): void {
    if (!managedLink) return;
    send({
        action: "connectOrCreate",
        room_name: `${config.roomNameInput} (${managedLink.mode.toUpperCase()})`,
        username: config.userNameInput,
        boardData: convertForBingoSync(board),
        mode: managedLink.mode,
    });
}

/**
 * Managed server: ask the manager to restart this server (fresh scenario). False when this
 * server isn't run by the manager or the manager can't be reached.
 */
export function canRequestServerRestart(): boolean {
    return managedLink !== null && isSocketConnected;
}

export function requestServerRestart(): boolean {
    if (!managedLink || !isSocketConnected) return false;
    send({ action: "restart" });
    return true;
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
    socket.on("close", (hadError) => {
        isSocketConnected = false;
        console.log("Connection closed", hadError ? "with error" : "without error");
    });
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

        if (response.error) {
            console.log("[BingoSync] Server manager error:", response.error);
            return;
        }

        // Retain existing logic for handling `roomUrl`
        if (response.roomUrl) {
            // Extract room ID from the URL
            const roomId = response.roomUrl.split("/").pop();
            config.roomIdInput = roomId;

            // Managed server: the room was created for the running game - only share the details,
            // don't rebuild the board (that would reset its goals)
            if (managedLink) {
                console.log(`[BingoSync] Room linked: ${response.roomUrl}`);
                context.executeAction("connectionDetails", { args: { roomUrl: response.roomUrl, roomPassword: response.passphrase } });
                return;
            }

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



