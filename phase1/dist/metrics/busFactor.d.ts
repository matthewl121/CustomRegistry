/**
 * @fileoverview Calculates a repository's bus factor score based on contributor commit distribution
 * Bus factor represents the minimum number of developers that would need to leave a project
 * to significantly impact its maintenance. Higher scores indicate less risk from developer departure.
 */
import { ContributorResponse } from '../types';
/**
 * Entry point for bus factor calculation
 * @param owner - Repository owner's username
 * @param repo - Repository name
 * @param token - GitHub API token for authentication
 * @returns Promise<number> - Returns score between 0 and 1, or -1 if data fetch fails
 */
export declare function calcBusFactor(owner: string, repo: string, token: string): Promise<number>;
/**
 * Calculates the bus factor score based on contributor commit distribution
 * Uses a Gaussian function to normalize the score between 0 and 1
 *
 * @param contributorActivity - Array of contributor data with commit counts
 * @returns number - Score between 0 and 1, where:
 *   0 = High risk (few contributors make most commits)
 *   1 = Low risk (commits evenly distributed across many contributors)
 */
export declare function calcBusFactorScore(contributorActivity: ContributorResponse[]): number;
//# sourceMappingURL=busFactor.d.ts.map