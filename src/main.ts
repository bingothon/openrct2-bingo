import { configureBoard, getBoardGameMode } from './ui/helpers';
import { registerActions } from './actions/registerActions';
import {
    openBingoBoard,
    showGameModeDialog,
    showWelcomeDialog,
} from './ui';
import { checkIfStarted, getManagedServer, getSeed, setSeed, startGame } from './utils';
import { connectToManager } from './bingo/bingosync-handler';
import {
    subscribeToClientBoardSync,
    subscribeToInventions,
    subscribeToWeather,
    subscribeToRenewRides,
} from './subscriptions/game';
// Removed unused tileAnalyzer import
import {
    registerClientShortkeys,
    registerCommonShortkeys,
    registerServerOrNoneShortkeys,
} from './shortkeys';
import { registerDebugShortkeys } from './debug/shortkeys';
import { config } from './config';
import { subscribeIfStarted } from './subscriptions/server';
import { initializeBingoSystem } from './bingo/integration';
import { registerChatCommands } from './commands/chatCommands';
import { ServerManager } from './managers/ServerManager';
import { GameManager } from './managers/GameManager';
import { subscribeToPlayerReconnects } from './subscriptions/server/playerReconnect';
import { subscribeToStaffNaming } from './subscriptions/server/staffNaming';
import { subscribeToAutoOpenStalls } from './subscriptions/server/autoOpenStalls';
import { subscribeToBudgetTracking } from './bingo/budgets';
import { subscribeToBannerRegions } from './bingo/bannerRegions';
import { subscribeToSetupLock } from './subscriptions/game/buildingRestrictions';
import { subscribeToRegionPicker } from './ui/showRegionPicker';
import { subscribeToGameResult } from './ui/showGameResult';
import { subscriptions } from './subscriptions/manager';
import { ScoreManager } from './managers/ScoreManager';

export function main(): void {
    registerActions();
    registerChatCommands();
    // Which region each banner/sign is in (renaming them only passes a banner index)
    subscribeToBannerRegions(GameManager.getInstance().getGroundDivisionManager());
    // PvP/Lockout: let players pick their colour/region in a window (clients and a GUI host)
    subscriptions.upsert("regionPicker", () => subscribeToRegionPicker() || { dispose: () => {} });
    // PvP/Lockout: show who won once the game is over
    subscriptions.upsert("gameResult", () => subscribeToGameResult() || { dispose: () => {} });
    network.defaultGroup = 3;

    // Shortkeys are registered below per mode

    if (network.mode === 'server') {
        console.log('Server mode detected - starting ServerManager');
        console.log('About to create ServerManager instance');
        
        // Start the ServerManager to monitor game state changes
        const serverManager = ServerManager.getInstance();
        console.log('ServerManager instance created, calling startServer()');
        serverManager.startServer();
        // Keep registrations working when players reconnect with a new network id
        subscribeToPlayerReconnects();
        // PvP/Lockout: hired staff get their player's colour in their name
        subscribeToStaffNaming();
        // PvP/Lockout: each player can only spend their share of the park's cash
        subscribeToBudgetTracking();
        // Players wait while the game is being set up
        subscribeToSetupLock();
        // Stalls open as soon as they are placed
        subscribeToAutoOpenStalls();

        // Started by the server manager (openrct2-bingosync): this server always runs one mode,
        // so start it right away - players only pick their colour
        const managed = getManagedServer();
        if (managed) {
            connectToManager(managed);
            if (!checkIfStarted()) {
                console.log(`Managed server "${managed.id}": starting ${managed.mode.toUpperCase()} for ${managed.durationYears} years`);
                config.gameMode = managed.mode;
                context.executeAction('setStorage', { args: { key: 'gameMode', value: managed.mode } });
                startGame(managed.durationYears);
            }
        }
        console.log('ServerManager startServer() completed');
        
        // Initialize ScoreManager for server-side score management
        const scoreManager = ScoreManager.getInstance();
        scoreManager.initialize();
        console.log('ScoreManager initialized for server-side score management');
        
        // Faster research and rides that don't age - on every server, also headless ones
        subscribeToInventions();
        subscribeToRenewRides();
        subscribeToWeather();

        if (typeof ui !== 'undefined') {
            console.log('Server mode with UI.');
            setSeed();

            // Initialize the bingo system for server mode with UI
            const seed = getSeed();
            console.log(`Server seed: ${seed}`);

            // Initialize the BingoManager and GameManager with the board
            const managers = initializeBingoSystem();
            console.log('Bingo system initialized for server mode', managers);

            // Show UI dialogs after restart
            try {
                // Always show game mode selection dialog for server mode
                console.log('Server mode - showing game mode selection dialog.');
                showGameModeDialog();

                if (!checkIfStarted()) {
                    console.log(
                        'Game not started, will show game duration dialog after mode selection.',
                    );
                } else {
                    const parkStorage = context.getParkStorage();
                    const duration = parkStorage.get('duration', 0);
                    const getCurrentYear = date.year;
                    const remainingYears = duration - getCurrentYear;
                    network.sendMessage(`Game already started, ${remainingYears} years remaining.`);
                    console.log("Game already started, skipping game duration's dialog.");
                }
                subscribeIfStarted();
                // Don't open bingo board immediately - wait for user to complete setup
                console.log('Bingo board will open after game mode and duration selection.');
            } catch (error) {
                console.log('Error during startup:', error);
            }

            registerServerOrNoneShortkeys();
        } 
    } else if (network.mode === 'client') {
        network.defaultGroup = 2; // TODO: Set this to 1 during bingothon
        console.log('Client mode detected.');
        const seed = getSeed();
        console.log(`Seed received from host: ${seed}`);
        config.gameMode = getBoardGameMode();
        const board = configureBoard(seed);

        // Initialize the BingoManager and GameManager with the board
        const managers = initializeBingoSystem();
        console.log('Bingo system initialized for client mode', managers);

        try {
            if (!checkIfStarted()) {
                console.log('Game not started, showing game duration dialog.');
                showGameModeDialog();
            } else {
                const parkStorage = context.getParkStorage();
                const duration = parkStorage.get('duration', 0);
                const getCurrentYear = date.year;
                const remainingYears = duration - getCurrentYear;
                network.sendMessage(`Game already started, ${remainingYears} years remaining.`);
                console.log("Game already started, skipping game duration's dialog.");
            }
            subscribeIfStarted();
            // Goal checking is now handled by GoalManager in initializeBingoSystem()
            showWelcomeDialog();
            openBingoBoard(board);
            // Rebuild on game mode changes and show completions stored by the server
            subscribeToClientBoardSync(seed, board);
        } catch (error) {
            console.log('Error opening Bingo board:', error);
        }
        if (typeof ui !== 'undefined') {
            registerClientShortkeys();
        }
    } else if (network.mode === 'none') {
        console.log('Single-player mode detected.');
        setSeed();
        
        // Initialize the bingo system for single-player mode
        const seed = getSeed();
        console.log(`Single-player seed: ${seed}`);
        const managers = initializeBingoSystem();
        console.log('Bingo system initialized for single-player mode', managers);
        
        if (typeof ui !== 'undefined') {
            registerServerOrNoneShortkeys();

            // Always show game mode selection dialog for local testing
            console.log('Local testing mode - showing game mode dialog.');
            showGameModeDialog();
        }
    }

    registerCommonShortkeys();
    if (config.debug) {
        registerDebugShortkeys(); 
        // Test shortcuts are registered separately in the plugin
    }
}
