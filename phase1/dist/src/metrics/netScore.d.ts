/**
 * @fileoverview Handles the calculation of the weighted net score for repository metrics.
 * Combines individual metric scores using defined weights to produce an overall quality score.
 *
 * Score weights:
 * - Bus Factor: 20% - Risk assessment based on contributor distribution
 * - Correctness: 25% - Quality assessment based on issue resolution
 * - Ramp Up: 15% - Ease of onboarding new contributors
 * - Responsiveness: 10% - Maintainer activity and response time
 * - License: 5% - Presence and clarity of licensing
 * - Dependency Pinnning: 10% - Presence and clarity of licensing
 * - Code Review: 10% - Presence and clarity of licensing
 */
export declare const METRIC_WEIGHTS: {
    readonly BUS_FACTOR: 0.2;
    readonly CORRECTNESS: 0.25;
    readonly RAMP_UP: 0.15;
    readonly RESPONSIVENESS: 0.1;
    readonly LICENSE: 0.05;
    readonly DEPENDENCY_PINNING: 0.1;
    readonly CODE_REVIEW: 0.1;
};
/**
 * Interface for score calculation input
 */
export interface ScoreInput {
    busFactor: number;
    correctness: number;
    rampUp: number;
    responsiveness: number;
    license: number;
    dependencyPinning: number;
    codeReview: number;
}
/**
 * Calculates the weighted net score from individual metric scores
 * @param scores Object containing individual metric scores
 * @returns Object containing the net score and calculation latency in seconds
 */
export declare function calculateNetScore(scores: ScoreInput): {
    score: number;
    latency: number;
};
/**
 * Validates that all required metrics are present and valid
 * @param scores Object containing individual metric scores
 * @returns boolean indicating if scores are valid
 */
export declare function validateMetricScores(scores: ScoreInput): boolean;
//# sourceMappingURL=netScore.d.ts.map