import { config } from "./config";

type AnyRecord = Record<string, unknown>;

function formatPrefix(level: "DEBUG" | "INFO" | "WARN" | "ERROR"): string {
	return `[${level}]`;
}

const shouldDebug = (): boolean => !!config.debug;

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
	error: (...args: unknown[]): void => {
		console.log(formatPrefix("ERROR"), ...args);
	},
};

export type Logger = typeof logger & AnyRecord;


