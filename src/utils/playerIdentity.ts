/**
 * Stable identity of a connected player. Network ids change when someone reconnects, but the
 * public key hash of their player key stays the same; the name is a fallback.
 */
export function getPlayerIdentity(playerId: number): string | null {
    try {
        const player = network.getPlayer(playerId);
        if (!player) return null;
        return player.publicKeyHash ? `key:${player.publicKeyHash}` : `name:${player.name}`;
    } catch (error) {
        return null;
    }
}
