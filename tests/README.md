# Hybrid Testing System for OpenRCT2 Bingo Plugin

This directory contains a comprehensive hybrid testing system that combines **mocked unit tests** (fast, CI-friendly) with **in-game tests** (real environment validation).

## 🏗️ Architecture

### **1. Mocked Tests** (AVA + openrct2-mocks)
- **Location**: `tests/unit/` and `tests/integration/`
- **Runner**: AVA with TypeScript support
- **Mocks**: openrct2-mocks for OpenRCT2 APIs
- **Speed**: Fast execution, suitable for CI/CD
- **Coverage**: Unit and integration tests

### **2. In-Game Tests** (Real OpenRCT2 Environment)
- **Location**: `src/testing/`
- **Runner**: Custom test runner
- **Environment**: Real OpenRCT2 game
- **Speed**: Slower, requires game environment
- **Coverage**: End-to-end validation

## 🚀 Quick Start

### **Install Dependencies**
```bash
npm install
```

### **Run All Tests**
```bash
# Run mocked tests (fast)
npm test

# Run in-game tests (requires OpenRCT2)
npm run test:ig
```

### **Run Specific Test Types**
```bash
# Unit tests only
npm run test:unit

# Integration tests only
npm run test:integration

# Watch mode (mocked tests)
npm run test:watch

# Coverage report
npm run test:coverage
```

## 📁 Directory Structure

```
tests/
├── _setup.cjs                    # AVA test setup
├── unit/                         # Mocked unit tests
│   ├── GameManager.test.ts
│   ├── GroundDivisionManager.test.ts
│   └── PlayerManager.test.ts
├── integration/                  # Mocked integration tests
│   └── BuildingRestrictions.test.ts
└── README.md                     # This file

src/testing/                      # In-game tests
├── TestRunner.ts                 # Custom test runner
├── TestHelpers.ts                # Test utilities
├── TestShortcuts.ts              # Debug shortcuts
├── tests/                        # In-game test suites
│   ├── GameManager.test.ts
│   ├── BuildingRestrictions.test.ts
│   └── GameModeIntegration.test.ts
└── index.ts                      # Test entry point
```

## 🧪 Test Categories

### **Unit Tests** (`tests/unit/`)
- **Purpose**: Test individual components in isolation
- **Mocks**: Full OpenRCT2 API mocking
- **Speed**: Very fast
- **Examples**: GameManager, PlayerManager, GroundDivisionManager

### **Integration Tests** (`tests/integration/`)
- **Purpose**: Test component interactions
- **Mocks**: Partial OpenRCT2 API mocking
- **Speed**: Fast
- **Examples**: Building restrictions, game mode switching

### **In-Game Tests** (`src/testing/`)
- **Purpose**: End-to-end validation in real environment
- **Environment**: Actual OpenRCT2 game
- **Speed**: Slower
- **Examples**: Real building restrictions, player registration

## 🛠️ Writing Tests

### **Mocked Tests (AVA)**

#### **Basic Unit Test**
```typescript
import test from "ava";
import Mock from "openrct2-mocks";
import { GameManager } from "../../src/managers/GameManager";

test.before(() => {
    globalThis.context = Mock.context({
        getTypeIdForAction: () => 80,
    });
});

test("GameManager initialization", t => {
    const gameManager = GameManager.getInstance();
    t.truthy(gameManager, "GameManager should be initialized");
});
```

#### **Integration Test**
```typescript
test("Building restrictions integration", t => {
    const gameManager = GameManager.getInstance();
    gameManager.setGameMode("pvp");
    
    const debugInfo = gameManager.getDebugInfo();
    t.true(debugInfo.includes("enabled"), "Restrictions should be enabled");
});
```

### **In-Game Tests**

#### **Using Test Helpers**
```typescript
import { describe, it } from "../TestRunner";
import { TestHelpers } from "../TestHelpers";

export const myTests = describe("My Test Suite", [
    it("should do something", () => {
        TestHelpers.setupPvpMode();
        TestHelpers.registerTestPlayers();
        
        TestHelpers.assert(condition, "Error message");
    })
], TestHelpers.setupTestEnvironment, TestHelpers.teardownTestEnvironment);
```

## 🎯 Test Commands

### **NPM Scripts**
```bash
npm test                    # Run all mocked tests
npm run test:unit          # Run unit tests only
npm run test:integration   # Run integration tests only
npm run test:watch         # Watch mode for development
npm run test:coverage      # Generate coverage report
npm run test:ig            # Show in-game test instructions
```

### **In-Game Commands**
```bash
# Chat commands (debug mode only)
/test all                  # Run all in-game tests
/test gamemanager         # Run specific test suite
/test unit                # Run unit tests
/test integration         # Run integration tests

# Keyboard shortcuts
CTRL+ALT+T                # Run all in-game tests
CTRL+ALT+G                # Run GameManager tests
CTRL+ALT+R                # Run Building Restrictions tests
CTRL+ALT+M                # Run Game Mode tests
```

## 🔧 Configuration

### **AVA Configuration** (`package.json`)
```json
{
  "ava": {
    "extensions": { "ts": "module" },
    "files": ["tests/**/*.test.ts"],
    "nodeArguments": ["--import=tsx"],
    "require": ["./tests/_setup.cjs"],
    "verbose": true,
    "workerThreads": false
  }
}
```

### **Test Setup** (`tests/_setup.cjs`)
```javascript
global.__BUILD_CONFIGURATION__ = "production";
```

## 📊 Coverage and Reporting

### **Coverage Commands**
```bash
npm run test:coverage      # Generate coverage report
```

### **Coverage Output**
- HTML report in `coverage/` directory
- Console output with coverage percentages
- Line-by-line coverage analysis

## 🚦 CI/CD Integration

### **GitHub Actions Example**
```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm test
      - run: npm run test:coverage
```

## 🐛 Debugging Tests

### **Mocked Tests**
```bash
# Run with verbose output
npm test -- --verbose

# Run specific test file
npm test -- tests/unit/GameManager.test.ts

# Run with debug output
DEBUG=ava npm test
```

### **In-Game Tests**
```bash
# Check test state
const gameManager = GameManager.getInstance();
console.log(gameManager.getDebugInfo());

# Force test environment
TestHelpers.setupTestEnvironment();
```

## 📈 Best Practices

### **Mocked Tests**
1. **Isolate components** - Test one thing at a time
2. **Use mocks effectively** - Mock external dependencies
3. **Test edge cases** - Invalid inputs, error conditions
4. **Keep tests fast** - Avoid complex setup

### **In-Game Tests**
1. **Test real scenarios** - Use actual game conditions
2. **Clean up after tests** - Reset game state
3. **Test user workflows** - End-to-end scenarios
4. **Verify visual feedback** - Check console output

### **General**
1. **Write tests first** - TDD approach
2. **Test both success and failure** - Positive and negative cases
3. **Use descriptive names** - Clear test intentions
4. **Keep tests independent** - No test dependencies

## 🔄 Development Workflow

### **1. Write Tests First (TDD)**
```bash
# Create test file
touch tests/unit/MyComponent.test.ts

# Write failing test
# Implement feature
# Verify test passes
```

### **2. Run Tests During Development**
```bash
# Watch mode for fast feedback
npm run test:watch

# Run specific tests
npm test -- tests/unit/MyComponent.test.ts
```

### **3. Validate In-Game**
```bash
# Build and test in OpenRCT2
npm run build:dev
# Load plugin in OpenRCT2
# Run in-game tests with /test command
```

### **4. Final Validation**
```bash
# Run all tests
npm test
npm run test:coverage

# Test in real game environment
# Use /test all command in OpenRCT2
```

## 🎉 Benefits

### **Mocked Tests**
- ✅ **Fast execution** - Run in seconds
- ✅ **CI/CD friendly** - No game environment needed
- ✅ **Isolated testing** - Test components independently
- ✅ **Coverage reporting** - Detailed coverage analysis

### **In-Game Tests**
- ✅ **Real validation** - Test actual game behavior
- ✅ **Integration testing** - End-to-end scenarios
- ✅ **User workflow testing** - Real user interactions
- ✅ **Visual feedback** - See tests running in game

### **Combined Benefits**
- ✅ **Comprehensive coverage** - Both unit and integration
- ✅ **Fast feedback loop** - Quick development cycle
- ✅ **Confidence in changes** - Catch regressions early
- ✅ **Documentation** - Tests serve as examples
