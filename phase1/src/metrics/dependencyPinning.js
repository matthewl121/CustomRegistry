"use strict";
// // // src/metrics/dependencyPinning.ts
// import { ApiResponse, GraphQLResponse } from '../types';
// import { logToFile } from '../utils/log';
// import { apiGetRequest } from '../api/apiUtils';
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
exports.__esModule = true;
exports.calcDependencyPinning = exports.calcDependencyPinningScore = exports.isVersionPinned = void 0;
var log_1 = require("../utils/log");
/**
 * Checks if a version string is pinned to at least a major+minor version
 * Valid formats include:
 * - Exact versions (1.2.3)
 * - Minor version ranges (1.2.x, 1.2.*)
 * - Tilde ranges (~1.2.0)
 */
var isVersionPinned = function (version) {
    try {
        // Handle null/undefined versions
        if (!version) {
            return false;
        }
        // Remove whitespace and normalize
        var normalizedVersion = version.trim();
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
        // Everything else (including ^1.0.0) is considered not pinned
        return false;
    }
    catch (error) {
        (0, log_1.logToFile)("Error in isVersionPinned: ".concat(error), 2);
        return false;
    }
};
exports.isVersionPinned = isVersionPinned;
/**
 * Calculate raw dependency pinning score from package.json data
 */
function calcDependencyPinningScore(packageJson) {
    try {
        var dependencies = __assign(__assign({}, (packageJson.dependencies || {})), (packageJson.devDependencies || {}));
        var totalDeps = Object.keys(dependencies).length;
        // If no dependencies, return perfect score
        if (totalDeps === 0) {
            return 1.0;
        }
        // Count pinned dependencies
        var pinnedDeps = Object.entries(dependencies)
            .filter(function (_a) {
            var _ = _a[0], version = _a[1];
            return (0, exports.isVersionPinned)(version);
        })
            .length;
        return pinnedDeps / totalDeps;
    }
    catch (error) {
        (0, log_1.logToFile)("Error in calcDependencyPinningScore: ".concat(error), 1);
        return 0;
    }
}
exports.calcDependencyPinningScore = calcDependencyPinningScore;
/**
 * Calculate dependency pinning metric from repository data
 */
function calcDependencyPinning(repoData) {
    var _a, _b, _c, _d;
    try {
        // Get package.json from GraphQL response
        var packageJsonText = (_d = (_c = (_b = (_a = repoData === null || repoData === void 0 ? void 0 : repoData.data) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.repository) === null || _c === void 0 ? void 0 : _c.object) === null || _d === void 0 ? void 0 : _d.text;
        if (!packageJsonText) {
            (0, log_1.logToFile)("No package.json found in repository", 2);
            return 1.0; // No dependencies = perfect score
        }
        var packageJson = void 0;
        try {
            packageJson = JSON.parse(packageJsonText);
        }
        catch (error) {
            (0, log_1.logToFile)("Error parsing package.json: ".concat(error), 1);
            return 0;
        }
        var score = calcDependencyPinningScore(packageJson);
        return Number(score) || 0; // Ensure we return a number
    }
    catch (error) {
        (0, log_1.logToFile)("Error in calcDependencyPinning: ".concat(error), 1);
        return 0;
    }
}
exports.calcDependencyPinning = calcDependencyPinning;
