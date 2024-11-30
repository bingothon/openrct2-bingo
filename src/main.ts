
import { configureBoard } from "./ui-helpers";
import { registerActions } from "./actions";
import { openBingoBoard, openBingoBoardDialog, showConnectDialog, showGameDurationDialog, showWelcomeDialog } from "./ui";
import { checkIfStarted, getSeed, setSeed } from "./util";
import { bingosyncUI, } from "./bingo/bingosync-handler";
import { restart, subscribeIfStarted, subscribeToGoalChecks, subscribeToInventions, subscribeToRenewRides } from "./subscriptions";

export function main(): void {
  registerActions();
  network.defaultGroup = 3;
  const seed = getSeed();

  if (network.mode === "server") {
    if (typeof ui !== 'undefined') {
      subscribeToInventions();
      subscribeToRenewRides();
      console.log("Server mode with UI.");
      setSeed();

      // // find the tiles that are not just surface tiles
      // context.executeAction('clearAllTiles', { args: {} }, (result) => {
      // });
      restart(true, () => {
        console.log("Starting normal server mode.");
      });
      ui.registerShortcut({ id: "bingoSync.openConnectionDialog", text: "Open BingoSync Connection Dialog", bindings: ["CTRL+SHIFT+C"], callback: showConnectDialog });
    } else {
      console.log("Headless mode detected, setting seed and starting server.");
      subscribeToInventions();
      subscribeToRenewRides();
      restart(true, () => {
        console.log("No UI detected, starting headless server mode.");
      });
    }
  } else if (network.mode === "client") {
    network.defaultGroup = 3;
    console.log("Client mode detected.");
    const seed = getSeed();
    console.log(`Seed received from host: ${seed}`);
    const board = configureBoard(seed);
    try {
      if (!checkIfStarted()) {
        console.log("Game not started, showing game duration dialog.");
        showGameDurationDialog();
      } else {
        const parkStorage = context.getParkStorage();
        const duration = parkStorage.get('duration', 0);
        const getCurrentYear = date.year;
        const remainingYears = duration - getCurrentYear;
        network.sendMessage(`Game already started, ${remainingYears} years remaining.`);
        console.log("Game already started, skipping game duration's dialog.");
      }
      subscribeIfStarted();
      subscribeToGoalChecks(board);
      showWelcomeDialog();
      openBingoBoard(board);
    } catch (error) {
      console.log("Error opening Bingo board:", error);
    }
    if (typeof ui !== 'undefined') {
      ui.registerShortcut({ id: "bingoSync.connectionDetails", text: "Open BingoSync Connection Dialog", bindings: ["CTRL+SHIFT+C"], callback: bingosyncUI });
    }
  } else if (network.mode === "none") {
    subscribeToInventions();
    subscribeToRenewRides();

    restart(false, () => {
      console.log("No network mode detected, starting single-player mode.");
    });
    console.log("Single-player mode detected.");
    setSeed();
    if (typeof ui !== 'undefined') {
      ui.registerShortcut({ id: "bingoSync.openConnectionDialog", text: "Open BingoSync Connection Dialog", bindings: ["CTRL+SHIFT+C"], callback: showConnectDialog });

      showConnectDialog();
      const board = configureBoard(seed);
      subscribeToGoalChecks(board);
      openBingoBoard(board);
    }
  }

  if (typeof ui !== 'undefined') {
    ui.registerShortcut({ id: "bingoSync.openBingoBoardDialog", text: "Open Bingo Board", bindings: ["B"], callback: openBingoBoardDialog });
  }
}