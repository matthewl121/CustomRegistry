// src/utils/worker.ts
import { ApiResponse, GraphQLResponse } from '../types';

const { Worker, parentPort } = require('worker_threads');
const { logToFile } = require('./log');
const { calcBusFactor } = require('../metrics/busFactor');
const { calcCorrectness } = require('../metrics/correctness');
const { calcResponsiveness } = require('../metrics/responsiveMaintainer');
const { calcLicense } = require('../metrics/license');
const { calcRampUp } = require('../metrics/rampUp');
const { calcDependencyPinning } = require('../metrics/dependencyPinning');
const { calcCodeReview } = require('../metrics/codeReview');

interface WorkerParams {
    owner: string;
    repo: string;
    token: string;
    repoURL: string;
    repoData: ApiResponse<GraphQLResponse | null>;
    metric: string;
}

interface WorkerResponse {
    score: number;
    latency: number;
    error?: string;
}

if (!parentPort) {
    throw new Error('This module must be run as a worker');
}

parentPort.on('message', async (params: WorkerParams) => {
    try {
        const begin = Date.now();
        const { owner, repo, token, repoURL, repoData, metric } = params;
        
        logToFile(`Worker: ${owner}, ${repo}, ${repoURL}, ${metric}`, 2);
        
        let result: number;
        
        switch (metric) {
            case "busFactor":
                result = await calcBusFactor(owner, repo, token);
                break;
            case "correctness":
                result = calcCorrectness(repoData);
                break;
            case "rampUp":
                result = await calcRampUp(repoData);
                break;
            case "responsiveness":
                result = calcResponsiveness(repoData);
                break;
            case "license":
                result = await calcLicense(owner, repo, repoURL);
                break;
            case "dependencyPinning":  // Add new case
                result = await calcDependencyPinning(owner, repo, token); 
                break;
            case "codeReview": 
                result = await calcCodeReview(owner, repo, token);
                break;
            default:
                throw new Error(`Unknown metric: ${metric}`);
        }

        const end = Date.now();
        
        const response: WorkerResponse = {
            score: result,
            latency: (end - begin) / 1000
        };
        
        parentPort.postMessage(response);
    } catch (error) {
        logToFile(`Worker error: ${error}`, 1);
        
        const errorResponse: WorkerResponse = {
            score: -1,
            latency: 0,
            error: error instanceof Error ? error.message : String(error)
        };
        
        parentPort.postMessage(errorResponse);
    }
});