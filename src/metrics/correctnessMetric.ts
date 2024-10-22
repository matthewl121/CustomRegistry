// src/metrics/correctnessMetric.ts
import { ApiResponse, GraphQLResponse } from '../types';

export function calcCorrectness(repoData: ApiResponse<GraphQLResponse | null>): number {
    const totalOpenIssues = repoData.data?.data.repository.openIssues;
    const totalClosedIssues = repoData.data?.data.repository.closedIssues;

    if (!totalOpenIssues || !totalClosedIssues) {
        return -1;
    }
    return calcCorrectnessScore(totalOpenIssues.totalCount, totalClosedIssues.totalCount);
}

export function calcCorrectnessScore(totalOpenIssuesCount: number, totalClosedIssuesCount: number): number {
    const totalIssues = totalOpenIssuesCount + totalClosedIssuesCount;
    if (totalIssues === 0) {
        return 1;
    }
    return totalClosedIssuesCount / totalIssues;
}