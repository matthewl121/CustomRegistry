"use strict";
/**
 * @fileoverview Calculates a repository's correctness score based on the ratio of closed to total issues
 * This metric assumes that a higher ratio of closed issues indicates better code correctness
 * and more active issue management.
 */
exports.__esModule = true;
exports.calcCorrectnessScore = exports.calcCorrectness = void 0;
/**
 * Entry point for correctness metric calculation
 * @param repoData - Repository data from GitHub API response
 * @returns number - Returns score between 0 and 1, or -1 if data is unavailable
 *   0 = Poor correctness (low ratio of closed issues)
 *   1 = High correctness (high ratio of closed issues or no issues)
 *   -1 = Unable to calculate due to missing data
 */
function calcCorrectness(repoData) {
    var _a, _b;
    var totalOpenIssues = (_a = repoData.data) === null || _a === void 0 ? void 0 : _a.data.repository.openIssues;
    var totalClosedIssues = (_b = repoData.data) === null || _b === void 0 ? void 0 : _b.data.repository.closedIssues;
    // Return -1 if we can't access issue counts
    if (!totalOpenIssues || !totalClosedIssues) {
        return -1;
    }
    return calcCorrectnessScore(totalOpenIssues.totalCount, totalClosedIssues.totalCount);
}
exports.calcCorrectness = calcCorrectness;
/**
 * Calculates the correctness score based on issue resolution ratio
 * @param totalOpenIssuesCount - Number of currently open issues
 * @param totalClosedIssuesCount - Number of resolved/closed issues
 * @returns number - Score between 0 and 1, where:
 *   0 = All issues are open
 *   1 = All issues are closed, or repository has no issues
 *
 * Note: A score of 1 for repositories with no issues assumes that
 * no reported issues indicates correct functionality, though this
 * could also indicate low usage or poor issue reporting practices.
 */
function calcCorrectnessScore(totalOpenIssuesCount, totalClosedIssuesCount) {
    // Calculate total number of issues (open + closed)
    var totalIssues = totalOpenIssuesCount + totalClosedIssuesCount;
    // Perfect score if no issues exist
    if (totalIssues === 0) {
        return 1;
    }
    // Calculate ratio of closed issues to total issues
    return totalClosedIssuesCount / totalIssues;
}
exports.calcCorrectnessScore = calcCorrectnessScore;
