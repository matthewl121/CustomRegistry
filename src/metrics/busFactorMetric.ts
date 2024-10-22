// src/metrics/busFactorMetric.ts
import { ContributorResponse } from '../types';
import { fetchContributorActivity } from '../api/githubApi';

export async function calcBusFactor(owner: string, repo: string, token: string): Promise<number> {
    const contributorActivity = await fetchContributorActivity(owner, repo, token);
    if (!contributorActivity?.data || !Array.isArray(contributorActivity.data)) {
        return -1;
    }
    return calcBusFactorScore(contributorActivity.data);
}

export function calcBusFactorScore(contributorActivity: ContributorResponse[]): number {
    if (!contributorActivity) {
        return 0;
    }

    let totalCommits = 0;
    let totalContributors = 0;
    for (const contributor of contributorActivity) {
        totalCommits += contributor.total;
        ++totalContributors;
    }

    const threshold = Math.ceil(totalCommits * 0.5);
    let curr = 0;
    let busFactor = 0;

    for (let i = contributorActivity.length - 1; i >= 0; i--) {
        curr += contributorActivity[i].total;
        busFactor++;
        if (curr >= threshold) break;
    }

    const averageBusFactor = 3;
    if (busFactor > 9) return 1;
    return 1 - Math.exp(-(busFactor ** 2) / (2 * averageBusFactor ** 2));
}
