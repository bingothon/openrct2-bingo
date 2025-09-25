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
    
    // Debug goal completion shortcuts for different colors
    ui.registerShortcut({ id: "debug.completeGoalRed", text: "Debug: Complete Top-Left Goal (Red)", bindings: ["CTRL+ALT+R"], callback: () => {
      completeGoalWithColor("red");
    }});
    
    ui.registerShortcut({ id: "debug.completeGoalGreen", text: "Debug: Complete Top-Left Goal (Green)", bindings: ["CTRL+ALT+G"], callback: () => {
      completeGoalWithColor("green");
    }});
    
    ui.registerShortcut({ id: "debug.completeGoalBlue", text: "Debug: Complete Top-Left Goal (Blue)", bindings: ["CTRL+ALT+B"], callback: () => {
      completeGoalWithColor("blue");
    }});
    
    ui.registerShortcut({ id: "debug.completeGoalYellow", text: "Debug: Complete Top-Left Goal (Yellow)", bindings: ["CTRL+ALT+Y"], callback: () => {
      completeGoalWithColor("yellow");
    }});
    
    ui.registerShortcut({ id: "debug.completeGoalAll", text: "Debug: Complete Top-Left Goal (All Colors)", bindings: ["CTRL+ALT+A"], callback: () => {
      completeGoalWithColor("red green blue yellow");
    }});
    
    ui.registerShortcut({ id: "debug.clearAllGoals", text: "Debug: Clear All Goals", bindings: ["CTRL+ALT+C"], callback: () => {
      clearAllGoals();
    }});
    
    function completeGoalWithColor(colors: string) {
      try {
        // Get the bingo board from the window
        const window = ui.getWindow("bingo-board");
        if (!window) {
          console.log("Bingo board window not found. Please open the bingo board first.");
          return;
        }
        
        console.log("Debug: Trying to complete top-left goal...");
        
        const parkStorage = context.getParkStorage();
        const debugGoalKey = "goal_1"; // Top-left goal should be slot 1
        const debugGoalName = "Debug Goal";
        
        // Check if goal already exists and get current colors
        const isAlreadyCompleted = parkStorage.get(debugGoalKey, false);
        const currentColorsData = parkStorage.get(`${debugGoalKey}_colors`, "[]");
        
        console.log(`Debug: Goal ${debugGoalKey} already completed: ${isAlreadyCompleted}`);
        console.log(`Debug: Current colors data: "${currentColorsData}"`);
        console.log(`Debug: New colors: "${colors}"`);
        
        // Parse current colors as JSON array, fallback to empty array
        let existingColors = [];
        try {
          existingColors = JSON.parse(currentColorsData);
        } catch (e) {
          // If parsing fails, treat as empty array
          existingColors = [];
          console.log("Debug: Failed to parse existing colors, defaulting to []", e);
        }
        
        // Add new colors to existing ones, but ensure uniqueness so a player/color is only added once
        const newColors = colors.split(/[ ,]+/).filter(Boolean);
        const allColors = unionUnique(existingColors, newColors);
        
        console.log(`Debug: Existing colors: [${existingColors.join(", ")}]`);
        console.log(`Debug: New colors: [${newColors.join(", ")}]`);
        console.log(`Debug: All colors: [${allColors.join(", ")}]`);
        
        // Store the colors as JSON array in park storage (unique list)
        const colorsKey = `${debugGoalKey}_colors`;
        parkStorage.set(colorsKey, JSON.stringify(allColors));
        console.log(`Debug: Stored colors array: [${allColors.join(", ")}] for key '${colorsKey}'`);
        
        // Set the goal as completed
        setGoalCompletionStatus(debugGoalKey, true, debugGoalName, () => {
          console.log("Debug: Goal completion status set successfully");
          console.log(`Debug: Goal completed with colors: [${allColors.join(", ")}]`);
          
          // Update the UI label for slot1 by prepending checks to existing text
          try {
            const window = ui.getWindow("bingo-board");
            if (window) {
              const btn = window.findWidget<ButtonWidget>("slot1");
              const label = window.findWidget<LabelWidget>("slot1_text");
              if (btn && label) {
                btn.isPressed = true;
                btn.border = false;
                const currentText = label.text || "";
                const stripped = stripExistingChecks(currentText);
                const checks = buildChecksPrefixFromArray(allColors);
                label.text = `${checks}${stripped}`;
                label.textAlign = "centred";
                console.log("Debug: UI label for slot1 updated successfully.");
              } else {
                console.log("Debug: slot1 widgets not found to update UI.");
              }
            } else {
              console.log("Debug: bingo-board window not found for UI update.");
            }
          } catch (uiErr) {
            console.log("Debug: Error updating UI label:", uiErr);
          }
        });
        
      } catch (e) {
        console.log("Debug: Error forcing top-left goal completion:", e);
      }
    }
    
    // Remove any existing coloured checkmark prefix from a label text
    function stripExistingChecks(text: string): string {
      try {
        return text.replace(/^(?:\{[A-Z]+\}✓\{BLACK\})+\n?/, "");
      } catch (e) {
        return text;
      }
    }

    // Merge arrays with uniqueness without using Set (ES5 compatible)
    function unionUnique(existing: string[], incoming: string[]): string[] {
      const seen: { [key: string]: boolean } = {};
      const result: string[] = [];
      function addIfNew(value: string) {
        const key = value.toLowerCase();
        if (!seen[key]) {
          seen[key] = true;
          result.push(value);
        }
      }
      for (var i = 0; i < existing.length; i++) addIfNew(existing[i]);
      for (var j = 0; j < incoming.length; j++) addIfNew(incoming[j]);
      return result;
    }
    
    function buildChecksPrefix(colors: string | undefined): string {
      if (!colors || colors === "blank") return "";
      const parts = colors.split(/[ ,]+/).filter(Boolean);
      const tokens = parts.map((c) => colourTokenForName(c.toLowerCase())).filter(Boolean) as string[];
      if (tokens.length === 0) return "";
      let prefix = "";
      for (const t of tokens) {
        prefix += `{${t}}✓{BLACK}`;
      }
      return prefix + "\n";
    }
    
    function buildChecksPrefixFromArray(colors: string[]): string {
      if (!colors || colors.length === 0) return "";
      const tokens = colors.map((c) => colourTokenForName(c.toLowerCase())).filter(Boolean) as string[];
      if (tokens.length === 0) return "";
      let prefix = "";
      for (const t of tokens) {
        prefix += `{${t}}✓{BLACK}`;
      }
      return prefix + "\n";
    }
    
    function colourTokenForName(name: string): string | null {
      switch (name) {
        case "red": return "RED";
        case "blue": return "BLUE";
        case "green": return "GREEN";
        case "yellow": return "YELLOW";
        case "purple": return "PURPLE";
        case "orange": return "ORANGE";
        case "white": return "WHITE";
        case "black": return "BLACK";
        default: return null;
      }
    }
    
    function clearAllGoals() {
      try {
        console.log("Debug: Clearing all goals...");
        
        const parkStorage = context.getParkStorage();
        
        // Clear all goal completion statuses and colors
        for (let i = 1; i <= 25; i++) {
          const goalKey = `goal_${i}`;
          const colorsKey = `${goalKey}_colors`;
          
          // Set goal as incomplete
          parkStorage.set(goalKey, false);
          // Remove colors (set to empty array)
          parkStorage.set(colorsKey, "[]");
        }
        
        console.log("Debug: All goals cleared successfully!");
        
        // Force UI update for all slots
        const window = ui.getWindow("bingo-board");
        if (window) {
          for (let i = 1; i <= 25; i++) {
            const btn = window.findWidget<ButtonWidget>(`slot${i}`);
            const label = window.findWidget<LabelWidget>(`slot${i}_text`);
            
            if (btn && label) {
              // Reset button to incomplete state
              btn.isPressed = false;
              btn.border = true;
              
              // Reset label text (we need the original goal name, but we'll use a placeholder)
              label.text = `Goal ${i}`;
              label.textAlign = "centred";
            }
          }
          console.log("Debug: UI updated to show all goals as incomplete");
        } else {
          console.log("Debug: Bingo board window not found, cannot update UI");
        }
        
      } catch (e) {
        console.log("Debug: Error clearing all goals:", e);
      }
    }
  }