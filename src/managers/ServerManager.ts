import { config } from "../config";
import { initializeGame } from "../init";
import { initializeBingoSystem } from "../bingo/integration";

export class ServerManager {
    private static instance: ServerManager;
    private isInitialized = false;
    private tickSubscription: IDisposable | null = null;
    private tickCounter = 0;

    private constructor() {}

    public static getInstance(): ServerManager {
        if (!ServerManager.instance) {
            ServerManager.instance = new ServerManager();
        }
        return ServerManager.instance;
    }

    public startServer(): void {
        console.log("[ServerManager] Starting server initialization monitoring");
        console.log("[ServerManager] ServerManager instance created and starting");
        this.setupGameStateMonitoring();
        console.log("[ServerManager] Game state monitoring setup complete");
    }

    private setupGameStateMonitoring(): void {
        // Monitor game state changes every 1000 ticks to avoid spam
        this.tickSubscription = context.subscribe("interval.tick", () => {
            this.tickCounter++;
            if (this.tickCounter % 1000 === 0) {
                this.checkForGameInitialization();
            }
        });
    }


    private checkForGameInitialization(): void {
        const parkStorage = context.getParkStorage();
        const startRequest = parkStorage.get("started", false);
        const gameMode = parkStorage.get("gameMode", "coop");
        
        console.log(`[ServerManager] Checking game state - started: ${startRequest}, gameMode: ${gameMode}, isInitialized: ${this.isInitialized}`);
        
        if (startRequest && !this.isInitialized) {
            console.log(`[ServerManager] ✅ Game initialization requested - proceeding with ${gameMode} mode`);
            this.initializeGame(gameMode);
        }
    }

    private initializeGame(gameMode: string): void {
        if (this.isInitialized) {
            console.log("[ServerManager] Game already initialized, skipping");
            return;
        }

        this.isInitialized = true;
        config.started = true;
        config.gameMode = gameMode as "coop" | "pvp" | "lockout";
        
        console.log(`[ServerManager] Initializing game with mode: ${gameMode}`);
        
        // Initialize the game mode (lockout/pvp/coop)
        console.log("[ServerManager] Calling initializeGame() for game mode...");
        initializeGame();
        console.log("[ServerManager] Game mode initialization completed");
        
        // Initialize the bingo system (GoalManager, ScoreManager, etc.)
        console.log("[ServerManager] Calling initializeBingoSystem()...");
        initializeBingoSystem();
        console.log("[ServerManager] Bingo system initialization completed");
        
        console.log("[ServerManager] Game initialization completed");
    }

    public stopServer(): void {
        if (this.tickSubscription) {
            this.tickSubscription.dispose();
            this.tickSubscription = null;
        }
        console.log("[ServerManager] Server monitoring stopped");
    }

    public getDebugInfo(): any {
        return {
            isInitialized: this.isInitialized,
            hasTickSubscription: !!this.tickSubscription
        };
    }
}
