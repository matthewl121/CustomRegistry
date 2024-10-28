"use strict";
/**
 * @fileoverview Handles the calculation of the weighted net score for repository metrics.
 * Combines individual metric scores using defined weights to produce an overall quality score.
 *
 * Score weights:
 * - Bus Factor: 25% - Risk assessment based on contributor distribution
 * - Correctness: 30% - Quality assessment based on issue resolution
 * - Ramp Up: 20% - Ease of onboarding new contributors
 * - Responsiveness: 15% - Maintainer activity and response time
 * - License: 10% - Presence and clarity of licensing
 */
exports.__esModule = true;
exports.validateMetricScores = exports.calculateNetScore = exports.METRIC_WEIGHTS = void 0;
var log_1 = require("../utils/log");
// Define weights as constants for maintainability
exports.METRIC_WEIGHTS = {
    BUS_FACTOR: 0.25,
    CORRECTNESS: 0.30,
    RAMP_UP: 0.20,
    RESPONSIVENESS: 0.15,
    LICENSE: 0.10
};
/**
 * Calculates the weighted net score from individual metric scores
 * @param scores Object containing individual metric scores
 * @returns Object containing the net score and calculation latency in seconds
 */
function calculateNetScore(scores) {
    try {
        var begin = Date.now();
        // Calculate weighted sum
        var netScore = (scores.busFactor * exports.METRIC_WEIGHTS.BUS_FACTOR) +
            (scores.correctness * exports.METRIC_WEIGHTS.CORRECTNESS) +
            (scores.rampUp * exports.METRIC_WEIGHTS.RAMP_UP) +
            (scores.responsiveness * exports.METRIC_WEIGHTS.RESPONSIVENESS) +
            (scores.license * exports.METRIC_WEIGHTS.LICENSE);
        var end = Date.now();
        return {
            score: netScore,
            latency: (end - begin) / 1000 // Convert to seconds
        };
    }
    catch (error) {
        (0, log_1.logToFile)("Error in calculateNetScore: ".concat(error instanceof Error ? error.message : String(error)), 1);
        return {
            score: -1,
            latency: 0
        };
    }
}
exports.calculateNetScore = calculateNetScore;
/**
 * Validates that all required metrics are present and valid
 * @param scores Object containing individual metric scores
 * @returns boolean indicating if scores are valid
 */
function validateMetricScores(scores) {
    // Check if any critical metrics are invalid (-1 indicates calculation failure)
    return scores.correctness !== -1 &&
        scores.responsiveness !== -1 &&
        scores.busFactor !== -1 &&
        scores.rampUp !== -1 &&
        scores.license !== -1;
}
exports.validateMetricScores = validateMetricScores;
