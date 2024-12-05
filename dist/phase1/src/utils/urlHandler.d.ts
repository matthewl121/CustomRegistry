/**
* urlHandler.ts
* Functions for parsing and extracting information from URLs
*/
/**
* Extracts domain from URL, adding https:// if needed
*/
export declare const extractDomainFromUrl: (url: string) => string | null;
/**
* Extracts package name from NPM URL
*/
export declare const extractNpmPackageName: (npmUrl: string) => string | null;
/**
* Extracts owner and repository name from GitHub URL
*/
export declare const extractGithubOwnerAndRepo: (repoURL: string) => [string, string] | null;
/**
* Processes input URL to get repository details
* Handles both NPM and GitHub URLs
*/
export declare function getRepoDetails(token: string, inputURL: string): Promise<[string, string, string]>;
//# sourceMappingURL=urlHandler.d.ts.map