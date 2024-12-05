/**
 * Checks if a version string is pinned to at least a major+minor version
 * Valid formats include:
 * - Exact versions (1.2.3)
 * - Minor version ranges (1.2.x, 1.2.*)
 * - Tilde ranges (~1.2.0)
 */
export declare const isVersionPinned: (version: string) => boolean;
/**
 * Calculate raw dependency pinning score from package.json data
 * - the more pinned dependencies, the better the score
 */
export declare function calcDependencyPinningScore(packageJson: any): Promise<number>;
/**
 * Calculate dependency pinning metric from repository data
 */
export declare function calcDependencyPinning(owner: string, repo: string, token: string): Promise<number>;
//# sourceMappingURL=dependencyPinning.d.ts.map