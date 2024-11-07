
import { getSeed, configureBoard, setSeed
 } from "./ui-helpers";
import { registerActions } from "./actions";
import { openBingoBoard, openBingoBoardDialog, showConnectDialog } from "./ui";
import { subscribeToGoalChecks } from "./goals";
let dayCounter = 0; // Counter for days passed



function showError(result: GameActionResult, ride: Ride) {
  if (result.error !== 0) {
    console.log("Error with demolishing", ride.name);
    console.log(result.errorMessage);
  }
  return
}

/**
 * Function to refurbish rides
 */

function refurbishRides() {
  const rides = map.rides;
  const unwantedStatusArray = ['testing', 'simulating'];
  const filteredRides = rides.filter(ride => !unwantedStatusArray.some(status => status === ride.status) && ride.classification !== 'stall' && ride.classification !== 'facility');
  filteredRides.forEach(ride => {
    context.executeAction('ridesetstatus', { ride: ride.id, status: 0 }, (result) => {
      showError(result, ride);
      context.executeAction('ridesetstatus', { ride: ride.id, status: 0 }, (result) => {
        showError(result, ride);
        context.queryAction('ridedemolish', { ride: ride.id, modifyType: 1 }, (result) => {
          const cost = result.cost;
          if (cost) park.cash += cost;
          context.executeAction("ridedemolish", { ride: ride.id, modifyType: 1 }, (result) => {
            showError(result, ride);
            context.executeAction('ridesetstatus', { ride: ride.id, status: 1 }, (result) => {
              showError(result, ride);
            });
          });
        });
      });
    });
  })
}

export function main(): void {
  registerActions();
  

  const seed = getSeed();
  if (network.mode === "server") {
    // Host sets the initial seed if not set
    setSeed();
    ui.registerShortcut({ id: "bingoSync.openConnectionDialog", text: "Open BingoSync Connection Dialog", bindings: ["CTRL+SHIFT+C"], callback: showConnectDialog });
    showConnectDialog();

    context.subscribe("network.join", () => {

    });

  } else if (network.mode === "client") {
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

  context.executeAction("gamesetspeed", { speed: 4 });
  context.subscribe("interval.day", () => {
    dayCounter++;
    if (dayCounter >= 180) {
      refurbishRides();
      dayCounter = 0; // Reset the counter after refurbishing
    }
  });

  ui.registerShortcut({ id: "bingoSync.openBingoBoardDialog", text: "Open Bingo Board", bindings: ["CTRL+SHIFT+B"], callback: openBingoBoardDialog });



}
