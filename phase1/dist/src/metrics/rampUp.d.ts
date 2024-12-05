/**
 * @fileoverview Calculates a repository's ramp-up score based on documentation quality
 * This metric evaluates how easily new developers can start contributing to the project
 */
import { ApiResponse, GraphQLResponse } from '../types';
/**
 * Calculates the ramp-up score for a repository based on README presence and examples
 * @param repoData - Repository data from GitHub API response
 * @returns Promise<number> - Score between 0 and 1, where higher values indicate better onboarding
 */
export declare function calcRampUp(repoData: ApiResponse<GraphQLResponse | null>): Promise<number>;
//# sourceMappingURL=rampUp.d.ts.map