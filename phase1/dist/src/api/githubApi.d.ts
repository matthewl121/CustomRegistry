/**
* githubApi.ts
* Functions for interacting with GitHub's REST and GraphQL APIs to fetch repository data
*/
import { ApiResponse, GraphQLResponse, ContributorResponse } from '../types';
export declare const fetchPackageJson: (owner: string, repo: string, token: string) => Promise<ApiResponse<any>>;
export declare const fetchCodeReviewActivity: (owner: string, repo: string, token: string) => Promise<{
    linesIntroduced: number;
    totalLines: number;
    error: string | null;
}>;
export declare const fetchContributorActivity: (owner: string, repo: string, token: string) => Promise<ApiResponse<ContributorResponse[] | null>>;
export declare const fetchRepoData: (owner: string, repo: string, token: string) => Promise<ApiResponse<GraphQLResponse | null>>;
export declare const checkFolderExists: (owner: string, repo: string, token?: string) => Promise<boolean>;
export declare const getReadmeDetails: (readMe: string, examplesFolder: any) => Promise<number>;
//# sourceMappingURL=githubApi.d.ts.map