import { GameManager } from "../managers/GameManager";
import { ScoreManager } from "../managers/ScoreManager";
import { config } from "../config";
import { runTestSuite, runTestsByCategory } from "../testing/index";
import { updateScore } from "../bingo/notifications/scoreboard";
import { COLOR_TO_REGION } from "../bingo/playerColours";
import { formatMoney, getBudget } from "../bingo/budgets";
import { canRequestServerRestart, requestServerRestart } from "../bingo/bingosync-handler";


const RESTART_DELAY_MS = 10_000;

/** Admins: players in a group that may kick players (the Admin group) */
function isAdmin(playerId: number): boolean {
  try {
    const group = network.getGroup(network.getPlayer(playerId).group);
    return !!group && group.permissions.indexOf("kick_player") !== -1;
  } catch (error) {
    return false;
  }
}

export function registerChatCommands(): void {
  if (typeof context === 'undefined') return;
  
  const gameManager = GameManager.getInstance();
  const scoreManager = ScoreManager.getInstance();
  
  // Subscribe to chat messages
  context.subscribe("network.chat", (e) => {
    const message = e.message.toLowerCase().trim();
    
    // Check if it's a register command
    if (message.indexOf("/register ") === 0 && network.mode === "server") {
      const color = message.substring(9).trim(); // Remove "/register " prefix

      // Same action the region picker uses, run by the server on behalf of the chatting player
      context.executeAction("registerPlayer", { args: { colour: color, playerId: e.player } }, (result) => {
        if (result.error) {
          network.sendMessage(`❌ ${result.errorMessage}`);
        }
      });
    }
    
    // Budget of the chatting player (PvP/Lockout)
    if (message === "/budget" && network.mode === "server") {
      const player = gameManager.getPlayer(e.player.toString());
      if (!player) {
        network.sendMessage("💰 Pick your region first to get a budget.", [e.player]);
        return;
      }
      const budget = getBudget(player.colour);
      network.sendMessage(
        `💰 ${player.colour.toUpperCase()}: ${formatMoney(budget.left)} left ` +
        `(share ${formatMoney(budget.share)} + your rides' profit ${formatMoney(budget.income)} - spent ${formatMoney(budget.spent)})`,
        [e.player]
      );
      return;
    }

    // Restart this server with a fresh game (admins only, needs the server manager)
    if (message === "/restart" && network.mode === "server") {
      if (!isAdmin(e.player)) {
        network.sendMessage("❌ Only admins can restart the server.", [e.player]);
        return;
      }
      if (!canRequestServerRestart()) {
        network.sendMessage("❌ This server isn't run by the server manager - restart it by hand.", [e.player]);
        return;
      }
      network.sendMessage(`♻️ Restarting the server for a new game in ${RESTART_DELAY_MS / 1000} seconds - rejoin afterwards!`);
      context.setTimeout(() => {
        if (!requestServerRestart()) {
          network.sendMessage("❌ Lost the connection to the server manager - restart the server by hand.");
        }
      }, RESTART_DELAY_MS);
      return;
    }

    // Test command - only available in debug mode
    if (message.indexOf("/test ") === 0 && config.debug) {
      const testTarget = message.substring(6).trim(); // Remove "/test " prefix
      
      if (!testTarget) {
        network.sendMessage("🧪 Usage: /test <testname>");
        network.sendMessage("📋 Available tests:");

        network.sendMessage("  • gamemanager, buildingrestrictions, gamemode, scoremanager");
        network.sendMessage("  • unit, integration, restrictions, scores, all");
        network.sendMessage("  • GameManager.test, BuildingRestrictions.test, GameModeIntegration.test, ScoreManager.test");
        return;
      }
      
      network.sendMessage(`🧪 Running test: ${testTarget}`);
      
      try {
        // Handle different test targets
        if (testTarget === "all") {
          runTestsByCategory("all");
        } else if (testTarget === "unit") {
          runTestsByCategory("unit");
        } else if (testTarget === "integration") {
          runTestsByCategory("integration");
        } else if (testTarget === "restrictions") {
          runTestsByCategory("restrictions");
        } else if (testTarget === "GameManager.test" || testTarget === "gamemanager") {
          runTestSuite("gamemanager");
        } else if (testTarget === "BuildingRestrictions.test" || testTarget === "buildingrestrictions") {
          runTestSuite("buildingrestrictions");
        } else if (testTarget === "GameModeIntegration.test" || testTarget === "gamemode") {
          runTestSuite("gamemode");
        } else if (testTarget === "ScoreManager.test" || testTarget === "scoremanager") {
          runTestSuite("scoremanager");
        } else {
          // Try to run as a specific test suite
          runTestSuite(testTarget);
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
        helpMessage += " /budget";
      }
      if (isAdmin(e.player)) {
        helpMessage += " /restart (admins)";
      }
      
      if (config.debug) {
        helpMessage += " /test <testname> (see /test for full list)";
        helpMessage += " /addscore <target> <delta>";
        helpMessage += " /setscore <target> <score>";
        helpMessage += " /getscore <target>";
        helpMessage += " /clearscore <color>";
      }
      
      if (helpMessage === "📋 Available commands:") {
        helpMessage = "📋 No special commands available in this mode";
      }
      
      network.sendMessage(helpMessage);
    }

    // Clear score command (server-only; available when debug enabled)
    if (config.debug && message.indexOf("/clearscore ") === 0) {
      if (network.mode !== 'server') {
        network.sendMessage("❌ Score commands can only be used on the server.");
        return;
      }

      const color = message.substring(12).trim();
      const slot = ScoreManager.getScoreboardSlotForColour(color);

      if (slot === null) {
        network.sendMessage(`🧹 Usage: /clearscore <color> (${Object.keys(COLOR_TO_REGION).join(", ")})`);
        return;
      }

      try {
        // If someone is registered with this color, reset their stored score too -
        // otherwise the next /addscore would continue from the old value
        const all = gameManager.getAllPlayers();
        let playerId: string | null = null;
        for (let i = 0; i < all.length; i++) {
          if (all[i].colour === color) {
            playerId = all[i].id;
            break;
          }
        }

        if (playerId) {
          // updatePlayerScore also redraws the scoreboard and stores the score
          scoreManager.updatePlayerScore(playerId, -scoreManager.getPlayerScore(playerId));
          network.sendMessage(`✅ ${color} score reset to 0 and scoreboard cleared!`);
        } else {
          updateScore(slot, 0);
          network.sendMessage(`✅ ${color} scoreboard region cleared (no ${color} player registered).`);
        }
      } catch (error) {
        network.sendMessage(`❌ Failed to clear ${color} score: ${error instanceof Error ? error.message : String(error)}`);
      }
      return;
    }

    // Score commands (server-only; available when debug enabled)
    if (config.debug && (message.indexOf("/addscore ") === 0 || message.indexOf("/setscore ") === 0 || message.indexOf("/getscore ") === 0)) {
      if (network.mode !== 'server') {
        network.sendMessage("❌ Score commands can only be used on the server.");
        return;
      }

      // Helper to resolve a target to playerId
      const resolvePlayerId = (target: string): string | null => {
        const all = gameManager.getAllPlayers();
        // color
        if (COLOR_TO_REGION[target]) {
          for (let i = 0; i < all.length; i++) {
            if (all[i].colour === target) return all[i].id;
          }
          return null;
        }
        // index (0-based or 1-based)
        const asNum = parseInt(target, 10);
        if (!isNaN(asNum)) {
          const idx = (asNum >= 1 && asNum <= all.length) ? (asNum - 1) : asNum;
          if (idx >= 0 && idx < all.length) return all[idx].id;
        }
        // direct id match
        for (let i = 0; i < all.length; i++) {
          if (all[i].id === target) return all[i].id;
        }
        return null;
      };

      if (message.indexOf("/getscore ") === 0) {
        const target = message.substring(10).trim();
        if (!target) {
          network.sendMessage("🧮 Usage: /getscore <color|index|id>");
          return;
        }
        const playerId = resolvePlayerId(target);
        if (!playerId) {
          network.sendMessage("❌ Could not resolve target player.");
          return;
        }
        const current = scoreManager.getPlayerScore(playerId);
        network.sendMessage(`🧮 Score for ${playerId}: ${current}`);
        return;
      }

      if (message.indexOf("/addscore ") === 0) {
        const rest = message.substring(10).trim();
        const parts = rest.split(/\s+/);
        if (parts.length < 2) {
          network.sendMessage("➕ Usage: /addscore <color|index|id> <delta>");
          return;
        }
        const playerId = resolvePlayerId(parts[0]);
        const delta = parseInt(parts[1], 10);
        if (!playerId || isNaN(delta)) {
          network.sendMessage("❌ Invalid target or delta.");
          return;
        }
        scoreManager.updatePlayerScore(playerId, delta);
        const updated = scoreManager.getPlayerScore(playerId);
        network.sendMessage(`✅ Added ${delta} to ${playerId}. New score: ${updated}`);
        return;
      }

      if (message.indexOf("/setscore ") === 0) {
        const rest = message.substring(10).trim();
        const parts = rest.split(/\s+/);
        if (parts.length < 2) {
          network.sendMessage("🛠️ Usage: /setscore <color|index|id> <score>");
          return;
        }
        const playerId = resolvePlayerId(parts[0]);
        const desired = parseInt(parts[1], 10);
        if (!playerId || isNaN(desired)) {
          network.sendMessage("❌ Invalid target or score.");
          return;
        }
        const current = scoreManager.getPlayerScore(playerId);
        const delta = desired - current;
        scoreManager.updatePlayerScore(playerId, delta);
        const updated = scoreManager.getPlayerScore(playerId);
        network.sendMessage(`✅ Set score for ${playerId} to ${updated}`);
        return;
      }
    }
  });
}
