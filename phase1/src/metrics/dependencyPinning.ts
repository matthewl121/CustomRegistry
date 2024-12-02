// // // // src/metrics/dependencyPinning.ts
// // import { ApiResponse, GraphQLResponse } from '../types';
// // import { logToFile } from '../utils/log';
// // import { apiGetRequest } from '../api/apiUtils';

// // interface Dependencies {
// //     [key: string]: string;
// // }

// // /**
// //  * Checks if a version string is pinned to at least a major+minor version
// //  * Valid formats include:
// //  * - Exact versions: "2.3.4"
// //  * - Minor version ranges: "2.3.x", "2.3.*", "~2.3.0"
// //  * - Caret ranges with minor version: "^2.3.0"
// //  */
// // export const isVersionPinned = (version: string): boolean => {
// //     // Remove any leading special characters (^, ~, =, v)
// //     const cleanVersion = version.replace(/^[~^=v]/, '');

// //     // Check for exact versions (1.2.3)
// //     if (/^\d+\.\d+\.\d+$/.test(cleanVersion)) {
// //         return true;
// //     }

// //     // Check for minor version ranges (1.2.x, 1.2.*)
// //     if (/^\d+\.\d+\.[x*]$/.test(cleanVersion)) {
// //         return true;
// //     }

// //     // Check for ranges that specify minor version
// //     if (/^\d+\.\d+\./.test(cleanVersion)) {
// //         return true;
// //     }

// //     return false;
// // };

// // /**
// //  * Fetches package.json content using GitHub API
// //  */
// // const fetchPackageJson = async (owner: string, repo: string, token: string): Promise<any> => {
// //     const url = `https://api.github.com/repos/${owner}/${repo}/contents/package.json`;
// //     const response = await apiGetRequest<any>(url, token);
    
// //     if (response.error || !response.data || !response.data.content) {
// //         return null;
// //     }

// //     try {
// //         // GitHub API returns content as base64 encoded
// //         const content = Buffer.from(response.data.content, 'base64').toString();
// //         return JSON.parse(content);
// //     } catch (error) {
// //         logToFile(`Error parsing package.json: ${error}`, 2);
// //         return null;
// //     }
// // };

// // /**
// //  * Calculates the fraction of dependencies that are pinned to at least a major+minor version
// //  * @param owner Repository owner
// //  * @param repo Repository name
// //  * @param token GitHub API token
// //  * @returns Score between 0 and 1
// //  */
// // export const calcDependencyPinning = async (
// //     owner: string,
// //     repo: string,
// //     token: string
// // ): Promise<number> => {
// //     try {
// //         const packageJson = await fetchPackageJson(owner, repo, token);
        
// //         if (!packageJson) {
// //             logToFile(`No package.json found for ${owner}/${repo}`, 2);
// //             return 1.0; // If no package.json, treat as having no dependencies
// //         }

// //         const dependencies: Dependencies = {
// //             ...(packageJson.dependencies || {}),
// //             ...(packageJson.devDependencies || {})
// //         };

// //         const totalDeps = Object.keys(dependencies).length;

// //         // If there are no dependencies, return perfect score
// //         if (totalDeps === 0) {
// //             logToFile(`No dependencies found for ${owner}/${repo}`, 2);
// //             return 1.0;
// //         }

// //         // Count pinned dependencies
// //         const pinnedDeps = Object.entries(dependencies)
// //             .filter(([name, version]) => {
// //                 const isPinned = isVersionPinned(version as string);
// //                 logToFile(`Dependency ${name}@${version} is ${isPinned ? 'pinned' : 'not pinned'}`, 2);
// //                 return isPinned;
// //             })
// //             .length;

// //         const score = pinnedDeps / totalDeps;
// //         logToFile(`Dependency pinning score: ${score} (${pinnedDeps}/${totalDeps} dependencies pinned)`, 2);
// //         return score;

// //     } catch (error) {
// //         logToFile(`Error calculating dependency pinning: ${error instanceof Error ? error.message : String(error)}`, 1);
// //         return 0;
// //     }
// // };

// // src/metrics/dependencyPinning.ts
// import { ApiResponse, GraphQLResponse } from '../types';
// import { logToFile } from '../utils/log';

// interface Dependencies {
//     [key: string]: string;
// }

// /**
//  * Checks if a version string is pinned to at least a major+minor version
//  * Valid formats include:
//  * - Exact versions (1.2.3)
//  * - Minor version ranges (1.2.x, 1.2.*)
//  * - Tilde ranges (~1.2.0)
//  */
// export const isVersionPinned = (version: string): boolean => {
//     try {
//         // Handle null/undefined versions
//         if (!version) {
//             return false;
//         }

//         // Remove whitespace and normalize
//         const normalizedVersion = version.trim();

//         // Check for exact versions (1.2.3)
//         if (/^\d+\.\d+\.\d+$/.test(normalizedVersion)) {
//             return true;
//         }

//         // Check for minor version ranges (1.2.x, 1.2.*)
//         if (/^\d+\.\d+\.[x*]$/.test(normalizedVersion)) {
//             return true;
//         }

//         // Check for tilde ranges (~1.2.0)
//         if (/^~\d+\.\d+\.\d+$/.test(normalizedVersion)) {
//             return true;
//         }

//         // Everything else (including ^1.0.0) is considered not pinned
//         return false;
//     } catch (error) {
//         logToFile(`Error in isVersionPinned: ${error}`, 2);
//         return false;
//     }
// };

// /**
//  * Calculate raw dependency pinning score from package.json data
//  */
// export function calcDependencyPinningScore(packageJson: any): number {
//     try {
//         const dependencies: Dependencies = {
//             ...(packageJson.dependencies || {}),
//             ...(packageJson.devDependencies || {})
//         };

//         const totalDeps = Object.keys(dependencies).length;

//         // If no dependencies, return perfect score
//         if (totalDeps === 0) {
//             return 1.0;
//         }

//         // Count pinned dependencies
//         const pinnedDeps = Object.entries(dependencies)
//             .filter(([_, version]) => isVersionPinned(version as string))
//             .length;

//         return pinnedDeps / totalDeps;
//     } catch (error) {
//         logToFile(`Error in calcDependencyPinningScore: ${error}`, 1);
//         return 0;
//     }
// }

// /**
//  * Calculate dependency pinning metric from repository data
//  */
// export function calcDependencyPinning(repoData: ApiResponse<GraphQLResponse | null>): number {
//     try {
//         // Get package.json from GraphQL response
//         const packageJsonText = repoData?.data?.data?.repository?.object?.text;
        
//         if (!packageJsonText) {
//             logToFile("No package.json found in repository", 2);
//             return 1.0; // No dependencies = perfect score
//         }

//         let packageJson;
//         try {
//             packageJson = JSON.parse(packageJsonText);
//         } catch (error) {
//             logToFile(`Error parsing package.json: ${error}`, 1);
//             return 0;
//         }

//         const score = calcDependencyPinningScore(packageJson);
//         return Number(score) || 0; // Ensure we return a number
//     } catch (error) {
//         logToFile(`Error in calcDependencyPinning: ${error}`, 1);
//         return 0;
//     }
// }
// // // src/metrics/dependencyPinning.ts
// import { ApiResponse, GraphQLResponse } from '../types';
// import { logToFile } from '../utils/log';
// import { apiGetRequest } from '../api/apiUtils';

// interface Dependencies {
//     [key: string]: string;
// }

// /**
//  * Checks if a version string is pinned to at least a major+minor version
//  * Valid formats include:
//  * - Exact versions: "2.3.4"
//  * - Minor version ranges: "2.3.x", "2.3.*", "~2.3.0"
//  * - Caret ranges with minor version: "^2.3.0"
//  */
// export const isVersionPinned = (version: string): boolean => {
//     // Remove any leading special characters (^, ~, =, v)
//     const cleanVersion = version.replace(/^[~^=v]/, '');

//     // Check for exact versions (1.2.3)
//     if (/^\d+\.\d+\.\d+$/.test(cleanVersion)) {
//         return true;
//     }

//     // Check for minor version ranges (1.2.x, 1.2.*)
//     if (/^\d+\.\d+\.[x*]$/.test(cleanVersion)) {
//         return true;
//     }

//     // Check for ranges that specify minor version
//     if (/^\d+\.\d+\./.test(cleanVersion)) {
//         return true;
//     }

//     return false;
// };

// /**
//  * Fetches package.json content using GitHub API
//  */
// const fetchPackageJson = async (owner: string, repo: string, token: string): Promise<any> => {
//     const url = `https://api.github.com/repos/${owner}/${repo}/contents/package.json`;
//     const response = await apiGetRequest<any>(url, token);
    
//     if (response.error || !response.data || !response.data.content) {
//         return null;
//     }

//     try {
//         // GitHub API returns content as base64 encoded
//         const content = Buffer.from(response.data.content, 'base64').toString();
//         return JSON.parse(content);
//     } catch (error) {
//         logToFile(`Error parsing package.json: ${error}`, 2);
//         return null;
//     }
// };

// /**
//  * Calculates the fraction of dependencies that are pinned to at least a major+minor version
//  * @param owner Repository owner
//  * @param repo Repository name
//  * @param token GitHub API token
//  * @returns Score between 0 and 1
//  */
// export const calcDependencyPinning = async (
//     owner: string,
//     repo: string,
//     token: string
// ): Promise<number> => {
//     try {
//         const packageJson = await fetchPackageJson(owner, repo, token);
        
//         if (!packageJson) {
//             logToFile(`No package.json found for ${owner}/${repo}`, 2);
//             return 1.0; // If no package.json, treat as having no dependencies
//         }

//         const dependencies: Dependencies = {
//             ...(packageJson.dependencies || {}),
//             ...(packageJson.devDependencies || {})
//         };

//         const totalDeps = Object.keys(dependencies).length;

//         // If there are no dependencies, return perfect score
//         if (totalDeps === 0) {
//             logToFile(`No dependencies found for ${owner}/${repo}`, 2);
//             return 1.0;
//         }

//         // Count pinned dependencies
//         const pinnedDeps = Object.entries(dependencies)
//             .filter(([name, version]) => {
//                 const isPinned = isVersionPinned(version as string);
//                 logToFile(`Dependency ${name}@${version} is ${isPinned ? 'pinned' : 'not pinned'}`, 2);
//                 return isPinned;
//             })
//             .length;

//         const score = pinnedDeps / totalDeps;
//         logToFile(`Dependency pinning score: ${score} (${pinnedDeps}/${totalDeps} dependencies pinned)`, 2);
//         return score;

//     } catch (error) {
//         logToFile(`Error calculating dependency pinning: ${error instanceof Error ? error.message : String(error)}`, 1);
//         return 0;
//     }
// };

// src/metrics/dependencyPinning.ts
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

        // Get package.json from GraphQL response
        // const packageJsonText = repoData?.data?.data?.repository?.object?.text;
        // const packageJsonText = packageJson.text;
        
        // console.log(packageJson);

        // if (!packageJsonText) {
        if (!packageJson || !packageJson.data) {
            logToFile("No package.json found in repository", 1);
            return 1.0; // No dependencies = perfect score
        }

        // let packageJson;
        // try {
        //     packageJson = JSON.parse(packageJsonText);
        // } catch (error) {
        //     logToFile(`Error parsing package.json: ${error}`, 1);
        //     return 0;
        // }

        const score = await calcDependencyPinningScore(packageJson);
        return score;
    } catch (error) {
        logToFile(`Error in calcDependencyPinning: ${error}`, 1);
        return 0;
    }
}