// src/metrics/responsivenessMetric.ts
import { ApiResponse, GraphQLResponse, ClosedIssueNode, OpenIssueNode, PullRequestNode } from '../types';

export function calcResponsiveness(repoData: ApiResponse<GraphQLResponse | null>): number {
    const recentPullRequests = repoData.data?.data.repository.pullRequests;
    const isArchived = repoData.data?.data.repository.isArchived;
    const totalOpenIssues = repoData.data?.data.repository.openIssues;
    const totalClosedIssues = repoData.data?.data.repository.closedIssues;
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    if (!recentPullRequests?.nodes || !totalClosedIssues?.nodes || !totalOpenIssues?.nodes) {
        return -1;
    }
    return calcResponsivenessScore(
        totalClosedIssues.nodes, 
        totalOpenIssues.nodes, 
        recentPullRequests.nodes, 
        oneMonthAgo, 
        isArchived ?? false
    );
}

export function calcResponsivenessScore(
    closedIssues: ClosedIssueNode[], 
    openIssues: OpenIssueNode[], 
    pullRequests: PullRequestNode[],
    sinceDate: Date,
    isArchived: boolean
): number {
    if (isArchived) return 0;

    let openIssueCount = 0;
    let closedIssueCount = 0;
    let openPRCount = 0;
    let closedPRCount = 0;

    for (let i = 0; i < Math.max(pullRequests.length, openIssues.length, closedIssues.length); ++i) {
        if (i < pullRequests.length && new Date(pullRequests[i].createdAt) >= sinceDate && !pullRequests[i].closedAt) {
            openPRCount++;
        }
        if (i < pullRequests.length && new Date(pullRequests[i].createdAt) >= sinceDate && pullRequests[i].closedAt) {
            closedPRCount++;
        }
        if (i < openIssues.length && new Date(openIssues[i].createdAt) >= sinceDate) {
            openIssueCount++;
        }
        if (i < closedIssues.length && new Date(closedIssues[i].createdAt) >= sinceDate) {
            closedIssueCount++;
        }
    }

    const totalRecentIssues = openIssueCount + closedIssueCount;
    const totalRecentPRs = openPRCount + closedPRCount;

    const issueCloseRatio = totalRecentIssues > 0 ? closedIssueCount / totalRecentIssues : 0;
    const prCloseRatio = totalRecentPRs > 0 ? closedPRCount / totalRecentPRs : 0;
    
    return 0.5 * issueCloseRatio + 0.5 * prCloseRatio;
}
