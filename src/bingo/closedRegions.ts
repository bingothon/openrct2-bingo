/*
 * PvP/Lockout: colours whose player left and didn't come back in time (leavingPlayers.ts). Their
 * region is cleared and closed for the rest of the game: nobody can pick the colour again, their
 * claimed goals stay locked and their score is off the board. Kept in park storage, which the
 * closeRegion action changes on the server and every client.
 */

const CLOSED_KEY = "closedColours";

export function getClosedColours(): string[] {
    try {
        const colours = JSON.parse(context.getParkStorage().get(CLOSED_KEY, "[]"));
        return Array.isArray(colours) ? colours : [];
    } catch (error) {
        return [];
    }
}

export function isColourClosed(colour: string): boolean {
    return getClosedColours().indexOf(colour) !== -1;
}

/** Only from inside a game action (closeRegion), so every player's park storage changes alike */
export function markColourClosed(colour: string): void {
    const colours = getClosedColours();
    if (colours.indexOf(colour) === -1) colours.push(colour);
    context.getParkStorage().set(CLOSED_KEY, JSON.stringify(colours));
}
