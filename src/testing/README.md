# OpenRCT2 Bingo Plugin Testing

This directory contains a comprehensive testing system for the OpenRCT2 Bingo plugin.

## Overview

Since OpenRCT2 plugins require the actual game environment to function, we use an in-game testing system rather than traditional unit testing frameworks like Jest.

## Test Structure

```
src/testing/
├── TestRunner.ts          # Core test runner
├── TestHelpers.ts         # Test utilities and helpers
├── TestShortcuts.ts       # Debug shortcuts for running tests
├── index.ts              # Main test entry point
├── tests/                # Test suites
│   ├── GameManager.test.ts
│   ├── BuildingRestrictions.test.ts
│   └── GameModeIntegration.test.ts
└── README.md             # This file
```

## Running Tests

### In-Game Shortcuts (Debug Mode Only)

When `config.debug = true`, the following shortcuts are available:

- **CTRL+ALT+T** - Run All Tests
- **CTRL+ALT+G** - Run GameManager Tests
- **CTRL+ALT+R** - Run Building Restrictions Tests
- **CTRL+ALT+M** - Run Game Mode Tests
- **CTRL+ALT+U** - Run Unit Tests
- **CTRL+ALT+I** - Run Integration Tests
- **CTRL+ALT+S** - Run Restrictions Tests

### NPM Scripts

```bash
# Show test instructions
npm run test
npm run test:unit
npm run test:integration
npm run test:restrictions
```

## Test Categories

### Unit Tests
- **GameManager Tests**: Core manager functionality
- **Player Registration**: Player management
- **Game Mode Switching**: Mode transitions

### Integration Tests
- **Game Mode Integration**: Complete game mode functionality
- **Player Region Assignment**: Region management
- **Initialization State**: Game state management

### Building Restrictions Tests
- **Land Modification**: landraise/landlower restrictions
- **Building Actions**: Construction restrictions
- **Region Validation**: Cross-region building prevention

## Writing Tests

### Basic Test Structure

```typescript
import { describe, it } from "../TestRunner";
import { TestHelpers } from "../TestHelpers";

export const myTests = describe("My Test Suite", [
    it("should do something", () => {
        // Test implementation
        TestHelpers.assert(condition, "Error message");
    }),
    
    it("should handle async operations", async () => {
        // Async test implementation
        await TestHelpers.wait(100);
        TestHelpers.assertEqual(actual, expected, "Values should be equal");
    })
], TestHelpers.setupTestEnvironment, TestHelpers.teardownTestEnvironment);
```

### Test Helpers

The `TestHelpers` class provides utilities for:

- **Environment Setup**: `setupTestEnvironment()`, `teardownTestEnvironment()`
- **Game Mode Setup**: `setupPvpMode()`, `setupLockoutMode()`, `setupCoopMode()`
- **Player Management**: `registerTestPlayers()`, `clearAllPlayers()`
- **Action Simulation**: `simulateLandraise()`, `simulateBuildingAction()`
- **Assertions**: `assert()`, `assertEqual()`, `assertNotNull()`
- **Utilities**: `wait()`, `getRegionCoordinates()`

### Test Setup and Teardown

Each test suite can have:
- **Setup**: Runs before all tests in the suite
- **Teardown**: Runs after all tests in the suite

```typescript
export const myTests = describe("My Tests", [
    // tests...
], 
    TestHelpers.setupTestEnvironment,    // Setup function
    TestHelpers.teardownTestEnvironment  // Teardown function
);
```

## Best Practices

### 1. Test Isolation
- Each test should be independent
- Use setup/teardown to ensure clean state
- Don't rely on test execution order

### 2. Async Testing
- Use `async/await` for asynchronous operations
- Set appropriate timeouts for long-running operations
- Use `TestHelpers.wait()` for timing-dependent tests

### 3. Assertions
- Use descriptive assertion messages
- Test both positive and negative cases
- Verify error conditions

### 4. Test Data
- Use `TestHelpers.getRegionCoordinates()` for consistent coordinates
- Use `TestHelpers.simulateLandraise()` for action simulation
- Register test players using `TestHelpers.registerTestPlayers()`

## Debugging Tests

### Console Output
Tests provide detailed console output:
- ✅ Passed tests
- ❌ Failed tests with error messages
- 📊 Test summaries
- 🎯 Overall results

### Test State
Use `TestHelpers.getDebugInfo()` to inspect game state:
```typescript
const debugInfo = TestHelpers.getDebugInfo();
console.log(debugInfo);
```

### Manual Testing
For complex scenarios, you can manually run test code:
```typescript
// In OpenRCT2 console
const { runTestSuite } = require('./src/testing/index');
runTestSuite('gamemanager');
```

## Adding New Tests

1. Create a new test file in `src/testing/tests/`
2. Follow the existing test structure
3. Add the test suite to `src/testing/index.ts`
4. Register any new shortcuts in `src/testing/TestShortcuts.ts`

## Continuous Integration

Since tests require the OpenRCT2 environment, they cannot be run in traditional CI/CD pipelines. Instead:

1. Run tests manually during development
2. Use the debug shortcuts for quick testing
3. Document test results in pull requests
4. Ensure all tests pass before merging

## Troubleshooting

### Common Issues

1. **Tests not running**: Ensure `config.debug = true`
2. **Game state issues**: Use `TestHelpers.setupTestEnvironment()`
3. **Player registration failures**: Check game mode and initialization state
4. **Building restrictions not working**: Verify game mode and initialization state

### Debug Commands

```typescript
// Check game state
const gameManager = GameManager.getInstance();
console.log(gameManager.getDebugInfo());

// Force game mode
gameManager.setGameMode("pvp");
gameManager.setInitializing(false);

// Check building restrictions
const debugInfo = gameManager.getDebugInfo();
console.log(debugInfo.includes("enabled") ? "Restrictions enabled" : "Restrictions disabled");
```
