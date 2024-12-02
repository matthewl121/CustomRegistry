// // src/utils/worker.ts
// import { ApiResponse, GraphQLResponse } from '../types';

// const { Worker, parentPort } = require('worker_threads');
// const { logToFile } = require('./log');
// const { calcBusFactor } = require('../metrics/busFactor');
// const { calcCorrectness } = require('../metrics/correctness');
// const { calcResponsiveness } = require('../metrics/responsiveMaintainer');
// const { calcLicense } = require('../metrics/license');
// const { calcRampUp } = require('../metrics/rampUp');
// const { calcDependencyPinning } = require('../metrics/dependencyPinning');
// const { calcCodeReview } = require('../metrics/codeReview');

// interface WorkerParams {
//     owner: string;
//     repo: string;
//     token: string;
//     repoURL: string;
//     repoData: ApiResponse<GraphQLResponse | null>;
//     metric: string;
// }

// interface WorkerResponse {
//     score: number;
//     latency: number;
//     error?: string;
// }

// if (!parentPort) {
//     throw new Error('This module must be run as a worker');
// }

// // TODO: THIS IS WHERE THE ERROR IS COMING FROM
// parentPort.on('message', async (params: WorkerParams) => {
//     try {
//         const begin = Date.now();
       
//         const { owner, repo, token, repoURL, repoData, metric } = params;
//         console.log(params);

//         logToFile(`Worker: ${owner}, ${repo}, ${repoURL}, ${metric}`, 2);
        
//         let result: number;
        
//         switch (metric) {
//             case "busFactor":
//                 result = await calcBusFactor(owner, repo, token);
//                 break;
//             case "correctness":
//                 result = await calcCorrectness(repoData);
//                 break;
//             case "rampUp":
//                 result = await calcRampUp(repoData);
//                 break;
//             case "responsiveness":
//                 result = await calcResponsiveness(repoData);
//                 break;
//             case "license":
//                 result = await calcLicense(owner, repo, repoURL);
//                 break;
//             case "dependencyPinning":  // Add new case
//                 result = await calcDependencyPinning(owner, repo, token); 
//                 break;
//             case "codeReview": 
//                 result = await calcCodeReview(owner, repo, token);
//                 break;
//             default:
//                 throw new Error(`Unknown metric: ${metric}`);
//         }

//         const end = Date.now();
        
//         const response: WorkerResponse = {
//             score: result,
//             latency: (end - begin) / 1000
//         };
//         console.log('Response');
//         console.log(response);
        
//         parentPort.postMessage(response);
//         console.log(metric);
//     } catch (error) {
//         console.log('Worker error IN WORKER.TS');
//         console.error('Worker error:', error);
        
//         const errorResponse: WorkerResponse = {
//             score: -1,
//             latency: 0,
//             error: error instanceof Error ? error.message : String(error)
//         };
        
//         parentPort.postMessage(errorResponse);
//     }
// });
import { ApiResponse, GraphQLResponse } from '../types';
import { logToFile } from './log';
import { calcBusFactor } from '../metrics/busFactor';
import { calcCorrectness } from '../metrics/correctness';
import { calcResponsiveness } from '../metrics/responsiveMaintainer';
import { calcLicense } from '../metrics/license';
import { calcRampUp } from '../metrics/rampUp';
import { calcDependencyPinning } from '../metrics/dependencyPinning';
import { calcCodeReview } from '../metrics/codeReview';

interface MetricParams {
    owner: string;
    repo: string;
    token: string;
    repoURL: string;
    repoData: ApiResponse<GraphQLResponse | null>;
    metric: string;
}

interface MetricResponse {
    score: number;
    latency: number;
    error?: string;
}

export async function calculateMetric(params: MetricParams): Promise<MetricResponse> {
    try {
        const { owner, repo, token, repoURL, repoData, metric } = params;
        logToFile(`Processing: ${owner}, ${repo}, ${repoURL}, ${metric}`, 2);
        
        let result: number;
        const begin = Date.now(); // Moved here to measure just the calculation time
        
        switch (metric) {
            case "busFactor":
                result = await calcBusFactor(owner, repo, token);
                break;
            case "correctness":
                result = await calcCorrectness(repoData);
                break;
            case "rampUp":
                result = await calcRampUp(repoData);
                break;
            case "responsiveness":
                result = await calcResponsiveness(repoData);
                break;
            case "license":
                result = await calcLicense(owner, repo, repoURL);
                break;
            case "dependencyPinning":
                result = await calcDependencyPinning(owner, repo, token);
                break;
            case "codeReview":
                result = await calcCodeReview(owner, repo, token);
                break;
            default:
                throw new Error(`Unknown metric: ${metric}`);
        }
        
        const end = Date.now();
        const response: MetricResponse = {
            score: result,
            latency: (end - begin) / 1000  // This now measures just the calculation time
        };
        
        return response;
    } catch (error) {
        console.error('Processing error:', error);
        return {
            score: -1,
            latency: 0,
            error: error instanceof Error ? error.message : String(error)
        };
    }
}