/**
* index.ts
* Main entry point for metric calculation system
*/

import { Worker } from 'worker_threads';
import { fetchRepoData } from './api/githubApi';
import { getRepoDetails } from './utils/urlHandler';
import { initLogFile, logToFile, metricsLogToStdout } from './utils/log';
import { calculateMetrics } from './metrics/metric';
import * as workers from './utils/worker';

const dotenv = require('dotenv');
dotenv.config();

/**
* Creates and manages worker thread for metric calculation
*/
export function runWorker(
    owner: string,
    repo: string,
    token: string,
    repoURL: string,
    repoData: any, // Define specific type if possible
    metric: string
) {
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

/**
* Main function - fetches repo data and calculates metrics
*/
export const main = async (url: string) => {
   const token = process.env.GITHUB_TOKEN || "";
   const inputURL = url;
   initLogFile();

   try {
       const [owner, repo, repoURL] = await getRepoDetails(token, inputURL);
       const repoData = await fetchRepoData(owner, repo, token);

       if (!repoData.data) {
           logToFile("Error fetching repo data", 1);
           return;
       }

       const metrics = await calculateMetrics(owner, repo, token, repoURL, repoData, inputURL);
       if (metrics == null) return;

       logToFile(JSON.stringify(metrics, null, 2), 1);
       metricsLogToStdout(metrics, 1);

   } catch (error) {
       logToFile(`Error in main: ${error instanceof Error ? error.message : String(error)}`, 1);
   }
};

// Run main when called directly
if (require.main === module) {
   const args = process.argv.slice(2);
   if (args.length > 0) {
       main(args[0]);
   }
}