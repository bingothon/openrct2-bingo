import { openBingoBoardDialog, showConnectDialog, showGameModeDialog } from "./ui";
import { resetGame } from "./utils";
import { bingosyncUI } from "./bingo/bingosync-handler";

export function registerCommonShortkeys(): void {
  if (typeof ui === 'undefined') return;

  ui.registerShortcut({ id: "bingoSync.openBingoBoardDialog", text: "Open Bingo Board", bindings: ["B"], callback: openBingoBoardDialog });
  ui.registerShortcut({ id: "bingoSync.openGameModeDialog", text: "Open Game Mode Dialog", bindings: ["CTRL+SHIFT+M"], callback: showGameModeDialog });
  ui.registerShortcut({ id: "bingoSync.resetGame", text: "Reset Game State", bindings: ["CTRL+SHIFT+R"], callback: () => {
    resetGame();
    console.log("Game state reset! Restart the plugin to see the game mode dialog again.");
  }});

  

  // Scoreboard management
  ui.registerShortcut({ id: "bingoSync.createScoreboard", text: "Create Scoreboard", bindings: ["CTRL+SHIFT+S"], callback: () => {
    context.executeAction("createScoreboard", { args: {} }, (result) => {
      if (result.error) {
        console.log("Failed to create scoreboard:", result.errorMessage);
      } else {
        console.log("Scoreboard created!");
      }
    });
  }});
}

export function registerServerOrNoneShortkeys(): void {
  if (typeof ui === 'undefined') return;
  ui.registerShortcut({ id: "bingoSync.openConnectionDialog", text: "Open BingoSync Connection Dialog", bindings: ["CTRL+SHIFT+C"], callback: showConnectDialog });
}

export function registerClientShortkeys(): void {
  if (typeof ui === 'undefined') return;
  ui.registerShortcut({ id: "bingoSync.connectionDetails", text: "Open BingoSync Connection Dialog", bindings: ["CTRL+SHIFT+C"], callback: bingosyncUI });
}


