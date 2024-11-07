import { getSeed, goals, setSeed } from "./bingo";
import { BingoBoard, BingoSyncBoardData } from "./types";
import { config } from "./config";
import { configureBoard, updateBoardWithData, updateBoardWithSeed } from "src/ui-helpers";
import { updateUIOnConnect } from "src/ui";


/**
* Converts Bingo board goals to BingoSync format
*/
function convertForBingoSync(board: BingoBoard): { name: string }[] {
    return board.map((goal) => ({ name: goal.name }));
}

export function connectToServer() {
    setSeed();
    const board = configureBoard(getSeed());
    const bingoSyncFormat = convertForBingoSync(board);
    const socket = network.createSocket();

    try {
        socket.connect(3000, "localhost", () => {
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
        if (response.roomUrl) {

            // // Check if `boardData` exists and has exactly 25 items
            if (response.boardData) {
                const boardData: BingoSyncBoardData[] = response.boardData || [];
                const convertedBoardData: BingoBoard = boardData.map((goal: BingoSyncBoardData) => {
                    const matchedGoal = goals(config.defaultSeed).filter((g) => g.name === goal.name)[0]; //TODO: this does not work due to it having nothing to do with the seed

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
            updateUIOnConnect(response.roomUrl, response.passphrase);
            updateBoardWithSeed(getSeed());

            return
        }
    } catch (error) {
        console.log("error processing bingosync:", error);
    }
}