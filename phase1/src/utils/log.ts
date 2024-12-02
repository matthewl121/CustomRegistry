/**
* log.ts
* Logging utilities for file and stdout output with configurable levels
*/

const fs = require('fs');
const path = require('path');

/**
* Initializes empty log file and creates directory if needed
*/
export function initLogFile() {
   const logDir = path.dirname(process.env.LOG_FILE);
   if (!fs.existsSync(logDir)) {
       fs.mkdirSync(logDir, { recursive: true });
   }
   fs.writeFileSync(process.env.LOG_FILE, '');
}

/**
* Writes message to log file if message level <= configured log level
* @param message - Message to log (string or object)
* @param message_level - Log level of message (0-3) 
*/
export function logToFile(message: string | object, message_level: number) {
   let log_level = parseInt(process.env.LOG_LEVEL || '1', 10);
   
   if (isNaN(log_level) || log_level < 0 || log_level > 3) {
       log_level = 0;
   }

   if (message_level <= log_level) {
       let formattedMessage = typeof message === 'object' 
           ? JSON.stringify(message, null, 2)
           : message.toString();
       fs.appendFileSync(process.env.LOG_FILE, formattedMessage + '\n');
   }
}

/**
* Writes metrics to stdout if message level <= configured log level
* @param message - Metrics to log (string or object)
* @param message_level - Log level of message (0-3)
*/
export function metricsLogToStdout(message: string | object, message_level: number) {
   let log_level = parseInt(process.env.LOG_LEVEL || '1', 10);

   if (isNaN(log_level) || log_level < 0 || log_level > 3) {
       log_level = 0;
   }

   if (message_level <= log_level) {
       let formattedMessage = typeof message === 'object'
           ? JSON.stringify(message)
           : message.toString();
       console.log(formattedMessage);
   }
}