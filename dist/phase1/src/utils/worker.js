"use strict";
/**
* worker.ts
* Handles calculation of different repository metrics
*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateMetric = calculateMetric;
const log_1 = require("./log");
const busFactor_1 = require("../metrics/busFactor");
const correctness_1 = require("../metrics/correctness");
const responsiveMaintainer_1 = require("../metrics/responsiveMaintainer");
const license_1 = require("../metrics/license");
const rampUp_1 = require("../metrics/rampUp");
const dependencyPinning_1 = require("../metrics/dependencyPinning");
const codeReview_1 = require("../metrics/codeReview");
/**
* Calculates specified metric for a repository
* @param params - Repository and metric parameters
* @returns Score and calculation latency
*/
async function calculateMetric(params) {
    try {
        const { owner, repo, token, repoURL, repoData, metric } = params;
        (0, log_1.logToFile)(`Processing: ${owner}, ${repo}, ${repoURL}, ${metric}`, 2);
        let result;
        const begin = Date.now();
        // Calculate specified metric
        switch (metric) {
            case "busFactor":
                result = await (0, busFactor_1.calcBusFactor)(owner, repo, token);
                break;
            case "correctness":
                result = await (0, correctness_1.calcCorrectness)(repoData);
                break;
            case "rampUp":
                result = await (0, rampUp_1.calcRampUp)(repoData);
                break;
            case "responsiveness":
                result = await (0, responsiveMaintainer_1.calcResponsiveness)(repoData);
                break;
            case "license":
                result = await (0, license_1.calcLicense)(owner, repo, repoURL);
                break;
            case "dependencyPinning":
                result = await (0, dependencyPinning_1.calcDependencyPinning)(owner, repo, token);
                break;
            case "codeReview":
                result = await (0, codeReview_1.calcCodeReview)(owner, repo, token);
                break;
            default:
                throw new Error(`Unknown metric: ${metric}`);
        }
        // Return score and calculation time
        return {
            score: result,
            latency: (Date.now() - begin) / 1000
        };
    }
    catch (error) {
        console.error('Processing error:', error);
        return {
            score: -1,
            latency: 0,
            error: error instanceof Error ? error.message : String(error)
        };
    }
}
// TODO: OLD CONCURRENCY CODE 
// src/utils/worker.ts
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
//# sourceMappingURL=worker.js.map