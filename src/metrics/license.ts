/**
 * @fileoverview Calculates a repository's license score by checking for license information
 * in various standard locations. The score is binary (0 or 1) indicating presence/absence
 * of licensing information.
 */

import { clone } from 'isomorphic-git';
import * as fs from 'fs';
import http from 'isomorphic-git/http/node';
import * as path from 'path';
import { hasLicenseHeading } from '../utils/utils';

/**
 * Entry point for license metric calculation
 * @param owner - Repository owner's username
 * @param repo - Repository name
 * @param repoURL - Full URL to the repository
 * @returns Promise<number> - Returns 1 if license is found, 0 otherwise
 */
export async function calcLicense(owner: string, repo: string, repoURL: string): Promise<number> {
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
export async function calcLicenseScore(repoUrl: string, localDir: string): Promise<number> {
    try {
        // Clone repository with minimal depth for faster processing
        await clone({
            fs,
            http,
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
            } catch (error) {
                // Silently continue to other checks if package.json parsing fails
            }
        }

        // Check method 3: License section in README
        if (fs.existsSync(readmeFilePath)) {
            const readmeText = fs.readFileSync(readmeFilePath, 'utf8');
            return hasLicenseHeading(readmeText) ? 1 : 0;
        }

        // No license information found in any location
        return 0;

    } catch (error) {
        // Return 0 if any error occurs during the process
        return 0;
    }
}
