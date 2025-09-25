export function updateBoardWithSeed(newSeed: number) {
    context.executeAction(
        "updateBoardSeed",
        { args: { seed: newSeed } },
        (result) => {
            if (result.error) {
                console.log("Failed to update board with new seed:", result.errorMessage);
            }
        }
    );
}
