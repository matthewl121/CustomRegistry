/**
 * @fileoverview Main metrics calculator that orchestrates the sequential calculation
 * of various repository quality metrics and combines them into a weighted net score.
 */
import { ApiResponse, GraphQLResponse, Metrics } from '../types';
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
    calculateMetrics(owner: string, repo: string, token: string, repoURL: string, repoData: ApiResponse<GraphQLResponse | null>, inputURL: string): Promise<Metrics | null>;
}
/**
 * Implementation of the MetricsCalculator interface that handles sequential
 * calculation of all metrics and their aggregation into a final score
 */
export declare const metricsCalculator: MetricsCalculator;
export declare const calculateMetrics: (owner: string, repo: string, token: string, repoURL: string, repoData: ApiResponse<GraphQLResponse | null>, inputURL: string) => Promise<Metrics | null>;
//# sourceMappingURL=metric.d.ts.map