/*
 * TestRunner - Custom test runner for OpenRCT2 plugin testing
 * Runs tests in-game with proper setup and teardown
 */

export interface TestResult {
    name: string;
    passed: boolean;
    error?: string;
    duration: number;
}

export interface TestSuite {
    name: string;
    tests: Test[];
    setup?: () => void | Promise<void>;
    teardown?: () => void | Promise<void>;
}

export interface Test {
    name: string;
    fn: () => void | Promise<void>;
    timeout?: number;
}

export class TestRunner {
    private results: TestResult[] = [];

    /**
     * Run a single test suite
     */
    public async runSuite(suite: TestSuite): Promise<TestResult[]> {
        console.log(`\n🧪 Running test suite: ${suite.name}`);
        console.log("=".repeat(50));
        
        this.results = [];

        try {
            // Run setup if provided
            if (suite.setup) {
                console.log("⚙️  Running setup...");
                await suite.setup();
            }

            // Run all tests in the suite
            for (const test of suite.tests) {
                await this.runTest(test);
            }

            // Run teardown if provided
            if (suite.teardown) {
                console.log("🧹 Running teardown...");
                await suite.teardown();
            }

        } catch (error) {
            console.error(`❌ Test suite failed: ${error instanceof Error ? error.message : String(error)}`);
        }

        this.printResults();
        return this.results;
    }

    /**
     * Run multiple test suites
     */
    public async runSuites(suites: TestSuite[]): Promise<TestResult[]> {
        console.log(`\n🚀 Running ${suites.length} test suites`);
        console.log("=".repeat(50));

        const allResults: TestResult[] = [];

        for (const suite of suites) {
            const suiteResults = await this.runSuite(suite);
            allResults.push(...suiteResults);
        }

        this.printSummary(allResults);
        return allResults;
    }

    /**
     * Run a single test
     */
    private async runTest(test: Test): Promise<void> {
        const startTime = Date.now();
        console.log(`\n  🔍 ${test.name}`);

        try {
            const timeout = test.timeout || 5000; // 5 second default timeout
            await this.runWithTimeout(test.fn, timeout);
            
            const duration = Date.now() - startTime;
            this.results.push({
                name: test.name,
                passed: true,
                duration
            });
            
            console.log(`  ✅ PASSED (${duration}ms)`);
        } catch (error) {
            const duration = Date.now() - startTime;
            this.results.push({
                name: test.name,
                passed: false,
                error: error instanceof Error ? error.message : String(error),
                duration
            });
            
            console.log(`  ❌ FAILED (${duration}ms): ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Run a function with timeout
     */
    private async runWithTimeout(fn: () => void | Promise<void>, timeout: number): Promise<void> {
        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                reject(new Error(`Test timed out after ${timeout}ms`));
            }, timeout);

            try {
                const result = fn();
                if (result instanceof Promise) {
                    result.then(() => {
                        clearTimeout(timer);
                        resolve();
                    }).catch((error) => {
                        clearTimeout(timer);
                        reject(error);
                    });
                } else {
                    clearTimeout(timer);
                    resolve();
                }
            } catch (error) {
                clearTimeout(timer);
                reject(error);
            }
        });
    }

    /**
     * Print test results
     */
    private printResults(): void {
        const passed = this.results.filter(r => r.passed).length;
        const failed = this.results.filter(r => !r.passed).length;
        
        console.log(`\n📊 Results: ${passed} passed, ${failed} failed`);
        
        if (failed > 0) {
            console.log("\n❌ Failed tests:");
            this.results.filter(r => !r.passed).forEach(result => {
                console.log(`  - ${result.name}: ${result.error}`);
            });
        }
    }

    /**
     * Print summary for multiple suites
     */
    private printSummary(allResults: TestResult[]): void {
        const totalPassed = allResults.filter(r => r.passed).length;
        const totalFailed = allResults.filter(r => !r.passed).length;
        const totalDuration = allResults.reduce((sum, r) => sum + r.duration, 0);
        
        console.log(`\n🎯 Test Summary:`);
        console.log(`  Total: ${allResults.length} tests`);
        console.log(`  Passed: ${totalPassed}`);
        console.log(`  Failed: ${totalFailed}`);
        console.log(`  Duration: ${totalDuration}ms`);
        
        if (totalFailed === 0) {
            console.log(`\n🎉 All tests passed!`);
        } else {
            console.log(`\n💥 ${totalFailed} tests failed`);
        }
    }
}

// Global test runner instance
export const testRunner = new TestRunner();

// Helper functions for creating tests
export function describe(name: string, tests: Test[], setup?: () => void | Promise<void>, teardown?: () => void | Promise<void>): TestSuite {
    return { name, tests, setup, teardown };
}

export function it(name: string, fn: () => void | Promise<void>, timeout?: number): Test {
    return { name, fn, timeout };
}

export function test(name: string, fn: () => void | Promise<void>, timeout?: number): Test {
    return it(name, fn, timeout);
}
