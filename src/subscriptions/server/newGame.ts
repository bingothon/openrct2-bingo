import { config } from "../../config";
import { isManagedServer, requestServerRestart } from "../../bingo/bingosync-handler";

const MINUTE_MS = 60_000;
let scheduled = false;

/**
 * Managed servers: once a game is over, ask the server manager for a fresh game after
 * config.newGameDelayMinutes, so players can read the result first. Players rejoin afterwards.
 */
export function scheduleNewGame(): void {
    if (scheduled || network.mode !== "server" || !isManagedServer()) return;
    scheduled = true;

    const minutes = config.newGameDelayMinutes;
    network.sendMessage(`♻️ A new game starts in ${minutes} minutes - rejoin the server then!`);
    if (minutes > 1) {
        context.setTimeout(() => {
            network.sendMessage("♻️ A new game starts in 1 minute - rejoin the server then!");
        }, (minutes - 1) * MINUTE_MS);
    }
    context.setTimeout(() => {
        if (!requestServerRestart()) {
            console.log("[NewGame] Couldn't reach the server manager for a new game");
            network.sendMessage("❌ Couldn't start a new game automatically - an admin can type /restart.");
        }
    }, minutes * MINUTE_MS);
}
