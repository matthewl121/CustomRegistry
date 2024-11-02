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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
exports.calcDependencyPinning = exports.calcDependencyPinningScore = exports.isVersionPinned = void 0;
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
var log_1 = require("../utils/log");
var githubApi_1 = require("../api/githubApi");
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
        (0, log_1.logToFile)("Error in isVersionPinned: ".concat(error), 1);
        return false;
    }
};
exports.isVersionPinned = isVersionPinned;
/**
 * Calculate raw dependency pinning score from package.json data
 * - the more pinned dependencies, the better the score
 */
function calcDependencyPinningScore(packageJson) {
    return __awaiter(this, void 0, void 0, function () {
        var dependencies, totalDeps, pinnedDeps;
        return __generator(this, function (_a) {
            try {
                dependencies = __assign(__assign(__assign({}, (packageJson.data.dependencies || {})), (packageJson.data.devDependencies || {})), (packageJson.data.peerDependencies || {}));
                totalDeps = Object.keys(dependencies).length;
                // If no dependencies, return perfect score
                if (totalDeps === 0) {
                    return [2 /*return*/, 1.0];
                }
                pinnedDeps = Object.entries(dependencies)
                    .filter(function (_a) {
                    var _ = _a[0], version = _a[1];
                    return (0, exports.isVersionPinned)(version);
                })
                    .length;
                return [2 /*return*/, pinnedDeps / totalDeps];
            }
            catch (error) {
                (0, log_1.logToFile)("Error in calcDependencyPinningScore: ".concat(error), 1);
                return [2 /*return*/, 0];
            }
            return [2 /*return*/];
        });
    });
}
exports.calcDependencyPinningScore = calcDependencyPinningScore;
/**
 * Calculate dependency pinning metric from repository data
 */
function calcDependencyPinning(owner, repo, token) {
    return __awaiter(this, void 0, void 0, function () {
        var packageJson, score, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    return [4 /*yield*/, (0, githubApi_1.fetchPackageJson)(owner, repo, token)];
                case 1:
                    packageJson = _a.sent();
                    // Get package.json from GraphQL response
                    // const packageJsonText = repoData?.data?.data?.repository?.object?.text;
                    // const packageJsonText = packageJson.text;
                    // console.log(packageJson);
                    // if (!packageJsonText) {
                    if (!packageJson || !packageJson.data) {
                        (0, log_1.logToFile)("No package.json found in repository", 1);
                        return [2 /*return*/, 1.0]; // No dependencies = perfect score
                    }
                    return [4 /*yield*/, calcDependencyPinningScore(packageJson)];
                case 2:
                    score = _a.sent();
                    return [2 /*return*/, score];
                case 3:
                    error_1 = _a.sent();
                    (0, log_1.logToFile)("Error in calcDependencyPinning: ".concat(error_1), 1);
                    return [2 /*return*/, 0];
                case 4: return [2 /*return*/];
            }
        });
    });
}
exports.calcDependencyPinning = calcDependencyPinning;
