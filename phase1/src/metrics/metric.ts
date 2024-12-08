/**
 * @fileoverview Main metrics calculator that orchestrates the sequential calculation 
 * of various repository quality metrics and combines them into a weighted net score.
 */

import { logToFile } from '../utils/log';
import { ApiResponse, GraphQLResponse, Metrics } from '../types';
import { calculateNetScore, validateMetricScores } from './netScore';
import { calculateMetric } from '../utils/worker';
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
        owner: string,
        repo: string,
        token: string,
        repoURL: string,
        repoData: ApiResponse<GraphQLResponse | null>,
        inputURL: string
    ): Promise<Metrics | null>;
}

/**
 * Implementation of the MetricsCalculator interface that handles sequential
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
            // Calculate metrics sequentially
            const busFactorResult = await calculateMetric({ 
                owner, repo, token, repoURL, repoData, metric: "busFactor" 
            });
            
            const correctnessResult = await calculateMetric({ 
                owner, repo, token, repoURL, repoData, metric: "correctness" 
            });
            
            const rampUpResult = await calculateMetric({ 
                owner, repo, token, repoURL, repoData, metric: "rampUp" 
            });
            
            const responsivenessResult = await calculateMetric({ 
                owner, repo, token, repoURL, repoData, metric: "responsiveness" 
            });
            
            const licenseResult = await calculateMetric({ 
                owner, repo, token, repoURL, repoData, metric: "license" 
            });
            
            const dependencyPinningResult = await calculateMetric({ 
                owner, repo, token, repoURL, repoData, metric: "dependencyPinning" 
            });
            
            const codeReviewResult = await calculateMetric({ 
                owner, repo, token, repoURL, repoData, metric: "codeReview" 
            });

            // Destructure results
            const {
                score: busFactor,
                latency: busFactorLatency
            } = busFactorResult;
            
            const {
                score: correctness,
                latency: correctnessLatency
            } = correctnessResult;
            
            const {
                score: responsiveness,
                latency: responsivenessLatency
            } = responsivenessResult;
            
            const {
                score: license,
                latency: licenseLatency
            } = licenseResult;
            
            const {
                score: dependencyPinning,
                latency: dependencyPinningLatency
            } = dependencyPinningResult;
            
            const {
                score: codeReview,
                latency: codeReviewLatency
            } = codeReviewResult;

            const {
                score: rampUp,
                latency: rampUpLatency
            } = rampUpResult;

            // Validate metrics
            const scores = {
                busFactor,
                correctness,
                responsiveness,
                license,
                dependencyPinning,
                codeReview,
                rampUp
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
                DependencyPinning: dependencyPinning,
                DependencyPinning_Latency: dependencyPinningLatency,
                CodeReview: codeReview,
                CodeReview_Latency: codeReviewLatency
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