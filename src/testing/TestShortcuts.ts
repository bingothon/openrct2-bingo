/*
 * Test Shortcuts - Debug shortcuts for running tests in-game
 */

import { runAllTests, runTestSuite, runTestsByCategory } from "./index";

export function registerTestShortcuts(): void {
    if (typeof ui === 'undefined') return;
    
    console.log("🔧 Registering test shortcuts...");
    
    // Run all tests
    ui.registerShortcut({ 
        id: "test.runAll", 
        text: "🧪 Run All Tests", 
        bindings: ["CTRL+ALT+T"], 
        callback: () => {
            console.log("🚀 Running all tests...");
            runAllTests();
        }
    });
    
    // Run GameManager tests
    ui.registerShortcut({ 
        id: "test.gameManager", 
        text: "🧪 Run GameManager Tests", 
        bindings: ["CTRL+ALT+G"], 
        callback: () => {
            console.log("🧪 Running GameManager tests...");
            runTestSuite("gamemanager");
        }
    });
    
    // Run Building Restrictions tests
    ui.registerShortcut({ 
        id: "test.buildingRestrictions", 
        text: "🧪 Run Building Restrictions Tests", 
        bindings: ["CTRL+ALT+R"], 
        callback: () => {
            console.log("🧪 Running Building Restrictions tests...");
            runTestSuite("buildingrestrictions");
        }
    });
    
    // Run Game Mode Integration tests
    ui.registerShortcut({ 
        id: "test.gameMode", 
        text: "🧪 Run Game Mode Tests", 
        bindings: ["CTRL+ALT+M"], 
        callback: () => {
            console.log("🧪 Running Game Mode tests...");
            runTestSuite("gamemode");
        }
    });
    
    // Run unit tests only
    ui.registerShortcut({ 
        id: "test.unit", 
        text: "🧪 Run Unit Tests", 
        bindings: ["CTRL+ALT+U"], 
        callback: () => {
            console.log("🧪 Running unit tests...");
            runTestsByCategory("unit");
        }
    });
    
    // Run integration tests only
    ui.registerShortcut({ 
        id: "test.integration", 
        text: "🧪 Run Integration Tests", 
        bindings: ["CTRL+ALT+I"], 
        callback: () => {
            console.log("🧪 Running integration tests...");
            runTestsByCategory("integration");
        }
    });
    
    // Run restrictions tests only
    ui.registerShortcut({ 
        id: "test.restrictions", 
        text: "🧪 Run Restrictions Tests", 
        bindings: ["CTRL+ALT+S"], 
        callback: () => {
            console.log("🧪 Running restrictions tests...");
            runTestsByCategory("restrictions");
        }
    });
    
    console.log("✅ Test shortcuts registered");
    console.log("Available shortcuts:");
    console.log("  CTRL+ALT+T - Run All Tests");
    console.log("  CTRL+ALT+G - Run GameManager Tests");
    console.log("  CTRL+ALT+R - Run Building Restrictions Tests");
    console.log("  CTRL+ALT+M - Run Game Mode Tests");
    console.log("  CTRL+ALT+U - Run Unit Tests");
    console.log("  CTRL+ALT+I - Run Integration Tests");
    console.log("  CTRL+ALT+S - Run Restrictions Tests");
}
