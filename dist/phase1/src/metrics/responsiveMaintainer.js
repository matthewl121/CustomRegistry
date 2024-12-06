"use strict";
/**
 * @fileoverview Calculates a repository's responsiveness score based on how quickly and effectively
 * maintainers handle issues and pull requests within the last month. The score is weighted equally
 * between issue and PR management.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.calcResponsiveness = calcResponsiveness;
exports.calcResponsivenessScore = calcResponsivenessScore;
/**
 * Entry point for responsiveness metric calculation
 * @param repoData - Repository data from GitHub API response
 * @returns number - Returns score between 0 and 1, or -1 if data is unavailable
 *   0 = Poor responsiveness or archived repository
 *   1 = Excellent responsiveness (all issues/PRs handled)
 *   -1 = Unable to calculate due to missing data
 */
function calcResponsiveness(repoData) {
    const recentPullRequests = repoData.data?.data.repository.pullRequests;
    const isArchived = repoData.data?.data.repository.isArchived;
    const totalOpenIssues = repoData.data?.data.repository.openIssues;
    const totalClosedIssues = repoData.data?.data.repository.closedIssues;
    // Calculate date threshold for recent activity (1 month ago)
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    // Validate required data is available
    if (!recentPullRequests?.nodes || !totalClosedIssues?.nodes || !totalOpenIssues?.nodes) {
        return -1;
    }
    return calcResponsivenessScore(totalClosedIssues.nodes, totalOpenIssues.nodes, recentPullRequests.nodes, oneMonthAgo, isArchived ?? false);
}
/**
 * Calculates the responsiveness score based on issue and PR resolution rates
 * @param closedIssues - Array of closed issues
 * @param openIssues - Array of open issues
 * @param pullRequests - Array of pull requests (both open and closed)
 * @param sinceDate - Date threshold for considering recent activity
 * @param isArchived - Whether the repository is archived
 * @returns number - Score between 0 and 1, where:
 *   0 = No recent issues/PRs closed or archived repository
 *   1 = All recent issues and PRs have been handled
 *
 * The final score is calculated as:
 * (0.5 * issue_close_ratio) + (0.5 * pr_close_ratio)
 */
function calcResponsivenessScore(closedIssues, openIssues, pullRequests, sinceDate, isArchived) {
    // Archived repositories automatically get a 0 score
    if (isArchived)
        return 0;
    // Initialize counters for recent activity
    let openIssueCount = 0;
    let closedIssueCount = 0;
    let openPRCount = 0;
    let closedPRCount = 0;
    // Count recent issues and PRs
    // Using single loop for efficiency over all arrays
    for (let i = 0; i < Math.max(pullRequests.length, openIssues.length, closedIssues.length); ++i) {
        // Count open PRs created since threshold date
        if (i < pullRequests.length && new Date(pullRequests[i].createdAt) >= sinceDate && !pullRequests[i].closedAt) {
            openPRCount++;
        }
        // Count closed PRs created since threshold date
        if (i < pullRequests.length && new Date(pullRequests[i].createdAt) >= sinceDate && pullRequests[i].closedAt) {
            closedPRCount++;
        }
        // Count open issues created since threshold date
        if (i < openIssues.length && new Date(openIssues[i].createdAt) >= sinceDate) {
            openIssueCount++;
        }
        // Count closed issues created since threshold date
        if (i < closedIssues.length && new Date(closedIssues[i].createdAt) >= sinceDate) {
            closedIssueCount++;
        }
    }
    // Calculate totals and ratios
    const totalRecentIssues = openIssueCount + closedIssueCount;
    const totalRecentPRs = openPRCount + closedPRCount;
    // Calculate close ratios (defaulting to 0 if no issues/PRs)
    const issueCloseRatio = totalRecentIssues > 0 ? closedIssueCount / totalRecentIssues : 0;
    const prCloseRatio = totalRecentPRs > 0 ? closedPRCount / totalRecentPRs : 0;
    // Return weighted average of issue and PR close ratios
    return 0.5 * issueCloseRatio + 0.5 * prCloseRatio;
}
//# sourceMappingURL=responsiveMaintainer.js.map