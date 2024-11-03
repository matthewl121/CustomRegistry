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

import { logToFile } from '../utils/log';

// Define weights as constants for maintainability
export const METRIC_WEIGHTS = {
    BUS_FACTOR: 0.20,
    CORRECTNESS: 0.25,
    RAMP_UP: 0.15,
    RESPONSIVENESS: 0.10,
    LICENSE: 0.05,
    DEPENDENCY_PINNING: 0.10,
    CODE_REVIEW: 0.10
    
} as const;

/**
 * Interface for score calculation input
 */
export interface ScoreInput {
    busFactor: number;
    correctness: number;
    rampUp: number;
    responsiveness: number;
    license: number;
    dependencypinning: number;
    codereview: number;
}

/**
 * Calculates the weighted net score from individual metric scores
 * @param scores Object containing individual metric scores
 * @returns Object containing the net score and calculation latency in seconds
 */
export function calculateNetScore(scores: ScoreInput): { 
    score: number;
    latency: number;
} {
    try {
        const begin = Date.now();
        
        // Calculate weighted sum
        const netScore = (scores.busFactor * METRIC_WEIGHTS.BUS_FACTOR) +
                        (scores.correctness * METRIC_WEIGHTS.CORRECTNESS) +
                        (scores.rampUp * METRIC_WEIGHTS.RAMP_UP) +
                        (scores.responsiveness * METRIC_WEIGHTS.RESPONSIVENESS) +
                        (scores.license * METRIC_WEIGHTS.LICENSE) + 
                        (scores.dependencypinning * METRIC_WEIGHTS.DEPENDENCY_PINNING)+
                        (scores.codereview * METRIC_WEIGHTS.CODE_REVIEW);
        
        const end = Date.now();
        
        return {
            score: netScore,
            latency: (end - begin) / 1000  // Convert to seconds
        };
    } catch (error) {
        logToFile(`Error in calculateNetScore: ${error instanceof Error ? error.message : String(error)}`, 1);
        return {
            score: -1,
            latency: 0
        };
    }
}

/**
 * Validates that all required metrics are present and valid
 * @param scores Object containing individual metric scores
 * @returns boolean indicating if scores are valid
 */
export function validateMetricScores(scores: ScoreInput): boolean {
    // Check if any critical metrics are invalid (-1 indicates calculation failure)
    return scores.correctness !== -1 && 
           scores.responsiveness !== -1 &&
           scores.busFactor !== -1 &&
           scores.rampUp !== -1 &&
           scores.license !== -1 &&
           scores.dependencypinning !== -1 &&
           scores.codereview !== -1;
}