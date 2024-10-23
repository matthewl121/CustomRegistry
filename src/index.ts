// // src/index.ts
// const dotenv = require('dotenv');
// dotenv.config();

// import { Worker } from 'worker_threads';
// import { WorkerResult } from './types';
// import { ApiResponse, GraphQLResponse } from './types';
// import { fetchRepoData } from "./api/githubApi";
// import { getRepoDetails } from './utils/urlHandler';
// import { initLogFile, logToFile, metricsLogToStdout } from './utils/log';
// import { calculateMetrics } from './metrics/metricCalcs';
// import { init } from 'isomorphic-git';

// // Function to create and manage worker threads
// export function runWorker(
//     owner: string, 
//     repo: string, 
//     token: string, 
//     repoURL: string, 
//     repoData: ApiResponse<GraphQLResponse | null>, 
//     metric: string
// ): Promise<WorkerResult> {
//     return new Promise((resolve, reject) => {
//         try {
//             // Use TypeScript file path
//             const worker = new Worker('./src/utils/worker.ts', {
//                 execArgv: ['--require', 'ts-node/register']
//             });
            
//             worker.postMessage({owner, repo, token, repoURL, repoData, metric});

//             worker.on('message', (result: WorkerResult) => {
//                 resolve(result);
//                 worker.terminate();
//             });

//             worker.on('error', (error) => {
//                 console.error('Worker error:', error);
//                 reject(error);
//                 worker.terminate();
//             });

//             worker.on('exit', (code) => {
//                 if (code !== 0) {
//                     reject(new Error(`Worker stopped with exit code ${code}`));
//                 }
//             });
//         } catch (error) {
//             console.error('Error creating worker:', error);
//             reject(error);
//         }
//     });
// }

// export const main = async (url: string) => {
//     const token: string = process.env.GITHUB_TOKEN || "";
//     const inputURL: string = url;

//     initLogFile();

//     const repoDetails = await getRepoDetails(token, inputURL);
//     const [owner, repo, repoURL]: [string, string, string] = repoDetails;

//     const repoData = await fetchRepoData(owner, repo, token);
//     if (!repoData.data) {
//         logToFile("Error fetching repo data", 1);
//         return;
//     }

//     let metrics = await calculateMetrics(owner, repo, token, repoURL, repoData, inputURL);
//     if (metrics == null) {
//         return;
//     }

//     logToFile(JSON.stringify(metrics, null, 2), 1);
//     metricsLogToStdout(metrics, 1);
// };

// if (require.main === module) {
//     const args = process.argv.slice(2);
//     if (args.length > 0) {
//         main(args[0]);
//     }
// }







import { Worker } from 'worker_threads';
import { fetchRepoData } from './api/githubApi';
import { getRepoDetails } from './utils/urlHandler';
import { initLogFile, logToFile, metricsLogToStdout } from './utils/log';
import { calculateMetrics } from './metrics/metricCalcs';

// CommonJS-style import for dotenv
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

// Function to create and manage worker threads
export function runWorker(
    owner: string, 
    repo: string, 
    token: string, 
    repoURL: string, 
    repoData: any, 
    metric: string
): Promise<any> {
    return new Promise((resolve, reject) => {
        try {
            const worker = new Worker('./src/utils/worker.ts', {
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
        } catch (error) {
            console.error('Error creating worker:', error);
            reject(error);
        }
    });
}

// Main function to calculate the metrics
export const main = async (url: string): Promise<void> => {
    const token = process.env.GITHUB_TOKEN || "";
    const inputURL = url;

    initLogFile();

    try {
        const repoDetails = await getRepoDetails(token, inputURL);
        const [owner, repo, repoURL] = repoDetails;

        const repoData = await fetchRepoData(owner, repo, token);
        if (!repoData.data) {
            logToFile("Error fetching repo data", 1);
            return;
        }

        const metrics = await calculateMetrics(owner, repo, token, repoURL, repoData, inputURL);
        if (metrics == null) {
            return;
        }

        logToFile(JSON.stringify(metrics, null, 2), 1);
        metricsLogToStdout(metrics, 1);
    } catch (error) {
        logToFile(`Error in main: ${error instanceof Error ? error.message : String(error)}`, 1);
    }
};

// Entry point when the script is run directly
if (require.main === module) {
    const args = process.argv.slice(2);
    if (args.length > 0) {
        main(args[0]);
    }
}
