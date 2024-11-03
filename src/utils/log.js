"use strict";
exports.__esModule = true;
exports.metricsLogToStdout = exports.logToFile = exports.initLogFile = void 0;
var fs = require('fs');
var path = require('path');
function initLogFile() {
    var logFilePath = process.env.LOG_FILE || path.join(__dirname, 'log_file.txt');
    var logDir = path.dirname(logFilePath);
    if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
    }
    fs.writeFileSync(process.env.LOG_FILE, '');
    // const f = fs.openSync(process.env.LOG_FILE, 'w');
    // fs.closeSync(f);
}
exports.initLogFile = initLogFile;
function logToFile(message, message_level) {
    var log_level = parseInt(process.env.LOG_LEVEL || '1', 10);
    // Check if LOG_LEVEL is valid
    if (isNaN(log_level) || log_level < 0 || log_level > 3) {
        // console.error('Invalid LOG_LEVEL. Using default level 0.');
        log_level = 0;
    }
    if (message_level <= log_level) {
        var formattedMessage = void 0;
        if (typeof message === 'object') {
            formattedMessage = JSON.stringify(message, null, 2);
        }
        else {
            formattedMessage = message.toString();
        }
        fs.appendFileSync(process.env.LOG_FILE, formattedMessage + '\n');
    }
}
exports.logToFile = logToFile;
function metricsLogToStdout(message, message_level) {
    var log_level = parseInt(process.env.LOG_LEVEL || '1', 10);
    // Check if LOG_LEVEL is valid
    if (isNaN(log_level) || log_level < 0 || log_level > 3) {
        // console.error('Invalid LOG_LEVEL. Using default level 0.');
        log_level = 0;
    }
    if (message_level <= log_level) {
        var formattedMessage = void 0;
        if (typeof message === 'object') {
            formattedMessage = JSON.stringify(message); // Single line JSON
        }
        else {
            formattedMessage = message.toString();
        }
        console.log(formattedMessage); // Log to stdout
    }
}
exports.metricsLogToStdout = metricsLogToStdout;
// Usage examples:
// logToFile('Informational messages', 1);
// logToFile('Debug messages', 2);
