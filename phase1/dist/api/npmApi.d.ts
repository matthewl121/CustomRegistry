/**
* npmApi.ts
* Functions for interacting with NPM registry API to fetch package details
*/
import { ApiResponse } from '../types';
/**
* Fetches and normalizes GitHub repository URL from NPM package
* @param packageName - NPM package name to look up
* @returns Normalized GitHub repo URL or error
*/
export declare const fetchGithubUrlFromNpm: (packageName: string) => Promise<ApiResponse<string | null>>;
//# sourceMappingURL=npmApi.d.ts.map