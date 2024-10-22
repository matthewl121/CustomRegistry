// src/metrics/metricCalcs.ts
const { logToFile } = require('../utils/log');
const { calcBusFactor, calcBusFactorScore } = require('./busFactorMetric');
const { calcCorrectness, calcCorrectnessScore } = require('./correctnessMetric');
const { calcResponsiveness, calcResponsivenessScore } = require('./responsivenessMetric');
const { calcLicense, calcLicenseScore } = require('./licenseMetric');
const { calcRampUp } = require('./rampUpMetric');

import { ApiResponse, GraphQLResponse, Metrics } from '../types';

async function calculateMetrics(
    owner: string, 
    repo: string, 
    token: string, 
    repoURL: string, 
    repoData: ApiResponse<GraphQLResponse | null>, 
    inputURL: string
): Promise<Metrics | null> {
    try {
        // Create workers for each metric calculation
        const workers = require('../index');
        const runWorker = workers.runWorker;

        const busFactorWorker = runWorker(owner, repo, token, repoURL, repoData, "busFactor");
        const correctnessWorker = runWorker(owner, repo, token, repoURL, repoData, "correctness");
        const rampUpWorker = runWorker(owner, repo, token, repoURL, repoData, "rampUp");
        const responsivenessWorker = runWorker(owner, repo, token, repoURL, repoData, "responsiveness");
        const licenseWorker = runWorker(owner, repo, token, repoURL, repoData, "license");

        const results = await Promise.all([
            busFactorWorker, 
            correctnessWorker, 
            rampUpWorker, 
            responsivenessWorker, 
            licenseWorker
        ]);

        const [
            { score: busFactor, latency: busFactorLatency },
            { score: correctness, latency: correctnessLatency },
            { score: rampUp, latency: rampUpLatency },
            { score: responsiveness, latency: responsivenessLatency },
            { score: license, latency: licenseLatency }
        ] = results;

        if (correctness === -1) {
            logToFile("Unable to calculate correctness", 1);
            return null;
        }
        if (responsiveness === -1) {
            logToFile("Unable to calculate responsiveness", 1);
            return null;
        }

        const begin = Date.now();
        const netScore = (busFactor * 0.25) + 
                        (correctness * 0.30) + 
                        (rampUp * 0.20) + 
                        (responsiveness * 0.15) + 
                        (license * 0.10);
        const end = Date.now();

        const metrics: Metrics = {
            URL: inputURL,
            NetScore: netScore,
            NetScore_Latency: (end - begin) / 1000,
            RampUp: rampUp,
            RampUp_Latency: rampUpLatency,
            Correctness: correctness,
            Correctness_Latency: correctnessLatency,
            BusFactor: busFactor,
            BusFactor_Latency: busFactorLatency,
            ResponsiveMaintainer: responsiveness,
            ResponsiveMaintainer_Latency: responsivenessLatency,
            License: license,
            License_Latency: licenseLatency
        };

        return metrics;
    } catch (error) {
        logToFile(`Error in calculateMetrics: ${error instanceof Error ? error.message : String(error)}`, 1);
        return null;
    }
}

module.exports = {
    calcBusFactor,
    calcBusFactorScore,
    calcCorrectness,
    calcCorrectnessScore,
    calcResponsiveness,
    calcResponsivenessScore,
    calcLicense,
    calcLicenseScore,
    calcRampUp,
    calculateMetrics
};
