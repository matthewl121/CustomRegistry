/**
 * @fileoverview Calculates a repository's bus factor score based on contributor commit distribution
 * Bus factor represents the minimum number of developers that would need to leave a project
 * to significantly impact its maintenance. Higher scores indicate less risk from developer departure.
 */

import { PullRequestDetails } from '../types';
import { fetchCodeReviewActivity } from '../api/githubApi';

/**
 * Entry point for bus factor calculation
 * @param owner - Repository owner's username
 * @param repo - Repository name
 * @param token - GitHub API token for authentication
 * @returns Promise<number> - Returns score between 0 and 1, or -1 if data fetch fails
 */
// THIS HAS TO BE CALLED AFTER CACULATING LICENSE SCORE
// because this calculation uses the cloned repo to count the number of total lines
export async function calcCodeReview(owner: string, repo: string, token: string): Promise<number> {
    let codeReview;

    // get number of lines introduced and total lines in repo
    const codeReviewActivity = await fetchCodeReviewActivity(owner, repo, token);
    if (!codeReviewActivity.linesIntroduced || !codeReviewActivity.totalLines) {
        return 0;
    }
    
    // get score
    codeReview = calcCodeReviewScore(codeReviewActivity.linesIntroduced, codeReviewActivity.totalLines);

    return codeReview;
}

/**
 * Calculates the bus factor score based on contributor commit distribution
 * Uses a Gaussian function to normalize the score between 0 and 1
 * 
 * @param contributorActivity - Array of contributor data with commit counts
 * @returns number - Score between 0 and 1, where:
 *   0 = High risk (few contributors make most commits)
 *   1 = Low risk (commits evenly distributed across many contributors)
 */
export const calcCodeReviewScore = (linesIntroduced: number, totalLines: number): number => {
    // the bigger the fraction, the better

    let linesPulledFraction = linesIntroduced / totalLines;

    // Define a constant to control the curve's steepness
    const k = Math.log(2); // ≈ 0.69314718056

    // Calculate the score using an exponential growth formula
    const score = 1 - Math.exp(-k * linesPulledFraction);

    // Ensure the score is bounded between 0 and 1
    return Math.min(Math.max(score, 0), 1);
};
