/**
* index.ts
* Main entry point for metric calculation system
*/
/**
* Creates and manages worker thread for metric calculation
*/
export declare function runWorker(owner: string, repo: string, token: string, repoURL: string, repoData: any, // Define specific type if possible
metric: string): Promise<unknown>;
/**
* Main function - fetches repo data and calculates metrics
*/
export declare const main: (url: string) => Promise<void>;
//# sourceMappingURL=index.d.ts.map