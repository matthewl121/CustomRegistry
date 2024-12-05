/**
* log.ts
* Logging utilities for file and stdout output with configurable levels
*/
/**
* Initializes empty log file and creates directory if needed
*/
export declare function initLogFile(): void;
/**
* Writes message to log file if message level <= configured log level
* @param message - Message to log (string or object)
* @param message_level - Log level of message (0-3)
*/
export declare function logToFile(message: string | object, message_level: number): void;
/**
* Writes metrics to stdout if message level <= configured log level
* @param message - Metrics to log (string or object)
* @param message_level - Log level of message (0-3)
*/
export declare function metricsLogToStdout(message: string | object, message_level: number): void;
//# sourceMappingURL=log.d.ts.map