import { debugTile } from "./debug-tile-tool";
import { footpathExtractor } from "./footpath-extractor";
import { updateGoalUI, setGoalCompletionStatus } from "../bingo/main";
import { config } from "../config";

export function registerDebugShortkeys(): void {
    if (typeof ui === 'undefined') return;
    // Test shortcuts for updating individual player scores
    ui.registerShortcut({ id: "bingoSync.updatePlayer1", text: "Update Player 1 Score", bindings: ["CTRL+1"], callback: () => {
      const newScore = Math.floor(Math.random() * 26);
      context.executeAction("updateScore", { args: { playerNumber: 0, newScore } }, (result) => {
        if (result.error) {
          console.log("Failed to update player 1 score:", result.errorMessage);
        } else {
          console.log(`Player 1 score updated to ${newScore}!`);
        }
      });
    }});
    ui.registerShortcut({ id: "bingoSync.updatePlayer2", text: "Update Player 2 Score", bindings: ["CTRL+2"], callback: () => {
      const newScore = Math.floor(Math.random() * 26);
      context.executeAction("updateScore", { args: { playerNumber: 1, newScore } }, (result) => {
        if (result.error) {
          console.log("Failed to update player 2 score:", result.errorMessage);
        } else {
          console.log(`Player 2 score updated to ${newScore}!`);
        }
      });
    }});
    ui.registerShortcut({ id: "bingoSync.updatePlayer3", text: "Update Player 3 Score", bindings: ["CTRL+3"], callback: () => {
      const newScore = Math.floor(Math.random() * 26);
      context.executeAction("updateScore", { args: { playerNumber: 2, newScore } }, (result) => {
        if (result.error) {
          console.log("Failed to update player 3 score:", result.errorMessage);
        } else {
          console.log(`Player 3 score updated to ${newScore}!`);
        }
      });
    }});
    ui.registerShortcut({ id: "bingoSync.updatePlayer4", text: "Update Player 4 Score", bindings: ["CTRL+4"], callback: () => {
      const newScore = Math.floor(Math.random() * 26);
      context.executeAction("updateScore", { args: { playerNumber: 3, newScore } }, (result) => {
        if (result.error) {
          console.log("Failed to update player 4 score:", result.errorMessage);
        } else {
          console.log(`Player 4 score updated to ${newScore}!`);
        }
      });
    }});
  
    // Footpath utilities
    ui.registerShortcut({ id: "bingoSync.listFootpathObjects", text: "List Footpath Surface Objects", bindings: ["CTRL+SHIFT+L"], callback: () => {
      footpathExtractor.listFootpathSurfaceObjects();
    }});
    ui.registerShortcut({ id: "bingoSync.inspectTiles", text: "Inspect Tiles (4,30) to (5,30) for Footpaths", bindings: ["CTRL+SHIFT+I"], callback: () => {
      footpathExtractor.inspectTilesForFootpaths(4, 30, 5, 30);
    }});
    ui.registerShortcut({ id: "bingoSync.getTarmacLocations", text: "Get Tarmac Footpath Locations", bindings: ["CTRL+SHIFT+T"], callback: () => {
      try {
        console.log("Scanning for Tarmac footpaths...");
        const tarmacFootpaths = footpathExtractor.extractFootpathsBySurfaceObjectIdentifier("rct2.footpath_surface.tarmac");
        const locations = footpathExtractor.generateFootpathLocationsBySurfaceObjectIdentifier("rct2.footpath_surface.tarmac", 1);
        console.log(`\n=== TARMAC FOOTPATH LOCATIONS ===`);
        console.log(`Found ${tarmacFootpaths.length} Tarmac footpath tiles`);
        console.log(`\nX,Y Coordinates:`);
        locations.forEach((location, index) => {
          console.log(`${index + 1}: (${location.x}, ${location.y})`);
        });
        console.log(`\nfootpath_locations = [`);
        locations.forEach((location, index) => {
          console.log(`  {`);
          console.log(`    "x": ${location.x},`);
          console.log(`    "y": ${location.y}`);
          console.log(`  }${index < locations.length - 1 ? ',' : ''}`);
        });
        console.log(`]`);
        console.log(`\n=== COPY THE ABOVE ARRAY TO YOUR CONSTANTS FILE ===\n`);
      } catch (error) {
        console.log("Error getting Tarmac footpath locations:", error);
      }
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
    // Debug tool shortcuts
    ui.registerShortcut({ id: "debug.start", text: "Start Debug Tool", bindings: ["CTRL+SHIFT+D"], callback: () => {
      debugTile.activate();
    }});
    ui.registerShortcut({ id: "debug.stop", text: "Stop Debug Tool", bindings: ["CTRL+SHIFT+E"], callback: () => {
      debugTile.deactivate();
    }});
    ui.registerShortcut({ id: "debug.viewport", text: "Show Viewport Info", bindings: ["CTRL+SHIFT+V"], callback: () => {
      debugTile.showViewportInfo();
    }});
    
    // Debug goal completion shortcut
    ui.registerShortcut({ id: "debug.completeGoal", text: "Debug: Complete Top-Left Goal", bindings: ["CTRL+SHIFT+G"], callback: () => {
      try {
        // Get the bingo board from the window
        const window = ui.getWindow("bingo-board");
        if (!window) {
          console.log("Bingo board window not found. Please open the bingo board first.");
          return;
        }
        
        // Get the board data from park storage
        const parkStorage = context.getParkStorage();
        const boardData = parkStorage.get('boardData', null);
        if (!boardData) {
          console.log("No board data found in park storage.");
          return;
        }
        
        const board = JSON.parse(boardData);
        const debugIndex = 0; // top-left of a 5x5 board
        const debugGoal = board[debugIndex];
        
        if (debugGoal) {
          debugGoal.colors = "red green";
          console.log("Debug: Setting colors to:", debugGoal.colors);
          
          if (debugGoal.status !== "completed") {
            const debugGoalKey = `goal_${debugGoal.slot || 1}`;
            debugGoal.status = "completed";
            console.log("Debug: Setting status to completed");
            setGoalCompletionStatus(debugGoalKey, true, debugGoal.name, () => {
              updateGoalUI(debugIndex, board);
            });
          } else {
            console.log("Debug: Goal already completed, just updating UI");
            updateGoalUI(debugIndex, board);
          }
          console.log("Debug: Forced completion of top-left goal.");
        } else {
          console.log("Debug: Goal not found");
        }
      } catch (e) {
        console.log("Debug: Error forcing top-left goal completion:", e);
      }
    }});
  }