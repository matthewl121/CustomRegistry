"use strict";
/**
 * @fileoverview Calculates a repository's license score by checking for license information
 * in various standard locations. The score is binary (0 or 1) indicating presence/absence
 * of licensing information.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.calcLicense = calcLicense;
exports.calcLicenseScore = calcLicenseScore;
const isomorphic_git_1 = require("isomorphic-git");
const fs = __importStar(require("fs"));
const node_1 = __importDefault(require("isomorphic-git/http/node"));
const path = __importStar(require("path"));
const utils_1 = require("../utils/utils");
/**
 * Entry point for license metric calculation
 * @param owner - Repository owner's username
 * @param repo - Repository name
 * @param repoURL - Full URL to the repository
 * @returns Promise<number> - Returns 1 if license is found, 0 otherwise
 */
async function calcLicense(owner, repo, repoURL) {
    // Create a unique local directory path for cloning
    const localDir = path.join("./repos", `${owner}_${repo}`);
    return await calcLicenseScore(repoURL, localDir);
}
/**
 * Calculates the license score by checking multiple potential license locations
 * @param repoUrl - URL of the repository to analyze
 * @param localDir - Local directory path where repository will be cloned
 * @returns Promise<number> - Returns 1 if license is found, 0 otherwise
 */
async function calcLicenseScore(repoUrl, localDir) {
    try {
        // Clone repository with minimal depth for faster processing
        await (0, isomorphic_git_1.clone)({
            fs,
            http: node_1.default,
            dir: localDir,
            url: repoUrl,
            singleBranch: true,
            depth: 1,
        });
        // Define paths to common license-containing files
        const licenseFilePath = `${localDir}/LICENSE`;
        const readmeFilePath = `${localDir}/README.md`;
        const packageJsonPath = `${localDir}/package.json`;
        // Check method 1: Dedicated LICENSE file
        if (fs.existsSync(licenseFilePath)) {
            return 1;
        }
        // Check method 2: License field in package.json
        if (fs.existsSync(packageJsonPath)) {
            try {
                const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
                if (packageJson.license) {
                    return 1;
                }
            }
            catch (error) {
                // Silently continue to other checks if package.json parsing fails
            }
        }
        // Check method 3: License section in README
        if (fs.existsSync(readmeFilePath)) {
            const readmeText = fs.readFileSync(readmeFilePath, 'utf8');
            return (0, utils_1.hasLicenseHeading)(readmeText) ? 1 : 0;
        }
        // No license information found in any location
        return 0;
    }
    catch (error) {
        // Return 0 if any error occurs during the process
        return 0;
    }
}
//# sourceMappingURL=license.js.map