"use strict";
/**
 * @fileoverview Main metrics calculator that orchestrates the sequential calculation
 * of various repository quality metrics and combines them into a weighted net score.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateMetrics = exports.metricsCalculator = void 0;
const log_1 = require("../utils/log");
const netScore_1 = require("./netScore");
const worker_1 = require("../utils/worker");
require("./busFactor");
require("./codeReview");
require("./correctness");
require("./dependencyPinning");
require("./license");
require("./rampUp");
require("./responsiveMaintainer");
/**
 * Implementation of the MetricsCalculator interface that handles sequential
 * calculation of all metrics and their aggregation into a final score
 */
exports.metricsCalculator = {
    async calculateMetrics(owner, repo, token, repoURL, repoData, inputURL) {
        try {
            // Calculate metrics sequentially
            const busFactorResult = await (0, worker_1.calculateMetric)({
                owner, repo, token, repoURL, repoData, metric: "busFactor"
            });
            const correctnessResult = await (0, worker_1.calculateMetric)({
                owner, repo, token, repoURL, repoData, metric: "correctness"
            });
            const rampUpResult = await (0, worker_1.calculateMetric)({
                owner, repo, token, repoURL, repoData, metric: "rampUp"
            });
            const responsivenessResult = await (0, worker_1.calculateMetric)({
                owner, repo, token, repoURL, repoData, metric: "responsiveness"
            });
            const licenseResult = await (0, worker_1.calculateMetric)({
                owner, repo, token, repoURL, repoData, metric: "license"
            });
            const dependencyPinningResult = await (0, worker_1.calculateMetric)({
                owner, repo, token, repoURL, repoData, metric: "dependencyPinning"
            });
            const codeReviewResult = await (0, worker_1.calculateMetric)({
                owner, repo, token, repoURL, repoData, metric: "codeReview"
            });
            // Destructure results
            const { score: busFactor, latency: busFactorLatency } = busFactorResult;
            const { score: correctness, latency: correctnessLatency } = correctnessResult;
            const { score: responsiveness, latency: responsivenessLatency } = responsivenessResult;
            const { score: license, latency: licenseLatency } = licenseResult;
            const { score: dependencyPinning, latency: dependencyPinningLatency } = dependencyPinningResult;
            const { score: codeReview, latency: codeReviewLatency } = codeReviewResult;
            const { score: rampUp, latency: rampUpLatency } = rampUpResult;
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
            if (!(0, netScore_1.validateMetricScores)(scores)) {
                (0, log_1.logToFile)("One or more critical metrics could not be calculated", 1);
                return null;
            }
            // Calculate net score
            const { score: netScore, latency: netScoreLatency } = (0, netScore_1.calculateNetScore)(scores);
            // Construct final metrics object
            const metrics = {
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
        }
        catch (error) {
            (0, log_1.logToFile)(`Error in calculateMetrics: ${error instanceof Error ? error.message : String(error)}`, 1);
            return null;
        }
    }
};
// Export the main calculateMetrics function
exports.calculateMetrics = exports.metricsCalculator.calculateMetrics;
//# sourceMappingURL=metric.js.map