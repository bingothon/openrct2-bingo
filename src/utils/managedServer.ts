/**
 * Settings of a server started by the server manager (openrct2-bingosync). The manager writes
 * them to the server's plugin.store.json, which plugins read as context.sharedStorage.
 */
export interface ManagedServer {
    id: string;
    mode: "coop" | "pvp" | "lockout";
    durationYears: number;
    /** Port the manager listens on for this plugin (BingoSync, restarts) */
    managerPort: number;
}

/**
 * The manager's settings for this server, or null when the server wasn't started by the manager
 */
export function getManagedServer(): ManagedServer | null {
    if (network.mode !== "server") return null;

    // Shared storage keys need a namespace ("bingoServer.mode"), a bare "bingoServer" is refused
    const id = context.sharedStorage.get<string>("bingoServer.id");
    const mode = context.sharedStorage.get<ManagedServer["mode"]>("bingoServer.mode");
    if (!id || !mode) return null;

    return {
        id,
        mode,
        durationYears: context.sharedStorage.get<number>("bingoServer.durationYears") || 2,
        managerPort: context.sharedStorage.get<number>("bingoServer.managerPort") || 12414,
    };
}
