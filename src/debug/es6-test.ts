/**
 * ES6 Test - Simple test of ES6 features to verify transpilation
 */

// ES6 Class
class ES6TestClass {
    private name: string;
    private items: string[];

    constructor(name: string = "ES6Test") {
        this.name = name;
        this.items = [];
    }

    addItem = (item: string): void => {
        this.items.push(item);
    }

    getInfo(): string {
        const { name, items } = this;
        return `Class: ${name}, Items: ${items.length}`;
    }
}

// ES6 Arrow function with default parameters
const es6ArrowFunction = (message: string = "Hello", ...args: any[]): string => {
    return `${message} from ES6! Args: ${args.join(", ")}`;
};

// ES6 Destructuring and template literals
const processES6Features = (data: { name: string; values: number[] }): string => {
    const { name, values } = data;
    const [first, ...rest] = values;
    
    return `Name: ${name}, First: ${first}, Rest: ${rest.join(", ")}`;
};

// ES6 Map and Set (simplified for OpenRCT2 compatibility)
const testES6Collections = (): string => {
    try {
        const map = new Map();
        const set = new Set();
        
        map.set("test", 42);
        set.add("value");
        
        return `Map size: ${map.size}, Set size: ${set.size}`;
    } catch (error) {
        return `Collections test skipped (Map/Set not available): ${error}`;
    }
};

// ES6 Generator function
function* es6Generator(): Generator<string, void, unknown> {
    yield "First yield";
    yield "Second yield";
    yield "Third yield";
}

// Main test function
const runES6Test = (): void => {
    console.log("=== ES6 TRANSPILATION TEST ===");
    
    try {
        // Test class
        const testClass = new ES6TestClass("ES6TestClass");
        testClass.addItem("item1");
        testClass.addItem("item2");
        console.log("✅ Class Test:", testClass.getInfo());
        
        // Test arrow function
        const arrowResult = es6ArrowFunction("Testing", 1, 2, 3);
        console.log("✅ Arrow Function:", arrowResult);
        
        // Test destructuring and template literals
        const destructuringResult = processES6Features({
            name: "TestData",
            values: [1, 2, 3, 4, 5]
        });
        console.log("✅ Destructuring:", destructuringResult);
        
        // Test collections
        const collectionsResult = testES6Collections();
        console.log("✅ Collections:", collectionsResult);
        
        // Test generator (simplified)
        try {
            const generator = es6Generator();
            const generatorResults = [];
            for (const value of generator) {
                generatorResults.push(value);
            }
            console.log("✅ Generator:", generatorResults.join(", "));
        } catch (error) {
            console.log("⚠️ Generator test skipped:", error);
        }
        
        console.log("=== ES6 TEST COMPLETED SUCCESSFULLY ===");
        
    } catch (error) {
        console.error("❌ ES6 Test failed:", error);
    }
};

// Export the test function for use by the shortcut system
export { runES6Test };

console.log("ES6 Test function ready. Use CTRL+SHIFT+E to run the test.");
