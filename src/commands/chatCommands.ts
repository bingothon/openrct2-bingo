import { GameManager } from "../managers/GameManager";
import { config } from "../config";
import { runTestSuite, runTestsByCategory } from "../testing/index";

// Color to region mapping - matches scoreboard layout
const COLOR_TO_REGION: Record<string, { region: string; name: string }> = {
  "red": { region: "top-left", name: "Player 1" },    // Green in top-left
  "blue": { region: "top-right", name: "Player 2" }, // Yellow in top-right  
  "green": { region: "bottom-left", name: "Player 3" },  // Red in bottom-left
  "yellow": { region: "bottom-right", name: "Player 4" } // Blue in bottom-right
};

export function registerChatCommands(): void {
  if (typeof context === 'undefined') return;
  
  const gameManager = GameManager.getInstance();
  
  // Subscribe to chat messages
  context.subscribe("network.chat", async (e) => {
    const message = e.message.toLowerCase().trim();
    
    // Check if it's a register command
    if (message.indexOf("/register ") === 0) {
      const color = message.substring(9).trim(); // Remove "/register " prefix
      
      // Only allow in PVP or Lockout modes
      const currentMode = config.gameMode;
      if (currentMode !== "pvp" && currentMode !== "lockout") {
        network.sendMessage("❌ Player registration is only available in PVP or Lockout modes!");
        return;
      }
      
      // Validate color
      if (!COLOR_TO_REGION[color]) {
        const availableColors = Object.keys(COLOR_TO_REGION).join(", ");
        network.sendMessage(`❌ Invalid color! Available colors: ${availableColors}`);
        return;
      }
      
      // Check if color is already taken
      const allPlayers = gameManager.getAllPlayers();
      let existingPlayer = null;
      for (let i = 0; i < allPlayers.length; i++) {
        if (allPlayers[i].colour === color) {
          existingPlayer = allPlayers[i];
          break;
        }
      }
      
      if (existingPlayer) {
        network.sendMessage(`❌ Color ${color} is already taken by ${existingPlayer.name}!`);
        return;
      }
      
      // Check if player is already registered
      const playerId = e.player.toString();
      const existingRegistration = gameManager.getPlayer(playerId);
      
      if (existingRegistration) {
        network.sendMessage(`❌ You are already registered as ${existingRegistration.name} (${existingRegistration.colour})!`);
        return;
      }
      
      // Register the player
      const regionData = COLOR_TO_REGION[color];
      gameManager.registerPlayer(playerId, regionData.name, color, regionData.region as any);
      
      // Send success message
      network.sendMessage(`✅ ${regionData.name} (${color}) registered in ${regionData.region} region!`);
      
      // Show updated player list to all players
      const updatedPlayers = gameManager.getAllPlayers();
      let playerList = "";
      for (let i = 0; i < updatedPlayers.length; i++) {
        if (i > 0) playerList += ", ";
        playerList += `${updatedPlayers[i].name} (${updatedPlayers[i].colour})`;
      }
      network.sendMessage(`📋 Registered players: ${playerList}`);
    }
    
    // Test command - only available in debug mode
    if (message.indexOf("/test ") === 0 && config.debug) {
      const testTarget = message.substring(6).trim(); // Remove "/test " prefix
      
      if (!testTarget) {
        network.sendMessage("🧪 Usage: /test <testname>");
        network.sendMessage("📋 Available tests:");
        network.sendMessage("  • gamemanager, buildingrestrictions, gamemode");
        network.sendMessage("  • unit, integration, restrictions, all");
        network.sendMessage("  • GameManager.test, BuildingRestrictions.test, GameModeIntegration.test");
        return;
      }
      
      network.sendMessage(`🧪 Running test: ${testTarget}`);
      
      try {
        // Handle different test targets
        if (testTarget === "all") {
          await runTestsByCategory("all");
        } else if (testTarget === "unit") {
          await runTestsByCategory("unit");
        } else if (testTarget === "integration") {
          await runTestsByCategory("integration");
        } else if (testTarget === "restrictions") {
          await runTestsByCategory("restrictions");
        } else if (testTarget === "GameManager.test" || testTarget === "gamemanager") {
          await runTestSuite("gamemanager");
        } else if (testTarget === "BuildingRestrictions.test" || testTarget === "buildingrestrictions") {
          await runTestSuite("buildingrestrictions");
        } else if (testTarget === "GameModeIntegration.test" || testTarget === "gamemode") {
          await runTestSuite("gamemode");
        } else {
          // Try to run as a specific test suite
          await runTestSuite(testTarget);
        }
        
        network.sendMessage(`✅ Test '${testTarget}' completed! Check console for results.`);
      } catch (error) {
        network.sendMessage(`❌ Test '${testTarget}' failed: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    
    // Help command
    if (message === "/help" || message === "/commands") {
      const currentMode = config.gameMode;
      let helpMessage = "📋 Available commands:";
      
      if (currentMode === "pvp" || currentMode === "lockout") {
        helpMessage += " /register <color> (red, green, blue, yellow)";
      }
      
      if (config.debug) {
        helpMessage += " /test <testname> (see /test for full list)";
      }
      
      if (helpMessage === "📋 Available commands:") {
        helpMessage = "📋 No special commands available in this mode";
      }
      
      network.sendMessage(helpMessage);
    }
  });
}
