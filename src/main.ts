
import { configureBoard } from "./ui-helpers";
import { registerActions } from "./actions/registerActions";
import { openBingoBoard, showGameDurationDialog, showGameModeDialog, showWelcomeDialog } from "./ui";
import { checkIfStarted, getSeed, setSeed } from "./util";
import { subscribeToGoalChecks, subscribeToInventions, subscribeToRenewRides } from "./subscriptions/game";
// Removed unused tileAnalyzer import
import { registerClientShortkeys, registerCommonShortkeys, registerServerOrNoneShortkeys } from "./shortkeys";
import { registerDebugShortkeys } from "./debug/shortkeys";
import { config } from "./config";
import { restart, subscribeIfStarted } from "./subscriptions/server";


export function main(): void {
  registerActions();
  network.defaultGroup = 3;
  
  // Shortkeys are registered below per mode

  if (network.mode === "server") {
    if (typeof ui !== 'undefined') {
      subscribeToInventions();
      subscribeToRenewRides();
      console.log("Server mode with UI.");
      setSeed();

      // // find the tiles that are not just surface tiles
      // context.executeAction('clearAllTiles', { args: {} }, (result) => {
      // });
      restart(() => {
        console.log("Starting normal server mode.");
      });
      registerServerOrNoneShortkeys();
    } else {
      console.log("Headless mode detected, setting seed and starting server.");
      subscribeToInventions();
      subscribeToRenewRides();
      restart(() => {
        console.log("No UI detected, starting headless server mode.");
      });
    }
  } else if (network.mode === "client") {
    network.defaultGroup = 2; // TODO: Set this to 1 during bingothon
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
      registerClientShortkeys();
    }
  } else if (network.mode === "none") {
    console.log("Single-player mode detected.");
    setSeed();
    if (typeof ui !== 'undefined') {
      registerServerOrNoneShortkeys();

      // Always show game mode selection dialog for local testing
      console.log("Local testing mode - showing game mode dialog.");
      showGameModeDialog();
    }
  }

  
  registerCommonShortkeys();
  if (config.debug) {
    registerDebugShortkeys();
  }
}