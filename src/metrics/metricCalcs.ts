/**
 * @fileoverview Main metrics calculator that orchestrates the calculation of various
 * repository quality metrics and combines them into a weighted net score.
 * 
 * Metrics included:
 * - Bus Factor (25%): Risk assessment based on contributor distribution
 * - Correctness (30%): Quality assessment based on issue resolution
 * - Ramp Up (20%): Ease of onboarding new contributors
 * - Responsiveness (15%): Maintainer activity and response time
 * - License (10%): Presence and clarity of licensing
 */

import { logToFile } from '../utils/log';
import { calcBusFactor, calcBusFactorScore } from './busFactorMetric';
import { calcCorrectness, calcCorrectnessScore } from './correctnessMetric';
import { calcResponsiveness, calcResponsivenessScore } from './responsivenessMetric';
import { calcLicense, calcLicenseScore } from './licenseMetric';
import { calcRampUp } from './rampUpMetric';
import { ApiResponse, GraphQLResponse, Metrics } from '../types';
import { runWorker } from '../index';

/**
 * Interface defining the contract for metrics calculation
 */
export interface MetricsCalculator {
    calculateMetrics(
        owner: string,           // Repository owner
        repo: string,           // Repository name
        token: string,          // GitHub API token
        repoURL: string,        // Repository URL
        repoData: ApiResponse<GraphQLResponse | null>,  // Repository data from GitHub API
        inputURL: string        // Original input URL
    ): Promise<Metrics | null>;
}

/**
 * Implementation of the MetricsCalculator interface that handles parallel
 * calculation of all metrics and their aggregation into a final score
 */
export const metricsCalculator: MetricsCalculator = {
    async calculateMetrics(
        owner: string,
        repo: string,
        token: string,
        repoURL: string,
        repoData: ApiResponse<GraphQLResponse | null>,
        inputURL: string
    ): Promise<Metrics | null> {
        try {
            // Launch parallel workers for each metric calculation
            const busFactorWorker = runWorker(owner, repo, token, repoURL, repoData, "busFactor");
            const correctnessWorker = runWorker(owner, repo, token, repoURL, repoData, "correctness");
            const rampUpWorker = runWorker(owner, repo, token, repoURL, repoData, "rampUp");
            const responsivenessWorker = runWorker(owner, repo, token, repoURL, repoData, "responsiveness");
            const licenseWorker = runWorker(owner, repo, token, repoURL, repoData, "license");

            // Wait for all metric calculations to complete
            const results = await Promise.all([
                busFactorWorker,
                correctnessWorker,
                rampUpWorker,
                responsivenessWorker,
                licenseWorker
            ]);

            // Destructure results into scores and latencies
            const [
                { score: busFactor, latency: busFactorLatency },
                { score: correctness, latency: correctnessLatency },
                { score: rampUp, latency: rampUpLatency },
                { score: responsiveness, latency: responsivenessLatency },
                { score: license, latency: licenseLatency }
            ] = results;

            // Validate critical metrics
            if (correctness === -1) {
                logToFile("Unable to calculate correctness", 1);
                return null;
            }
            if (responsiveness === -1) {
                logToFile("Unable to calculate responsiveness", 1);
                return null;
            }

            // Calculate weighted net score
            const begin = Date.now();
            const netScore = (busFactor * 0.25) +        // 25% weight
                           (correctness * 0.30) +         // 30% weight
                           (rampUp * 0.20) +             // 20% weight
                           (responsiveness * 0.15) +      // 15% weight
                           (license * 0.10);              // 10% weight
            const end = Date.now();

            // Construct final metrics object
            const metrics: Metrics = {
                URL: inputURL,
                NetScore: netScore,
                NetScore_Latency: (end - begin) / 1000,  // Convert to seconds
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
};

// Export individual metric functions for standalone use
export {
    calcBusFactor,
    calcBusFactorScore,
    calcCorrectness,
    calcCorrectnessScore,
    calcResponsiveness,
    calcResponsivenessScore,
    calcLicense,
    calcLicenseScore,
    calcRampUp
};

// Export the main calculateMetrics function
export const { calculateMetrics } = metricsCalculator;
