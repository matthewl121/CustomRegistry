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


// Function to create and manage worker threads
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
            reject(error);
            worker.terminate();
        });

        // EXIT
        worker.on('exit', (code) => {
            if (code !== 0) {
                reject(new Error(`Worker stopped with exit code ${code}`));
            }
        });
    });
}


export const main = async (url) => {
    const token = process.env.GITHUB_TOKEN || "";
    const inputURL = url;
    
    // get repoDetails

    initLogFile();

    const repoDetails = await getRepoDetails(token, inputURL);
    const [owner, repo, repoURL] = repoDetails;

    /* 
        Now that the repo owner (owner) and repo name (repo) have
        been parsed, we can use the github api to calc metrics
    */
   const repoData = await fetchRepoData(owner, repo, token);
   if (!repoData.data) {
       logToFile("Error fetching repo data", 1); 
       return;
    }

    // calculate all metrics (concurrently)
    let metrics = await calculateMetrics(owner, repo, token, repoURL, repoData, inputURL);
    if (metrics == null) {
        return;
    }

    // logMetrics
    logToFile(JSON.stringify(metrics, null, 2), 1);
    // print metrics to stdout
    metricsLogToStdout(metrics, 1);
}
