/**
 * @fileoverview Calculates a repository's responsiveness score based on how quickly and effectively
 * maintainers handle issues and pull requests within the last month. The score is weighted equally
 * between issue and PR management.
 */
import { ApiResponse, GraphQLResponse, ClosedIssueNode, OpenIssueNode, PullRequestNode } from '../types';
/**
 * Entry point for responsiveness metric calculation
 * @param repoData - Repository data from GitHub API response
 * @returns number - Returns score between 0 and 1, or -1 if data is unavailable
 *   0 = Poor responsiveness or archived repository
 *   1 = Excellent responsiveness (all issues/PRs handled)
 *   -1 = Unable to calculate due to missing data
 */
export declare function calcResponsiveness(repoData: ApiResponse<GraphQLResponse | null>): number;
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
export declare function calcResponsivenessScore(closedIssues: ClosedIssueNode[], openIssues: OpenIssueNode[], pullRequests: PullRequestNode[], sinceDate: Date, isArchived: boolean): number;
//# sourceMappingURL=responsiveMaintainer.d.ts.map