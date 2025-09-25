import { BingoBoard } from "src/types";

export function updateBoardWithData(board: BingoBoard) {
    context.executeAction(
        "updateBoardData",
        { args: { board } },
        (result) => {
            if (result.error) {
                console.log("Failed to update board with new data:", result.errorMessage);
            }
        }
    );
}
