import { resetBudgets } from "../bingo/budgets";
import { config } from "../config";
import { initializeGame } from "../init";
import { initializeBingoSystem } from "../bingo/integration";

export class ServerManager {
    private static instance: ServerManager;
    private isInitialized = false;
    private tickSubscription: IDisposable | null = null;
    private logTickCounter = 0;

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
        // Monitor game state changes every tick for immediate responsiveness
        this.tickSubscription = context.subscribe("interval.tick", () => {
            // Early exit if already initialized - no need to keep checking
            if (this.isInitialized) {
                return;
            }
            
            this.logTickCounter++;
            // Only log every 1000 ticks to avoid spam, but check every tick for responsiveness
            if (this.logTickCounter % 1000 === 0) {
                this.checkForGameInitialization();
            } else {
                // Silent check - no logging
                this.silentCheckForGameInitialization();
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
            // Stop monitoring once initialization is complete
            this.stopMonitoring();
        }
    }

    private silentCheckForGameInitialization(): void {
        const parkStorage = context.getParkStorage();
        const startRequest = parkStorage.get("started", false);
        const gameMode = parkStorage.get("gameMode", "coop");
        
        if (startRequest && !this.isInitialized) {
            console.log(`[ServerManager] ✅ Game initialization requested - proceeding with ${gameMode} mode`);
            this.initializeGame(gameMode);
            // Stop monitoring once initialization is complete
            this.stopMonitoring();
        }
    }

    private initializeGame(gameMode: string): void {
        if (this.isInitialized) {
            console.log("[ServerManager] Game already initialized, skipping");
            return;
        }

        this.isInitialized = true;
        resetBudgets();
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

    private stopMonitoring(): void {
        if (this.tickSubscription) {
            this.tickSubscription.dispose();
            this.tickSubscription = null;
        }
        console.log("[ServerManager] Tick monitoring stopped - game initialized");
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
