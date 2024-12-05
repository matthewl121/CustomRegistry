"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isVersionPinned = void 0;
exports.calcDependencyPinningScore = calcDependencyPinningScore;
exports.calcDependencyPinning = calcDependencyPinning;
const log_1 = require("../utils/log");
const githubApi_1 = require("../api/githubApi");
/**
 * Checks if a version string is pinned to at least a major+minor version
 * Valid formats include:
 * - Exact versions (1.2.3)
 * - Minor version ranges (1.2.x, 1.2.*)
 * - Tilde ranges (~1.2.0)
 */
const isVersionPinned = (version) => {
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
    }
    catch (error) {
        (0, log_1.logToFile)(`Error in isVersionPinned: ${error}`, 1);
        return false;
    }
};
exports.isVersionPinned = isVersionPinned;
/**
 * Calculate raw dependency pinning score from package.json data
 * - the more pinned dependencies, the better the score
 */
async function calcDependencyPinningScore(packageJson) {
    try {
        const dependencies = {
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
            .filter(([_, version]) => (0, exports.isVersionPinned)(version))
            .length;
        return pinnedDeps / totalDeps;
    }
    catch (error) {
        (0, log_1.logToFile)(`Error in calcDependencyPinningScore: ${error}`, 1);
        return 0;
    }
}
/**
 * Calculate dependency pinning metric from repository data
 */
async function calcDependencyPinning(owner, repo, token) {
    try {
        const packageJson = await (0, githubApi_1.fetchPackageJson)(owner, repo, token);
        if (!packageJson || !packageJson.data) {
            (0, log_1.logToFile)("No package.json found in repository", 1);
            return 1.0; // No dependencies = perfect score
        }
        const score = await calcDependencyPinningScore(packageJson);
        return score;
    }
    catch (error) {
        (0, log_1.logToFile)(`Error in calcDependencyPinning: ${error}`, 1);
        return 0;
    }
}
//# sourceMappingURL=dependencyPinning.js.map