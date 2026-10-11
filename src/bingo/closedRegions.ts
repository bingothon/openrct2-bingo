/*
 * PvP/Lockout: colours whose region is being cleared because their player left and didn't come
 * back in time (leavingPlayers.ts). Nobody can pick such a colour until the region is restored;
 * then it's open again for a new player. Kept in park storage, which the closeRegion and
 * reopenRegion actions change on the server and every client.
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

/** Only from inside a game action (reopenRegion) */
export function markColourOpen(colour: string): void {
    context.getParkStorage().set(CLOSED_KEY, JSON.stringify(getClosedColours().filter((closed) => closed !== colour)));
}
