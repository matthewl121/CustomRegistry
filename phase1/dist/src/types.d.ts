export interface PullRequestDetails {
    additions: number;
}
export interface ContributorResponse {
    total: number;
    author: {
        login: string;
    };
}
export interface NpmApiResponse {
    repository: {
        url: string;
    };
}
export interface ApiResponse<T> {
    data: T | null;
    error: string | null;
}
export interface LicenseInfo {
    key: string;
    name: string;
    spdxId: string;
    url: string;
}
export interface Readme {
    text: string;
}
export interface OpenIssueNode {
    createdAt: string;
    updatedAt: string;
    closedAt: string | null;
}
export interface ClosedIssueNode {
    createdAt: string;
    updatedAt: string;
    closedAt: string;
}
export interface OpenIssues {
    totalCount: number;
    nodes: OpenIssueNode[];
}
export interface ClosedIssues {
    totalCount: number;
    nodes: ClosedIssueNode[];
}
export interface PullRequestNode {
    createdAt: string;
    updatedAt: string;
    closedAt: string | null;
}
export interface PullRequests {
    totalCount: number;
    nodes?: PullRequestNode[];
}
export interface examplesFolder {
    entries: {
        name: string;
        type: string;
    }[];
}
export interface RepositoryResponse {
    licenseInfo: LicenseInfo;
    readme: Readme;
    openIssues: OpenIssues;
    closedIssues: ClosedIssues;
    pullRequests: PullRequests;
    isArchived: boolean;
    examplesFolder: examplesFolder;
}
export interface GraphQLResponse {
    data: {
        repository: RepositoryResponse;
    };
}
export interface Metrics {
    URL: string;
    NetScore: number;
    NetScore_Latency: number;
    RampUp: number;
    RampUp_Latency: number;
    Correctness: number;
    Correctness_Latency: number;
    BusFactor: number;
    BusFactor_Latency: number;
    ResponsiveMaintainer: number;
    ResponsiveMaintainer_Latency: number;
    License: number;
    License_Latency: number;
    DependencyPinning: number;
    DependencyPinning_Latency: number;
    CodeReview: number;
    CodeReview_Latency: number;
}
export interface WorkerResult {
    score: number;
    latency: number;
}
//# sourceMappingURL=types.d.ts.map