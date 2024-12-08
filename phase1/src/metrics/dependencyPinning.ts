import { logToFile } from '../utils/log';
import { fetchPackageJson } from '../api/githubApi';

interface Dependencies {
    [key: string]: string;
}

/**
 * Checks if a version string is pinned to at least a major+minor version
 * Valid formats include:
 * - Exact versions (1.2.3)
 * - Minor version ranges (1.2.x, 1.2.*)
 * - Tilde ranges (~1.2.0)
 */
export const isVersionPinned = (version: string): boolean => {
    try {
        // Handle null/undefined versions
        if (!version) {
            return false;
        }

        // Remove whitespace and normalize
        const normalizedVersion = version.trim();

        // Check for exact versions (1.2.3)
        if (/^\d+\.\d+\.\d+$/.test(normalizedVersion)) {
            return true;
        }

        // Check for minor version ranges (1.2.x, 1.2.*)
        if (/^\d+\.\d+\.[x*]$/.test(normalizedVersion)) {
            return true;
        }

        // Check for tilde ranges (~1.2.0)
        if (/^~\d+\.\d+\.\d+$/.test(normalizedVersion)) {
            return true;
        }

        // Check for caret ranges with exact minor version (^1.2.3)
        if (/^\^(\d+\.\d+\.\d+)$/.test(normalizedVersion)) {
            return true;
        }

        // Check for greater than or equal to a specific version (>=1.2.3)
        if (/^>=\d+\.\d+\.\d+$/.test(normalizedVersion)) {
            return true;
        }

        // Check for less than or equal to a specific version (<=1.2.3)
        if (/^<=\d+\.\d+\.\d+$/.test(normalizedVersion)) {
            return true;
        }

        // Check for greater than a specific version (>1.2.3)
        if (/^>\d+\.\d+\.\d+$/.test(normalizedVersion)) {
            return true;
        }

        // Check for less than a specific version (<1.2.3)
        if (/^<\d+\.\d+\.\d+$/.test(normalizedVersion)) {
            return true;
        }

        // Check for hyphen ranges (1.2.3 - 2.3.4)
        if (/^\d+\.\d+\.\d+ - \d+\.\d+\.\d+$/.test(normalizedVersion)) {
            return true;
        }

        // Everything else (including *, latest, and complex ranges) is considered not pinned
        return false;
    } catch (error) {
        logToFile(`Error in isVersionPinned: ${error}`, 1);
        return false;
    }
};

/**
 * Calculate raw dependency pinning score from package.json data
 * - the more pinned dependencies, the better the score
 */
export async function calcDependencyPinningScore(packageJson: any): Promise<number> {
    try {
        const dependencies: Dependencies = {
            ...(packageJson.data.dependencies || {}),
            ...(packageJson.data.devDependencies || {}),
            ...(packageJson.data.peerDependencies || {})
        };

        const totalDeps = Object.keys(dependencies).length;

        // If no dependencies, return perfect score
        if (totalDeps === 0) {
            return 1.0;
        }

        // Count pinned dependencies
        const pinnedDeps = Object.entries(dependencies)
            .filter(([_, version]) => isVersionPinned(version as string))
            .length;

        return pinnedDeps / totalDeps;
    } catch (error) {
        logToFile(`Error in calcDependencyPinningScore: ${error}`, 1);
        return 0;
    }
}

/**
 * Calculate dependency pinning metric from repository data
 */
export async function calcDependencyPinning(owner: string, repo: string, token: string): Promise<number> {
    try {
        const packageJson = await fetchPackageJson(owner, repo, token);

        if (!packageJson || !packageJson.data) {
            logToFile("No package.json found in repository", 1);
            return 1.0; // No dependencies = perfect score
        }

        const score = await calcDependencyPinningScore(packageJson);
        return score;
    } catch (error) {
        logToFile(`Error in calcDependencyPinning: ${error}`, 1);
        return 0;
    }
}