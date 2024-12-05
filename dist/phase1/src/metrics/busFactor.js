"use strict";
/**
 * @fileoverview Calculates a repository's bus factor score based on contributor commit distribution
 * Bus factor represents the minimum number of developers that would need to leave a project
 * to significantly impact its maintenance. Higher scores indicate less risk from developer departure.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.calcBusFactor = calcBusFactor;
exports.calcBusFactorScore = calcBusFactorScore;
const githubApi_1 = require("../api/githubApi");
/**
 * Entry point for bus factor calculation
 * @param owner - Repository owner's username
 * @param repo - Repository name
 * @param token - GitHub API token for authentication
 * @returns Promise<number> - Returns score between 0 and 1, or -1 if data fetch fails
 */
async function calcBusFactor(owner, repo, token) {
    const contributorActivity = await (0, githubApi_1.fetchContributorActivity)(owner, repo, token);
    // Return -1 if we couldn't fetch valid contributor data
    if (!contributorActivity?.data || !Array.isArray(contributorActivity.data)) {
        return -1;
    }
    return calcBusFactorScore(contributorActivity.data);
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
function calcBusFactorScore(contributorActivity) {
    if (!contributorActivity) {
        return 0;
    }
    // Calculate total commits and number of contributors
    let totalCommits = 0;
    let totalContributors = 0;
    for (const contributor of contributorActivity) {
        totalCommits += contributor.total;
        ++totalContributors;
    }
    // Set threshold at 50% of total commits
    // This determines how many contributors it takes to account for half of all commits
    const threshold = Math.ceil(totalCommits * 0.5);
    // Count contributors needed to reach threshold
    let curr = 0;
    let busFactor = 0;
    for (let i = contributorActivity.length - 1; i >= 0; i--) {
        curr += contributorActivity[i].total;
        busFactor++;
        if (curr >= threshold)
            break;
    }
    // Constants for score calculation
    const averageBusFactor = 3; // Expected average number of key contributors
    // If bus factor is very high (>9), return perfect score
    if (busFactor > 9)
        return 1;
    // Calculate normalized score using Gaussian function
    // Score approaches 1 as bus factor increases
    return 1 - Math.exp(-(busFactor ** 2) / (2 * averageBusFactor ** 2));
}
//# sourceMappingURL=busFactor.js.map