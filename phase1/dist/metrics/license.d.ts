/**
 * @fileoverview Calculates a repository's license score by checking for license information
 * in various standard locations. The score is binary (0 or 1) indicating presence/absence
 * of licensing information.
 */
/**
 * Entry point for license metric calculation
 * @param owner - Repository owner's username
 * @param repo - Repository name
 * @param repoURL - Full URL to the repository
 * @returns Promise<number> - Returns 1 if license is found, 0 otherwise
 */
export declare function calcLicense(owner: string, repo: string, repoURL: string): Promise<number>;
/**
 * Calculates the license score by checking multiple potential license locations
 * @param repoUrl - URL of the repository to analyze
 * @param localDir - Local directory path where repository will be cloned
 * @returns Promise<number> - Returns 1 if license is found, 0 otherwise
 */
export declare function calcLicenseScore(repoUrl: string, localDir: string): Promise<number>;
//# sourceMappingURL=license.d.ts.map