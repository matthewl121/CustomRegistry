"use strict";
/**
* index.ts
* Main entry point for metric calculation system
*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.main = void 0;
exports.runWorker = runWorker;
const worker_threads_1 = require("worker_threads");
const githubApi_1 = require("./api/githubApi");
const urlHandler_1 = require("./utils/urlHandler");
const log_1 = require("./utils/log");
const metric_1 = require("./metrics/metric");
const dotenv = require('dotenv');
dotenv.config();
/**
* Creates and manages worker thread for metric calculation
*/
function runWorker(owner, repo, token, repoURL, repoData, // Define specific type if possible
metric) {
    return new Promise((resolve, reject) => {
        try {
            const worker = new worker_threads_1.Worker('./src/utils/worker.ts', {
                execArgv: ['--require', 'ts-node/register']
            });
            worker.postMessage({ owner, repo, token, repoURL, repoData, metric });
            worker.on('message', (result) => {
                resolve(result);
                worker.terminate();
            });
            worker.on('error', (error) => {
                console.error('Worker error:', error);
                reject(error);
                worker.terminate();
            });
            worker.on('exit', (code) => {
                if (code !== 0) {
                    reject(new Error(`Worker stopped with exit code ${code}`));
                }
            });
        }
        catch (error) {
            console.error('Error creating worker:', error);
            reject(error);
        }
    });
}
/**
* Main function - fetches repo data and calculates metrics
*/
const main = async (url) => {
    const token = process.env.GITHUB_TOKEN || "";
    const inputURL = url;
    (0, log_1.initLogFile)();
    try {
        const [owner, repo, repoURL] = await (0, urlHandler_1.getRepoDetails)(token, inputURL);
        const repoData = await (0, githubApi_1.fetchRepoData)(owner, repo, token);
        if (!repoData.data) {
            (0, log_1.logToFile)("Error fetching repo data", 1);
            return;
        }
        const metrics = await (0, metric_1.calculateMetrics)(owner, repo, token, repoURL, repoData, inputURL);
        if (metrics == null)
            return;
        (0, log_1.logToFile)(JSON.stringify(metrics, null, 2), 1);
        (0, log_1.metricsLogToStdout)(metrics, 1);
    }
    catch (error) {
        (0, log_1.logToFile)(`Error in main: ${error instanceof Error ? error.message : String(error)}`, 1);
    }
};
exports.main = main;
// Run main when called directly
if (require.main === module) {
    const args = process.argv.slice(2);
    if (args.length > 0) {
        (0, exports.main)(args[0]);
    }
}
//# sourceMappingURL=index.js.map