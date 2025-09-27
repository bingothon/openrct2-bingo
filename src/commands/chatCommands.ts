import { GameManager } from "../managers/GameManager";
import { config } from "../config";

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
  context.subscribe("network.chat", (e) => {
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
    
    // Help command
    if (message === "/help" || message === "/commands") {
      const currentMode = config.gameMode;
      if (currentMode === "pvp" || currentMode === "lockout") {
        network.sendMessage("📋 Available commands: /register <color> (red, green, blue, yellow)");
      } else {
        network.sendMessage("📋 No special commands available in Coop mode");
      }
    }
  });
}
