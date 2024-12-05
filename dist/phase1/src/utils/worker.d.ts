/**
* worker.ts
* Handles calculation of different repository metrics
*/
import { ApiResponse, GraphQLResponse } from '../types';
interface MetricParams {
    owner: string;
    repo: string;
    token: string;
    repoURL: string;
    repoData: ApiResponse<GraphQLResponse | null>;
    metric: string;
}
interface MetricResponse {
    score: number;
    latency: number;
    error?: string;
}
/**
* Calculates specified metric for a repository
* @param params - Repository and metric parameters
* @returns Score and calculation latency
*/
export declare function calculateMetric(params: MetricParams): Promise<MetricResponse>;
export {};
//# sourceMappingURL=worker.d.ts.map