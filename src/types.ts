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
    URL: string | null; // Added URL field to the Metrics class
    NetScore: number | null;
    NetScore_Latency: number | null;
    RampUp: number | null;
    RampUp_Latency: number | null;
    Correctness: number | null;
    Correctness_Latency: number | null;
    BusFactor: number | null;
    BusFactor_Latency: number | null;
    ResponsiveMaintainer: number | null;
    ResponsiveMaintainer_Latency: number | null;
    License: number | null;
    License_Latency: number | null;
}

// Interface for worker result
export interface WorkerResult {
    score: number;
    latency: number;
}