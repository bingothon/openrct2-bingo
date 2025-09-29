import { configureBoard } from './ui/helpers';
import { registerActions } from './actions/registerActions';
import {
    openBingoBoard,
    showGameDurationDialog,
    showGameModeDialog,
    showWelcomeDialog,
} from './ui';
import { checkIfStarted, getSeed, setSeed } from './utils';
import {
    subscribeToGoalChecks,
    subscribeToInventions,
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
import { ScoreManager } from './managers/ScoreManager';

export function main(): void {
    registerActions();
    registerChatCommands();
    network.defaultGroup = 3;

    // Shortkeys are registered below per mode

    if (network.mode === 'server') {
        console.log('Server mode detected - starting ServerManager');
        console.log('About to create ServerManager instance');
        
        // Start the ServerManager to monitor game state changes
        const serverManager = ServerManager.getInstance();
        console.log('ServerManager instance created, calling startServer()');
        serverManager.startServer();
        console.log('ServerManager startServer() completed');
        
        // Initialize ScoreManager for server-side score management
        const scoreManager = ScoreManager.getInstance();
        scoreManager.initialize();
        console.log('ScoreManager initialized for server-side score management');
        
        if (typeof ui !== 'undefined') {
            subscribeToInventions();
            subscribeToRenewRides();
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
