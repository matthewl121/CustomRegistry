// src/metrics/dependencyPinning.ts
import { ApiResponse, GraphQLResponse } from '../types';
import { logToFile } from '../utils/log';
import { apiGetRequest } from '../api/apiUtils';

interface Dependencies {
    [key: string]: string;
}

/**
 * Checks if a version string is pinned to at least a major+minor version
 * Valid formats include:
 * - Exact versions: "2.3.4"
 * - Minor version ranges: "2.3.x", "2.3.*", "~2.3.0"
 * - Caret ranges with minor version: "^2.3.0"
 */
export const isVersionPinned = (version: string): boolean => {
    // Remove any leading special characters (^, ~, =, v)
    const cleanVersion = version.replace(/^[~^=v]/, '');

    // Check for exact versions (1.2.3)
    if (/^\d+\.\d+\.\d+$/.test(cleanVersion)) {
        return true;
    }

    // Check for minor version ranges (1.2.x, 1.2.*)
    if (/^\d+\.\d+\.[x*]$/.test(cleanVersion)) {
        return true;
    }

    // Check for ranges that specify minor version
    if (/^\d+\.\d+\./.test(cleanVersion)) {
        return true;
    }

    return false;
};

/**
 * Fetches package.json content using GitHub API
 */
const fetchPackageJson = async (owner: string, repo: string, token: string): Promise<any> => {
    const url = `https://api.github.com/repos/${owner}/${repo}/contents/package.json`;
    const response = await apiGetRequest<any>(url, token);
    
    if (response.error || !response.data || !response.data.content) {
        return null;
    }

    try {
        // GitHub API returns content as base64 encoded
        const content = Buffer.from(response.data.content, 'base64').toString();
        return JSON.parse(content);
    } catch (error) {
        logToFile(`Error parsing package.json: ${error}`, 2);
        return null;
    }
};

/**
 * Calculates the fraction of dependencies that are pinned to at least a major+minor version
 * @param owner Repository owner
 * @param repo Repository name
 * @param token GitHub API token
 * @returns Score between 0 and 1
 */
export const calcDependencyPinning = async (
    owner: string,
    repo: string,
    token: string
): Promise<number> => {
    try {
        const packageJson = await fetchPackageJson(owner, repo, token);
        
        if (!packageJson) {
            logToFile(`No package.json found for ${owner}/${repo}`, 2);
            return 1.0; // If no package.json, treat as having no dependencies
        }

        const dependencies: Dependencies = {
            ...(packageJson.dependencies || {}),
            ...(packageJson.devDependencies || {})
        };

        const totalDeps = Object.keys(dependencies).length;

        // If there are no dependencies, return perfect score
        if (totalDeps === 0) {
            logToFile(`No dependencies found for ${owner}/${repo}`, 2);
            return 1.0;
        }

        // Count pinned dependencies
        const pinnedDeps = Object.entries(dependencies)
            .filter(([name, version]) => {
                const isPinned = isVersionPinned(version as string);
                logToFile(`Dependency ${name}@${version} is ${isPinned ? 'pinned' : 'not pinned'}`, 2);
                return isPinned;
            })
            .length;

        const score = pinnedDeps / totalDeps;
        logToFile(`Dependency pinning score: ${score} (${pinnedDeps}/${totalDeps} dependencies pinned)`, 2);
        return score;

    } catch (error) {
        logToFile(`Error calculating dependency pinning: ${error instanceof Error ? error.message : String(error)}`, 1);
        return 0;
    }
};
