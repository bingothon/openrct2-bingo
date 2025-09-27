import { debugTile } from "./debug-tile-tool";
import { footpathExtractor } from "./footpath-extractor";
import { BingoManager } from "../bingo/BingoManager";
import { GameManager } from "../managers/GameManager";

export function registerDebugShortkeys(): void {
    if (typeof ui === 'undefined') return;
    
    const bingoManager = BingoManager.getInstance();
    const gameManager = GameManager.getInstance();
    
    // COMMENTING OUT ALL SHORTCUTS EXCEPT BUILDING RESTRICTIONS DEBUG
    /*
    
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
    // ui.registerShortcut({ id: "debug.completeGoalRed", text: "Debug: Complete Top-Left Goal (Red)", bindings: ["CTRL+ALT+R"], callback: () => {
    //   completeGoalWithColor("red");
    // }});
    
    // ui.registerShortcut({ id: "debug.completeGoalGreen", text: "Debug: Complete Top-Left Goal (Green)", bindings: ["CTRL+ALT+G"], callback: () => {
    //   completeGoalWithColor("green");
    // }});
    
    // ui.registerShortcut({ id: "debug.completeGoalBlue", text: "Debug: Complete Top-Left Goal (Blue)", bindings: ["CTRL+ALT+B"], callback: () => {
    //   completeGoalWithColor("blue");
    // }});
    
    // ui.registerShortcut({ id: "debug.completeGoalYellow", text: "Debug: Complete Top-Left Goal (Yellow)", bindings: ["CTRL+ALT+Y"], callback: () => {
    //   completeGoalWithColor("yellow");
    // }});
    
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
    // COMMENTED OUT FOR DEBUGGING
    // ui.registerShortcut({ id: "debug.showBingoInfo", text: "Debug: Show Bingo Info", bindings: ["CTRL+ALT+I"], callback: () => {
    //   console.log("Bingo Debug Info:", bingoManager.getDebugInfo());
    // }});
    
    // COMMENTED OUT FOR DEBUGGING
    // ui.registerShortcut({ id: "debug.showPlayers", text: "Debug: Show Players", bindings: ["CTRL+ALT+P"], callback: () => {
    //   const players = bingoManager.getAllPlayers();
    //   console.log("Registered Players:", players.map(p => `${p.name} (${p.color})`));
    // }});
    
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
    // ui.registerShortcut({ id: "debug.completeGoal2", text: "Debug: Complete Goal 2 (Red)", bindings: ["CTRL+ALT+2"], callback: () => {
    //   completeGoalWithColorAndSlot("red", "2");
    // }});
    
    // ui.registerShortcut({ id: "debug.completeGoal3", text: "Debug: Complete Goal 3 (Blue)", bindings: ["CTRL+ALT+3"], callback: () => {
    //   completeGoalWithColorAndSlot("blue", "3");
    // }});
    
    // Game mode testing
    // ui.registerShortcut({ id: "debug.setCoopMode", text: "Debug: Set Coop Mode", bindings: ["CTRL+ALT+Q"], callback: () => {
    //   bingoManager.setGameMode("coop");
    //   console.log("Game mode set to COOP - multiple players can select same goals");
    // }});
    
    // ui.registerShortcut({ id: "debug.setPvpMode", text: "Debug: Set PVP Mode", bindings: ["CTRL+ALT+W"], callback: () => {
    //   bingoManager.setGameMode("pvp");
    //   console.log("Game mode set to PVP - multiple players can select same goals, map divided");
    // }});
    
    ui.registerShortcut({ id: "debug.setLockoutMode", text: "Debug: Set Lockout Mode", bindings: ["CTRL+ALT+E"], callback: () => {
      bingoManager.setGameMode("lockout");
      console.log("Game mode set to LOCKOUT - only one player can select each goal");
    }});
    
    // // Test lockout behavior - try to complete same goal with different players
    // ui.registerShortcut({ id: "debug.testLockout", text: "Debug: Test Lockout (Goal 4)", bindings: ["CTRL+ALT+Z"], callback: () => {
    //   testLockoutBehavior();
    // }});
    
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
    
    // COMMENTED OUT FOR DEBUGGING
    // ui.registerShortcut({ id: "debug.randomGoal", text: "Debug: Random Goal for Random Player", bindings: ["CTRL+ALT+N"], callback: () => {
    //   completeRandomGoalForRandomPlayer();
    // }});
    
    // GameManager debug shortcuts
    ui.registerShortcut({ id: "debug.gameManagerInfo", text: "Debug: Show GameManager Info", bindings: ["CTRL+ALT+M"], callback: () => {
      console.log("=== GAME MANAGER DEBUG INFO ===");
      console.log(gameManager.getDebugInfo());
    }});
    
    ui.registerShortcut({ id: "debug.testBuildingRestriction", text: "Debug: Test Building Restriction", bindings: ["CTRL+ALT+T"], callback: () => {
      testBuildingRestriction();
    }});
    
    ui.registerShortcut({ id: "debug.toggleBuildingRestrictions", text: "Debug: Toggle Building Restrictions", bindings: ["CTRL+ALT+R"], callback: () => {
      toggleBuildingRestrictions();
    }});
    
    ui.registerShortcut({ id: "debug.testTileRegion", text: "Debug: Test Tile Region (64,64)", bindings: ["CTRL+ALT+J"], callback: () => {
      testTileRegion(64, 64);
    }});
    
    ui.registerShortcut({ id: "debug.initializeGameManager", text: "Debug: Initialize GameManager", bindings: ["CTRL+ALT+I"], callback: () => {
      console.log("=== MANUALLY INITIALIZING GAME MANAGER ===");
      gameManager.initializeGame();
      console.log("GameManager initialization completed. Debug info:");
      console.log(gameManager.getDebugInfo());
    }});
    
    
    
    */
    ui.registerShortcut({ id: "debug.showCurrentPlayer", text: "Debug: Show Current Player Assignment", bindings: ["CTRL+ALT+P"], callback: () => {
      showCurrentPlayerAssignment();
    }});
    // ONLY KEEPING THE BUILDING RESTRICTIONS DEBUG SHORTCUTS
    ui.registerShortcut({ id: "debug.testBuildingRestrictions", text: "Debug: Test Building Restrictions", bindings: ["CTRL+ALT+B"], callback: () => {
      testBuildingRestrictions();
    }});
    
    ui.registerShortcut({ id: "debug.forceEnableRestrictions", text: "Debug: Force Enable Building Restrictions", bindings: ["CTRL+ALT+F"], callback: () => {
      console.log("=== FORCE ENABLING BUILDING RESTRICTIONS ===");
      gameManager.setGameMode("lockout");
      console.log("=== END FORCE ENABLE ===");
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
    
    function testBuildingRestriction() {
      console.log("=== TESTING BUILDING RESTRICTION ===");
      
      // Test different tiles and players
      const testCases = [
        { tile: { x: 32, y: 32 }, player: "1", description: "Player 1 (red) in top-left region" },
        { tile: { x: 96, y: 32 }, player: "2", description: "Player 2 (green) in top-right region" },
        { tile: { x: 32, y: 96 }, player: "3", description: "Player 3 (blue) in bottom-left region" },
        { tile: { x: 96, y: 96 }, player: "4", description: "Player 4 (yellow) in bottom-right region" },
        { tile: { x: 64, y: 64 }, player: "1", description: "Player 1 trying to build in center (neutral)" },
        { tile: { x: 5, y: 5 }, player: "2", description: "Player 2 trying to build in corner marker area" }
      ];
      
      testCases.forEach((testCase, index) => {
        const canBuild = gameManager.canPlayerBuildAtTile(testCase.player, testCase.tile);
        const region = gameManager.getTileRegion(testCase.tile);
        const playerRegion = gameManager.getPlayerRegion(testCase.player);
        
        console.log(`${index + 1}. ${testCase.description}`);
        console.log(`   Tile: (${testCase.tile.x}, ${testCase.tile.y})`);
        console.log(`   Tile Region: ${region || 'neutral/outside'}`);
        console.log(`   Player Region: ${playerRegion || 'none'}`);
        console.log(`   Can Build: ${canBuild ? '✅ YES' : '❌ NO'}`);
        console.log('');
      });
    }
    
    function toggleBuildingRestrictions() {
      console.log("=== TOGGLING BUILDING RESTRICTIONS ===");
      
      // This is a simple toggle - in a real implementation you might want to track state
      // For now, we'll just show current status and suggest manual toggling
      console.log("Current building restrictions status:");
      console.log("- Use gameManager.enableBuildingRestrictions() to enable");
      console.log("- Use gameManager.disableBuildingRestrictions() to disable");
      console.log("- Use gameManager.setGameMode('coop'|'pvp'|'lockout') to configure automatically");
      
      // Show current game mode from config
      const currentMode = bingoManager.getBingo().getState().gameMode;
      console.log(`Current game mode: ${currentMode}`);
      
      if (currentMode === 'coop') {
        console.log("Coop mode: Building restrictions should be DISABLED");
      } else if (currentMode === 'pvp' || currentMode === 'lockout') {
        console.log(`${currentMode} mode: Building restrictions should be ENABLED`);
      }
    }
    
    function testTileRegion(x: number, y: number) {
      console.log(`=== TESTING TILE REGION (${x}, ${y}) ===`);
      
      const region = gameManager.getTileRegion({ x, y });
      const groundState = gameManager.getGroundDivisionManager().getState();
      
      console.log(`Tile coordinates: (${x}, ${y})`);
      console.log(`Region: ${region || 'neutral/outside'}`);
      console.log(`Map size: ${groundState.mapWidthTiles}x${groundState.mapHeightTiles}`);
      console.log(`Center: (${groundState.centerTileX}, ${groundState.centerTileY})`);
      
      if (region) {
        const regionData = gameManager.getGroundDivisionManager().getRegion(region);
        console.log(`Region bounds: (${regionData.x1},${regionData.y1}) to (${regionData.x2},${regionData.y2})`);
      }
      
      // Test if tile is in divided area
      const isInDividedArea = gameManager.getGroundDivisionManager().isTileInDividedArea({ x, y });
      console.log(`In divided area: ${isInDividedArea ? 'YES' : 'NO'}`);
    }
    
    function showCurrentPlayerAssignment() {
      console.log("=== CURRENT PLAYER ASSIGNMENT DEBUG ===");
      
      // Get all registered players
      const allPlayers = gameManager.getAllPlayers();
      console.log(`Total registered players: ${allPlayers.length}`);
      
      // Show all registered players and their assignments
      console.log(`Registered players:`);
      for (let i = 0; i < allPlayers.length; i++) {
        const player = allPlayers[i];
        console.log(`   ${i + 1}. ${player.name} (${player.colour}): ${player.region} [ID: ${player.id}]`);
        
        // Show region details for each player
        const regionData = gameManager.getGroundDivisionManager().getRegion(player.region);
        console.log(`      Region bounds: (${regionData.x1},${regionData.y1}) to (${regionData.x2},${regionData.y2})`);
      }
      
      // Show game mode and building restrictions status
      const debugInfo = gameManager.getDebugInfo();
      const restrictionsMatch = debugInfo.match(/Building restrictions: (enabled|disabled)/);
      const restrictionsStatus = restrictionsMatch ? restrictionsMatch[1] : 'unknown';
      console.log(`Building restrictions: ${restrictionsStatus}`);
      console.log(`Game mode: ${restrictionsStatus === 'enabled' ? 'PVP/Lockout' : 'Coop'}`);
      
      // Show ground division info
      const groundState = gameManager.getGroundDivisionManager().getState();
      console.log(`Map size: ${groundState.mapWidthTiles}x${groundState.mapHeightTiles}`);
      console.log(`Center: (${groundState.centerTileX}, ${groundState.centerTileY})`);
      
      console.log("=== END PLAYER ASSIGNMENT DEBUG ===");
    }
    
    function testBuildingRestrictions() {
      console.log("=== BUILDING RESTRICTIONS DEBUG ===");
      
      const gameManager = GameManager.getInstance();
      
      // 0. Set game mode to lockout
      console.log("0. Setting game mode to LOCKOUT");
      gameManager.setGameMode("lockout");
      
      // 1. Force set initializing to false
      console.log("1. Setting initializing to false");
      gameManager.setInitializing(false);
      
      // 2. Set game mode to enable building restrictions
      console.log("2. Setting game mode to enable building restrictions");
      gameManager.setGameMode("lockout");
      
      // 3. Show current state
      console.log("3. Current state:");
      console.log(`   - Game mode: LOCKOUT`);
      console.log(`   - Initializing: ${gameManager.isGameInitializing()}`);
      console.log(`   - Building restrictions: ${gameManager.getDebugInfo().indexOf('enabled') !== -1 ? 'ENABLED' : 'DISABLED'}`);
      console.log(`   - Registered players: ${gameManager.getAllPlayers().length}`);
      
      // 4. Register current player as RED
      console.log("4. Registering current player as RED");
      const currentPlayerId = "0"; // Server player for testing
      gameManager.registerPlayer(currentPlayerId, "Player 1", "red", "top-left");
      console.log("   ✅ Registered Player 0 (red) in top-left region");
      
      // 5. Instructions for testing
      console.log("5. TESTING INSTRUCTIONS:");
      console.log("   a) Try building in TOP-LEFT region (1,1 to 64,64) - should be ALLOWED");
      console.log("   b) Try building in TOP-RIGHT region (65,1 to 128,64) - should be BLOCKED");
      console.log("   c) Check console logs for building restriction messages");
      
      console.log("=== END BUILDING RESTRICTIONS DEBUG ===");
    }
    
    
    
  }