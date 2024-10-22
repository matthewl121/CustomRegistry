// src/metrics/licenseMetric.ts
import { clone } from 'isomorphic-git';
import * as fs from 'fs';
import http from 'isomorphic-git/http/node';
import * as path from 'path';
import { hasLicenseHeading } from '../utils/utils';

export async function calcLicense(owner: string, repo: string, repoURL: string): Promise<number> {
    const localDir = path.join("./repos", `${owner}_${repo}`);
    return await calcLicenseScore(repoURL, localDir);
}

export async function calcLicenseScore(repoUrl: string, localDir: string): Promise<number> {
    try {
        await clone({
            fs,
            http,
            dir: localDir,
            url: repoUrl,
            singleBranch: true,
            depth: 1,
        });
    
        const licenseFilePath = `${localDir}/LICENSE`;
        const readmeFilePath = `${localDir}/README.md`;
        const packageJsonPath = `${localDir}/package.json`;

        // Check for LICENSE file
        if (fs.existsSync(licenseFilePath)) {
            return 1;
        }
    
        // Check package.json for license field
        if (fs.existsSync(packageJsonPath)) {
            try {
                const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
                if (packageJson.license) {
                    return 1;
                }
            } catch (error) {
                // Continue checking other methods if package.json parsing fails
            }
        }

        // Check README for license section
        if (fs.existsSync(readmeFilePath)) {
            const readmeText = fs.readFileSync(readmeFilePath, 'utf8');
            return hasLicenseHeading(readmeText) ? 1 : 0;
        }
    
        return 0;
    } catch (error) {
        // If there's any error in the process, return 0
        return 0;
    }
}
