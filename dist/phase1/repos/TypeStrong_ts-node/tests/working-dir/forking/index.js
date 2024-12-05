"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
const path_1 = require("path");
// Initially set the exit code to non-zero. We only set it to `0` when the
// worker process finishes properly with the expected stdout message.
process.exitCode = 1;
const workerProcess = (0, child_process_1.fork)('./worker.ts', [], {
    stdio: 'pipe',
    cwd: (0, path_1.join)(__dirname, 'subfolder'),
});
let stdout = '';
workerProcess.stdout.on('data', (chunk) => (stdout += chunk.toString('utf8')));
workerProcess.on('error', () => (process.exitCode = 1));
workerProcess.on('close', (status, signal) => {
    if (status === 0 && signal === null && stdout.trim() === 'Works') {
        console.log('Passing: from main');
        process.exitCode = 0;
    }
});
//# sourceMappingURL=index.js.map