import { debugTile } from "./debug-tile-tool";
import { footpathExtractor } from "./footpath-extractor";
import { BingoManager } from "../bingo/BingoManager";

export function registerDebugShortkeys(): void {
    if (typeof ui === 'undefined') return;
    
    const bingoManager = BingoManager.getInstance();
    
    // Test shortcuts for updating individual player scores (now based on actual goal completion)
    ui.registerShortcut({ id: "bingoSync.updatePlayer1", text: "Update Player 1 Score (Green)", bindings: ["CTRL+1"], callback: () => {
      bingoManager.updatePlayerScoreboard("player1");
      console.log("Updated Player 1 (Green) scoreboard based on completed goals");
    }});
    ui.registerShortcut({ id: "bingoSync.updatePlayer2", text: "Update Player 2 Score (Yellow)", bindings: ["CTRL+2"], callback: () => {
      bingoManager.updatePlayerScoreboard("player2");
      console.log("Updated Player 2 (Yellow) scoreboard based on completed goals");
    }});
    ui.registerShortcut({ id: "bingoSync.updatePlayer3", text: "Update Player 3 Score (Red)", bindings: ["CTRL+3"], callback: () => {
      bingoManager.updatePlayerScoreboard("player3");
      console.log("Updated Player 3 (Red) scoreboard based on completed goals");
    }});
    ui.registerShortcut({ id: "bingoSync.updatePlayer4", text: "Update Player 4 Score (Blue)", bindings: ["CTRL+4"], callback: () => {
      bingoManager.updatePlayerScoreboard("player4");
      console.log("Updated Player 4 (Blue) scoreboard based on completed goals");
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
      console.log("=== CLEARING GOALS ONLY ===");
      try {
        bingoManager.clearAllGoals();
        console.log("Goals cleared successfully");
      } catch (e) {
        console.log("Error clearing goals:", e);
      }
    }});
    
    ui.registerShortcut({ id: "debug.resetBoard", text: "Debug: Reset Board (Full Reset)", bindings: ["CTRL+ALT+X"], callback: () => {
      resetBoardCompletely();
    }});
    
    // New shortcuts for bingo management
    ui.registerShortcut({ id: "debug.showBingoInfo", text: "Debug: Show Bingo Info", bindings: ["CTRL+ALT+I"], callback: () => {
      console.log("Bingo Debug Info:", bingoManager.getDebugInfo());
    }});
    
    ui.registerShortcut({ id: "debug.showPlayers", text: "Debug: Show Players", bindings: ["CTRL+ALT+P"], callback: () => {
      const players = bingoManager.getAllPlayers();
      console.log("Registered Players:", players.map(p => `${p.name} (${p.color})`));
    }});
    
    ui.registerShortcut({ id: "debug.checkBoard", text: "Debug: Check Board Status", bindings: ["CTRL+ALT+O"], callback: () => {
      const bingo = bingoManager.getBingo();
      const state = bingo.getState();
      console.log("Board Status:", {
        gameMode: state.gameMode,
        boardLength: state.board.length,
        hasBoard: state.board.length > 0,
        firstGoal: state.board.length > 0 ? state.board[0] : null
      });
    }});
    
    // Test different goal slots
    ui.registerShortcut({ id: "debug.completeGoal2", text: "Debug: Complete Goal 2 (Red)", bindings: ["CTRL+ALT+2"], callback: () => {
      completeGoalWithColorAndSlot("red", "2");
    }});
    
    ui.registerShortcut({ id: "debug.completeGoal3", text: "Debug: Complete Goal 3 (Blue)", bindings: ["CTRL+ALT+3"], callback: () => {
      completeGoalWithColorAndSlot("blue", "3");
    }});
    
    // Game mode testing
    ui.registerShortcut({ id: "debug.setCoopMode", text: "Debug: Set Coop Mode", bindings: ["CTRL+ALT+Q"], callback: () => {
      bingoManager.setGameMode("coop");
      console.log("Game mode set to COOP - multiple players can select same goals");
    }});
    
    ui.registerShortcut({ id: "debug.setPvpMode", text: "Debug: Set PVP Mode", bindings: ["CTRL+ALT+W"], callback: () => {
      bingoManager.setGameMode("pvp");
      console.log("Game mode set to PVP - multiple players can select same goals, map divided");
    }});
    
    ui.registerShortcut({ id: "debug.setLockoutMode", text: "Debug: Set Lockout Mode", bindings: ["CTRL+ALT+E"], callback: () => {
      bingoManager.setGameMode("lockout");
      console.log("Game mode set to LOCKOUT - only one player can select each goal");
    }});
    
    // Test lockout behavior - try to complete same goal with different players
    ui.registerShortcut({ id: "debug.testLockout", text: "Debug: Test Lockout (Goal 4)", bindings: ["CTRL+ALT+Z"], callback: () => {
      testLockoutBehavior();
    }});
    
    // Scoreboard management shortcuts
    ui.registerShortcut({ id: "debug.createScoreboard", text: "Debug: Create Scoreboard", bindings: ["CTRL+ALT+S"], callback: () => {
      bingoManager.createScoreboard();
      console.log("Scoreboard created - use PVP/Lockout modes for automatic updates");
    }});
    
    ui.registerShortcut({ id: "debug.updateAllScores", text: "Debug: Update All Player Scores", bindings: ["CTRL+ALT+U"], callback: () => {
      bingoManager.updateAllPlayerScoreboards();
      console.log("All player scores updated on scoreboard");
    }});
    
    ui.registerShortcut({ id: "debug.clearScoreboard", text: "Debug: Clear Scoreboard", bindings: ["CTRL+ALT+K"], callback: () => {
      bingoManager.clearScoreboard();
      console.log("Scoreboard cleared");
    }});
    
    ui.registerShortcut({ id: "debug.randomGoal", text: "Debug: Random Goal for Random Player", bindings: ["CTRL+ALT+N"], callback: () => {
      completeRandomGoalForRandomPlayer();
    }});
    
    function completeGoalWithColor(colors: string) {
      completeGoalWithColorAndSlot(colors, "1");
    }
    
    function completeGoalWithColorAndSlot(colors: string, slot: string) {
      try {
        console.log(`Debug: Completing goal ${slot} using BingoManager...`);
        
        // Parse the colors string into an array
        const colorArray = colors.split(/[ ,]+/).filter(Boolean);
        console.log(`Debug: Colors to add: [${colorArray.join(", ")}]`);
        
        // Use ONLY the new BingoManager approach
        const success = bingoManager.completeGoalWithColors(slot, colorArray);
        
        if (success) {
          console.log(`Debug: Goal ${slot} completed successfully with colors: [${colorArray.join(", ")}]`);
        } else {
          console.log(`Debug: Failed to complete goal ${slot}`);
        }
        
      } catch (e) {
        console.log("Debug: Error completing goal:", e);
      }
    }
    
    function testLockoutBehavior() {
      console.log("=== TESTING LOCKOUT BEHAVIOR ===");
      
      // Ensure we're in lockout mode
      bingoManager.setGameMode("lockout");
      console.log("0. Set game mode to LOCKOUT");
      
      // First, clear goal 4 to start fresh using BingoManager
      console.log("1. Clearing goal 4 to start fresh...");
      bingoManager.clearAllGoals(); // This properly resets the Bingo class state
      
      // Wait a moment for the goal to be cleared, then try to complete it
      context.setTimeout(() => {
        // Try to complete goal 4 with red player
        console.log("2. Trying to complete goal 4 with RED player...");
        const success1 = bingoManager.completeGoalWithColors("4", ["red"]);
        console.log(`   Result: ${success1 ? "SUCCESS" : "FAILED"}`);
        
        // Wait a moment, then try to complete the same goal 4 with blue player
        context.setTimeout(() => {
          console.log("3. Trying to complete goal 4 with BLUE player...");
          const success2 = bingoManager.completeGoalWithColors("4", ["blue"]);
          console.log(`   Result: ${success2 ? "SUCCESS" : "FAILED"}`);
          
          // Check the final state
          const bingo = bingoManager.getBingo();
          const state = bingo.getState();
          
          // Find goal 4 using ES5 compatible method
          let goal4 = null;
          for (let i = 0; i < state.board.length; i++) {
            if (state.board[i].slot === "4") {
              goal4 = state.board[i];
              break;
            }
          }
          
          if (goal4) {
            console.log(`4. Final state of goal 4:`);
            console.log(`   Status: ${goal4.status}`);
            console.log(`   Colors: ${goal4.colors}`);
            console.log(`   Game Mode: ${state.gameMode}`);
          }
          
          // Show player stats
          console.log("5. Player Statistics:");
          const players = bingoManager.getAllPlayers();
          for (let i = 0; i < players.length; i++) {
            const player = players[i];
            const stats = bingoManager.getBingo().getPlayerStats(player.id);
            if (stats) {
              console.log(`   ${player.name} (${player.color}): ${stats.completedGoals} goals completed`);
            }
          }
          
          console.log("=== LOCKOUT TEST COMPLETE ===");
        }, 100);
      }, 100);
    }
    
    function completeRandomGoalForRandomPlayer() {
      console.log("=== RANDOM GOAL FOR RANDOM PLAYER ===");
      
      try {
        const bingo = bingoManager.getBingo();
        const state = bingo.getState();
        
        // Get all incomplete goals
        const incompleteGoals = [];
        for (let i = 0; i < state.board.length; i++) {
          if (state.board[i].status === "incomplete") {
            incompleteGoals.push(state.board[i]);
          }
        }
        
        if (incompleteGoals.length === 0) {
          console.log("No incomplete goals available!");
          return;
        }
        
        // Pick a random incomplete goal
        const randomGoalIndex = Math.floor(Math.random() * incompleteGoals.length);
        const randomGoal = incompleteGoals[randomGoalIndex];
        
        // Get all available players
        const players = bingoManager.getAllPlayers();
        if (players.length === 0) {
          console.log("No players available!");
          return;
        }
        
        // Pick a random player
        const randomPlayerIndex = Math.floor(Math.random() * players.length);
        const randomPlayer = players[randomPlayerIndex];
        
        console.log(`Random Goal: ${randomGoal.name} (Slot ${randomGoal.slot})`);
        console.log(`Random Player: ${randomPlayer.name} (${randomPlayer.color})`);
        
        // Complete the goal for the random player
        const success = bingoManager.completeGoalWithColors(randomGoal.slot || "1", [randomPlayer.color]);
        
        if (success) {
          console.log(`✅ Successfully completed goal ${randomGoal.slot} for ${randomPlayer.name}!`);
          
          // Show updated player stats
          const stats = bingo.getPlayerStats(randomPlayer.id);
          if (stats) {
            console.log(`📊 ${randomPlayer.name} now has ${stats.completedGoals} goals completed`);
          }
        } else {
          console.log(`❌ Failed to complete goal ${randomGoal.slot} for ${randomPlayer.name}`);
        }
        
      } catch (e) {
        console.log("Error completing random goal:", e);
      }
    }
    
    function resetBoardCompletely() {
      console.log("=== FULL BOARD RESET ===");
      
      try {
        // Use the BingoManager's reset method (which handles everything)
        bingoManager.resetBoard();
        
        console.log("Board completely reset - all goals cleared, UI updated, state reset");
        
      } catch (e) {
        console.log("Error during board reset:", e);
      }
    }
    
    
  }