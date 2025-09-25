import { config } from "./config";

type AnyRecord = Record<string, unknown>;

function formatPrefix(level: "DEBUG" | "INFO" | "WARN" | "ERROR"): string {
	return `[${level}]`;
}

const shouldDebug = (): boolean => !!config.debug;

// Suppression tracking
const suppressedMessages: { [key: string]: boolean } = {};
const suppressionCounts: { [key: string]: number } = {};

// Rate limiting per suppression key (simple sliding window)
const rateState: { [key: string]: { windowStartMs: number; count: number } } = {};

export const logger = {
	debug: (...args: unknown[]): void => {
		if (!shouldDebug()) return;
		console.log(formatPrefix("DEBUG"), ...args);
	},
	info: (...args: unknown[]): void => {
		console.log(formatPrefix("INFO"), ...args);
	},
	warn: (...args: unknown[]): void => {
		console.log(formatPrefix("WARN"), ...args);
	},
	// error(message, maxPerSecond?, key?)
	error: (message: unknown, maybeMaxOrKey?: unknown, maybeKey?: unknown, ...rest: unknown[]): void => {
		// Backward compatibility: if not a string, just pass through
		if (typeof message !== "string") {
			console.log(formatPrefix("ERROR"), message, maybeMaxOrKey, maybeKey, ...rest);
			return;
		}

		const defaultMax = 0; // 0 means no rate limiting
		let maxPerSecond: number = defaultMax;
		let key: string | undefined = undefined;

		if (typeof maybeMaxOrKey === "number") {
			maxPerSecond = maybeMaxOrKey;
			if (typeof maybeKey === "string" && maybeKey.length > 0) {
				key = maybeKey;
			}
		} else if (typeof maybeMaxOrKey === "string" && maybeMaxOrKey.length > 0) {
			key = maybeMaxOrKey;
			if (typeof maybeKey === "number") {
				maxPerSecond = maybeKey;
			}
		}

		// If a key is provided and maxPerSecond > 0, apply rate limiting
		if (key && maxPerSecond > 0) {
			const now = Date.now();
			const state = rateState[key] || { windowStartMs: now, count: 0 };
			// if outside 1s window, reset
			if (now - state.windowStartMs >= 1000) {
				state.windowStartMs = now;
				state.count = 0;
			}
			if (state.count >= maxPerSecond) {
				// Suppress
				rateState[key] = state;
				return;
			}
			state.count += 1;
			rateState[key] = state;
		}

		console.log(formatPrefix("ERROR"), message, ...rest);
	},
	// Suppression methods
	suppress: (message: string): void => {
		suppressedMessages[message] = true;
	},
	unsuppress: (message: string): void => {
		delete suppressedMessages[message];
		delete suppressionCounts[message];
	},
	// Conditional logging with suppression
	errorOnce: (message: string, ...args: unknown[]): void => {
		if (suppressedMessages[message]) {
			suppressionCounts[message] = (suppressionCounts[message] || 0) + 1;
			return;
		}
		console.log(formatPrefix("ERROR"), message, ...args);
	},
	errorSuppressed: (message: string, maxSuppressions: number = 10, ...args: unknown[]): void => {
		const count = suppressionCounts[message] || 0;
		
		if (count < maxSuppressions) {
			// Suppress and increment counter
			suppressionCounts[message] = count + 1;
		} else {
			// Reset counter and log the message
			suppressionCounts[message] = 0;
			console.log(formatPrefix("ERROR"), message, ...args);
		}
	},
	// Get suppression stats
	getSuppressionStats: (): Record<string, number> => {
		return suppressionCounts;
	},
	clearSuppressions: (): void => {
		Object.keys(suppressedMessages).forEach(key => delete suppressedMessages[key]);
		Object.keys(suppressionCounts).forEach(key => delete suppressionCounts[key]);
	},
};

export type Logger = typeof logger & AnyRecord;


