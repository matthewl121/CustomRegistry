/**
 * @fileoverview Main metrics calculator that orchestrates the calculation of various
 * repository quality metrics and combines them into a weighted net score.
 */

import { logToFile } from '../utils/log';
import { ApiResponse, GraphQLResponse, Metrics } from '../types';
import { runWorker } from '../index';
import { calculateNetScore, validateMetricScores } from './netScore';
import './busFactor';
import './codeReview';
import './correctness';
import './dependencyPinning';
import './license';
import './rampUp';
import './responsiveMaintainer';

/**
 * Interface defining the contract for metrics calculation
 */
export interface MetricsCalculator {
    calculateMetrics(
        owner: string,          // Repository owner
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
            const busFactorWorker = runWorker(owner, repo, token, repoURL, repoData, "busFactor"); // Calculate Bus Factor
            const correctnessWorker = runWorker(owner, repo, token, repoURL, repoData, "correctness"); // Calculate Correctness
            const rampUpWorker = runWorker(owner, repo, token, repoURL, repoData, "rampUp"); // Calculate Ramp Up
            const responsivenessWorker = runWorker(owner, repo, token, repoURL, repoData, "responsiveness"); // Calculate Responsiveness
            const licenseWorker = runWorker(owner, repo, token, repoURL, repoData, "license"); // Calculate License 
            const dependencyPinningWorker = runWorker(owner, repo, token, repoURL, repoData, "dependencyPinning"); // Calculate Dependency Pinning
            const codeReviewWorker = runWorker(owner, repo, token, repoURL, repoData, "codeReview"); // Calculate Code Review

            // Wait for all metric calculations to complete
            const results = await Promise.all([
                busFactorWorker,
                correctnessWorker,
                rampUpWorker,
                responsivenessWorker,
                licenseWorker,
                dependencyPinningWorker,
                codeReviewWorker
            ]);

            // Destructure results into scores and latencies
            const [
                { score: busFactor, latency: busFactorLatency },
                { score: correctness, latency: correctnessLatency },
                { score: rampUp, latency: rampUpLatency },
                { score: responsiveness, latency: responsivenessLatency },
                { score: license, latency: licenseLatency },
                { score: dependencyPinning, latency: dependencyPinningLatency },
                { score: codeReview, latency: codeReviewLatency } 
            ] = results;

            // Validate metrics
            const scores = {
                busFactor,
                correctness,
                rampUp,
                responsiveness,
                license,
                dependencyPinning,
                codeReview
            };

            if (!validateMetricScores(scores)) {
                logToFile("One or more critical metrics could not be calculated", 1);
                return null;
            }

            // Calculate net score
            const { score: netScore, latency: netScoreLatency } = calculateNetScore(scores);

            // Construct final metrics object
            const metrics: Metrics = {
                URL: inputURL,
                NetScore: netScore,
                NetScore_Latency: netScoreLatency,
                RampUp: rampUp,
                RampUp_Latency: rampUpLatency,
                Correctness: correctness,
                Correctness_Latency: correctnessLatency,
                BusFactor: busFactor,
                BusFactor_Latency: busFactorLatency,
                ResponsiveMaintainer: responsiveness,
                ResponsiveMaintainer_Latency: responsivenessLatency,
                License: license,
                License_Latency: licenseLatency,
                DependencyPinning: dependencyPinning,                // Add new metric
                DependencyPinning_Latency: dependencyPinningLatency,  // Add new metric
                CodeReview: codeReview,                              // Add new metric
                CodeReview_Latency: codeReviewLatency                // Add new metric
            };

            return metrics;
        } catch (error) {
            logToFile(`Error in calculateMetrics: ${error instanceof Error ? error.message : String(error)}`, 1);
            return null;
        }
    }
};

// Export the main calculateMetrics function
export const { calculateMetrics } = metricsCalculator;