// Interface for contributor data from GitHub API
export interface ContributorResponse {
    total: number;
    author: {
        login: string;
    }
}

// Interface for NPM API response
export interface NpmApiResponse {
    repository: {
        url: string;
    };
}

// API response interface
export interface ApiResponse<T> {
    data: T | null;
    error: string | null;
}

// Interface for license information
export interface LicenseInfo {
    key: string;
    name: string;
    spdxId: string;
    url: string;
}

// Interface for repository README
export interface Readme {
    text: string;
}

// Interface for open issue data
export interface OpenIssueNode {
    createdAt: string;
    updatedAt: string;
    closedAt: string | null;
}

// Interface for closed issue data
export interface ClosedIssueNode {
    createdAt: string;
    updatedAt: string;
    closedAt: string;
}

// Interface for open issues collection
export interface OpenIssues {
    totalCount: number;
    nodes: OpenIssueNode[];
}

// Interface for closed issues collection
export interface ClosedIssues {
    totalCount: number;
    nodes: ClosedIssueNode[];
}

// Interface for pull request data
export interface PullRequestNode {
    createdAt: string;
    updatedAt: string;
    closedAt: string | null;
}

// Interface for pull requests collection
export interface PullRequests {
    totalCount: number;
    nodes?: PullRequestNode[];
}

// Interface for examples folder content
export interface examplesFolder {
    entries: {
        name: string;
        type: string;
    }[];
}

// Interface for repository response from GitHub API
export interface RepositoryResponse {
    licenseInfo: LicenseInfo;
    readme: Readme;
    openIssues: OpenIssues;
    closedIssues: ClosedIssues;
    pullRequests: PullRequests;
    isArchived: boolean;
    examplesFolder: examplesFolder;
}

// Interface for GraphQL response containing repository data
export interface GraphQLResponse {
    data: {
        repository: RepositoryResponse;
    }
}

// Interface for metrics data
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
    DependencyPinning: number;         // New metric
    DependencyPinning_Latency: number; // New metric
}

// Interface for worker result
export interface WorkerResult {
    score: number;
    latency: number;
}