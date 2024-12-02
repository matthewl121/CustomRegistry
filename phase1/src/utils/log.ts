import { openSync, closeSync } from "fs";

const fs = require('fs');
const path = require('path');

export function initLogFile() {
    const logDir = path.dirname(process.env.LOG_FILE);
    if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
    } 
    fs.writeFileSync(process.env.LOG_FILE, '');
    // const f = fs.openSync(process.env.LOG_FILE, 'w');
    // fs.closeSync(f);
}

export function logToFile(message: string | object, message_level: number) {
    let log_level = parseInt(process.env.LOG_LEVEL || '1', 10);
    // Check if LOG_LEVEL is valid
    if (isNaN(log_level) || log_level < 0 || log_level > 3) {
        // console.error('Invalid LOG_LEVEL. Using default level 0.');
        log_level = 0;
    }
    if (message_level <= log_level) {
        let formattedMessage: string;
        if (typeof message === 'object') {
            formattedMessage = JSON.stringify(message, null, 2);
        } else {
            formattedMessage = message.toString();
        }
        fs.appendFileSync(process.env.LOG_FILE, formattedMessage + '\n');
    }
}

export function metricsLogToStdout(message: string | object, message_level: number) {
    let log_level = parseInt(process.env.LOG_LEVEL || '1', 10);
    // Check if LOG_LEVEL is valid
    if (isNaN(log_level) || log_level < 0 || log_level > 3) {
        // console.error('Invalid LOG_LEVEL. Using default level 0.');
        log_level = 0;
    }
    if (message_level <= log_level) {
        let formattedMessage: string;
        if (typeof message === 'object') {
            formattedMessage = JSON.stringify(message); // Single line JSON
        } else {
            formattedMessage = message.toString();
        }
        console.log(formattedMessage); // Log to stdout
    }
}

// Usage examples:
// logToFile('Informational messages', 1);
// logToFile('Debug messages', 2);