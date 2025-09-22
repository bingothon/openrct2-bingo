
import { configureBoard } from "./ui-helpers";
import { registerActions } from "./actions";
import { openBingoBoard, openBingoBoardDialog, showConnectDialog, showGameDurationDialog, showGameModeDialog, showWelcomeDialog } from "./ui";
import { checkIfStarted, getSeed, resetGame, setSeed } from "./util";
import { bingosyncUI, } from "./bingo/bingosync-handler";
import { restart, subscribeIfStarted, subscribeToGoalChecks, subscribeToInventions, subscribeToRenewRides } from "./subscriptions";
import { debugTile } from "./debug-tile-tool";
import { tileAnalyzer } from "./tile-analyzer";


export function main(): void {
  registerActions();
  network.defaultGroup = 3;

  if (network.mode === "server") {
    if (typeof ui !== 'undefined') {
      subscribeToInventions();
      subscribeToRenewRides();
      console.log("Server mode with UI.");
      setSeed();

      // // find the tiles that are not just surface tiles
      // context.executeAction('clearAllTiles', { args: {} }, (result) => {
      // });
      restart(true, false, () => {
        console.log("Starting normal server mode.");
      });
      ui.registerShortcut({ id: "bingoSync.openConnectionDialog", text: "Open BingoSync Connection Dialog", bindings: ["CTRL+SHIFT+C"], callback: showConnectDialog });
    } else {
      console.log("Headless mode detected, setting seed and starting server.");
      subscribeToInventions();
      subscribeToRenewRides();
      restart(true, false, () => {
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
      ui.registerShortcut({ id: "bingoSync.connectionDetails", text: "Open BingoSync Connection Dialog", bindings: ["CTRL+SHIFT+C"], callback: bingosyncUI });
    }
  } else if (network.mode === "none") {
    console.log("Single-player mode detected.");
    setSeed();
    if (typeof ui !== 'undefined') {
      ui.registerShortcut({ id: "bingoSync.openConnectionDialog", text: "Open BingoSync Connection Dialog", bindings: ["CTRL+SHIFT+C"], callback: showConnectDialog });

      // Always show game mode selection dialog for local testing
      console.log("Local testing mode - showing game mode dialog.");
      showGameModeDialog();
    }
  }

  if (typeof ui !== 'undefined') {
    ui.registerShortcut({ id: "bingoSync.openBingoBoardDialog", text: "Open Bingo Board", bindings: ["B"], callback: openBingoBoardDialog });
    ui.registerShortcut({ id: "bingoSync.openGameModeDialog", text: "Open Game Mode Dialog", bindings: ["CTRL+SHIFT+M"], callback: showGameModeDialog });
    ui.registerShortcut({ id: "bingoSync.resetGame", text: "Reset Game State", bindings: ["CTRL+SHIFT+R"], callback: () => {
      resetGame();
      console.log("Game state reset! Restart the plugin to see the game mode dialog again.");
    }});
    
    // Simple debug tool shortcuts
    ui.registerShortcut({ id: "debug.start", text: "Start Debug Tool", bindings: ["CTRL+SHIFT+D"], callback: () => {
      debugTile.activate();
    }});
    ui.registerShortcut({ id: "debug.stop", text: "Stop Debug Tool", bindings: ["CTRL+SHIFT+E"], callback: () => {
      debugTile.deactivate();
    }});
    ui.registerShortcut({ id: "debug.viewport", text: "Show Viewport Info", bindings: ["CTRL+SHIFT+V"], callback: () => {
      debugTile.showViewportInfo();
    }});
    ui.registerShortcut({ id: "bingoSync.createScoreboard", text: "Create Scoreboard", bindings: ["CTRL+SHIFT+S"], callback: () => {
      context.executeAction("createScoreboard", { args: {} }, (result) => {
        if (result.error) {
          console.log("Failed to create scoreboard:", result.errorMessage);
        } else {
          console.log("Scoreboard created!");
        }
      });
    }});
      ui.registerShortcut({ id: "bingoSync.clearScoreboard", text: "Clear Scoreboard", bindings: ["CTRL+SHIFT+X"], callback: () => {
        context.executeAction("clearScoreboard", { args: {} }, (result) => {
          if (result.error) {
            console.log("Failed to clear scoreboard:", result.errorMessage);
          } else {
            console.log("Scoreboard cleared!");
          }
        });
      }});
      
      // Test shortcuts for updating individual player scores
      ui.registerShortcut({ id: "bingoSync.updatePlayer1", text: "Update Player 1 Score", bindings: ["CTRL+1"], callback: () => {
        const newScore = Math.floor(Math.random() * 26); // Random score 0-25
        context.executeAction("updateScore", { args: { playerNumber: 0, newScore } }, (result) => {
          if (result.error) {
            console.log("Failed to update player 1 score:", result.errorMessage);
          } else {
            console.log(`Player 1 score updated to ${newScore}!`);
          }
        });
      }});
      
      ui.registerShortcut({ id: "bingoSync.updatePlayer2", text: "Update Player 2 Score", bindings: ["CTRL+2"], callback: () => {
        const newScore = Math.floor(Math.random() * 26); // Random score 0-25
        context.executeAction("updateScore", { args: { playerNumber: 1, newScore } }, (result) => {
          if (result.error) {
            console.log("Failed to update player 2 score:", result.errorMessage);
          } else {
            console.log(`Player 2 score updated to ${newScore}!`);
          }
        });
      }});
      
      ui.registerShortcut({ id: "bingoSync.updatePlayer3", text: "Update Player 3 Score", bindings: ["CTRL+3"], callback: () => {
        const newScore = Math.floor(Math.random() * 26); // Random score 0-25
        context.executeAction("updateScore", { args: { playerNumber: 2, newScore } }, (result) => {
          if (result.error) {
            console.log("Failed to update player 3 score:", result.errorMessage);
          } else {
            console.log(`Player 3 score updated to ${newScore}!`);
          }
        });
      }});
      
      ui.registerShortcut({ id: "bingoSync.updatePlayer4", text: "Update Player 4 Score", bindings: ["CTRL+4"], callback: () => {
        const newScore = Math.floor(Math.random() * 26); // Random score 0-25
        context.executeAction("updateScore", { args: { playerNumber: 3, newScore } }, (result) => {
          if (result.error) {
            console.log("Failed to update player 4 score:", result.errorMessage);
          } else {
            console.log(`Player 4 score updated to ${newScore}!`);
          }
        });
      }});
  }
}