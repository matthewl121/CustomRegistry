<<<<<<< HEAD
<<<<<<< HEAD
import { Worker } from 'worker_threads';
import { fetchRepoData } from './api/githubApi';
import { getRepoDetails } from './utils/urlHandler';
import { initLogFile, logToFile, metricsLogToStdout } from './utils/log';
import { calculateMetrics } from './metrics/metric';
=======
=======
>>>>>>> 0ded3e0 (phase1 refactor)
/*
    This file is an example logical flow from a URL to
    fetching and parsing repo data and calculating some metrics
*/

import 'dotenv/config';
import { fetchRepoData } from "./api/githubApi";
import { getRepoDetails } from './utils/urlHandler';
import { initLogFile, logToFile, metricsLogToStdout } from './utils/log';
import { Worker } from 'worker_threads';
import { calculateMetrics } from './metricCalcs';
<<<<<<< HEAD
>>>>>>> 37bb102 (reconstruction complete Reconstruct YML File and config file for Successful Compile #43)
=======
=======
import { Worker } from 'worker_threads';
import { fetchRepoData } from './api/githubApi';
import { getRepoDetails } from './utils/urlHandler';
import { initLogFile, logToFile, metricsLogToStdout } from './utils/log';
import { calculateMetrics } from './metrics/metric';
>>>>>>> 8a1d243 (phase1 refactor)
>>>>>>> 0ded3e0 (phase1 refactor)

// CommonJS-style import for dotenv
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

// Function to create and manage worker threads
<<<<<<< HEAD
<<<<<<< HEAD
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
=======
=======
>>>>>>> 0ded3e0 (phase1 refactor)
export function runWorker(owner, repo, token, repoURL, repoData, metric) {
    return new Promise((resolve, reject) => {
        // PATH TO WORKER SCRIPT
        const worker = new Worker('./src/utils/worker.ts');
        
        // SEND DATA TO WORKER AND START THE WORKER
        worker.postMessage({owner, repo, token, repoURL, repoData, metric});

        // GET THE WORKER'S RESULT
        worker.on('message', (result) => {
            resolve(result);
            worker.terminate();
        });

        // HANDLE ERRORS
        worker.on('error', (error) => {
<<<<<<< HEAD
>>>>>>> 7700049 (fixed all syntax for concurrency and main Reconstruct YML File and config file for Successful Compile #43)
=======
=======
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
>>>>>>> 8a1d243 (phase1 refactor)
>>>>>>> 0ded3e0 (phase1 refactor)
            reject(error);
        }
    });
}

<<<<<<< HEAD
<<<<<<< HEAD
// Main function to calculate the metrics
export const main = async (url: string): Promise<void> => {
    const token = process.env.GITHUB_TOKEN || "";
    const inputURL = url;

    initLogFile();

    try {
        const repoDetails = await getRepoDetails(token, inputURL);
        const [owner, repo, repoURL] = repoDetails;
=======
=======
>>>>>>> 0ded3e0 (phase1 refactor)

export const main = async (url) => {
    const token = process.env.GITHUB_TOKEN || "";
    const inputURL = url;
    
    // get repoDetails

    initLogFile();

    const repoDetails = await getRepoDetails(token, inputURL);
    const [owner, repo, repoURL] = repoDetails;
<<<<<<< HEAD
>>>>>>> 7700049 (fixed all syntax for concurrency and main Reconstruct YML File and config file for Successful Compile #43)

=======
=======
// Main function to calculate the metrics
export const main = async (url: string): Promise<void> => {
    const token = process.env.GITHUB_TOKEN || "";
    const inputURL = url;

    initLogFile();

    try {
        const repoDetails = await getRepoDetails(token, inputURL);
        const [owner, repo, repoURL] = repoDetails;
>>>>>>> 8a1d243 (phase1 refactor)

>>>>>>> 0ded3e0 (phase1 refactor)
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