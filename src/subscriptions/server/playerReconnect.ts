import { subscriptions } from "../manager";
import { GameManager } from "../../managers/GameManager";
import { ScoreManager } from "../../managers/ScoreManager";
import { getPlayerIdentity } from "../../utils/playerIdentity";

/**
 * When a registered player reconnects they get a new network id. Move their registration
 * (region, colour, score) to it so building restrictions and scoring keep working.
 */
export function subscribeToPlayerReconnects(): void {
    subscriptions.upsert("playerReconnects", () =>
        context.subscribe("network.join", (e) => {
            const identity = getPlayerIdentity(e.player);
            if (!identity) return;

            const newId = e.player.toString();
            const oldId = GameManager.getInstance().getPlayerManager().reconnectPlayer(newId, identity);
            if (oldId === null) return;

            ScoreManager.getInstance().changePlayerId(oldId, newId);
            const player = GameManager.getInstance().getPlayer(newId);
            if (player) {
                network.sendMessage(`👋 Welcome back! You are still ${player.name} (${player.colour}).`, [e.player]);
            }
        })
    );
}
