
import { configureBoard } from "./ui-helpers";
import { registerActions } from "./actions";
import { openBingoBoard, openBingoBoardDialog, showConnectDialog } from "./ui";
import { subscribeToGoalChecks, triggerBingo } from "./bingo/main";
import { clearMiddle, getSeed, renewRides, setSeed } from "./util";
let dayCounter = 0; // Counter for days passed



function showError(result: GameActionResult, ride: Ride) {
  if (result.error !== 0) {
    console.log("Error with demolishing", ride.name);
    console.log(result.errorMessage);
  }
  return
}

export function main(): void {
  registerActions();
  clearMiddle();
  network.defaultGroup = 3;
  const seed = getSeed();

  if (network.mode === "server") {
    
    // Host sets the initial seed if not set
    setSeed();
    ui.registerShortcut({ id: "bingoSync.openConnectionDialog", text: "Open BingoSync Connection Dialog", bindings: ["CTRL+SHIFT+C"], callback: showConnectDialog });
    showConnectDialog();

  } else if (network.mode === "client") {
    // give building rights

    const seed = getSeed();
    console.log(`Seed received from host: ${seed}`);
    const board = configureBoard(seed);
    try {
      subscribeToGoalChecks(board);
      openBingoBoard(board);
    } catch (error) {
      console.log("Error opening Bingo board:", error);
    }

  } else if (network.mode === "none") {
    ui.registerShortcut({ id: "bingoSync.openConnectionDialog", text: "Open BingoSync Connection Dialog", bindings: ["CTRL+SHIFT+C"], callback: showConnectDialog });
    showConnectDialog();
    const board = configureBoard(seed);
    subscribeToGoalChecks(board);
    openBingoBoard(board);
  }

  // Game actionsd

  context.executeAction("gamesetspeed", { speed: 4 });
  context.subscribe("interval.day", () => {
    dayCounter++;
    if (dayCounter >= 180) {
      renewRides();
      dayCounter = 0; // Reset the counter after refurbishing
    }
  });

  ui.registerShortcut({ id: "bingoSync.openBingoBoardDialog", text: "Open Bingo Board", bindings: ["CTRL+SHIFT+B"], callback: openBingoBoardDialog });



}
