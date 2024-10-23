/**
 * @fileoverview Calculates a repository's ramp-up score based on documentation quality
 * This metric evaluates how easily new developers can start contributing to the project
 */

import { ApiResponse, GraphQLResponse } from '../types';
import { getReadmeDetails } from "../api/githubApi";

/**
 * Calculates the ramp-up score for a repository based on README presence and examples
 * @param repoData - Repository data from GitHub API response
 * @returns Promise<number> - Score between 0 and 1, where higher values indicate better onboarding
 */
export async function calcRampUp(repoData: ApiResponse<GraphQLResponse | null>): Promise<number> {
    const repository = repoData.data?.data.repository;
    if (!repository) {
        return 0.9; // Default value if no repository data
    }

    // Define all possible README variations
    const readmeVariants = [
        'md', 'noext', 'txt', 'rdoc', 'html', 'adoc',
        'markdown', 'yaml', 'rst', 'textile'
    ];

    // Different case variations for README filename
    const caseVariants = [
        'README', 'readme', 'readMe', 'ReadMe', 'Readme'
    ];

    // Search for any available README file
    const readmeFile = findFirstReadme(repository, readmeVariants, caseVariants);

    // Look for examples directory with various naming conventions
    const examplesFolder = findExamplesFolder(repository);

    // If no README is found, return default score
    if (!readmeFile?.text) {
        return 0.9;
    }

    // Analyze README content and examples folder to calculate final score
    return await getReadmeDetails(readmeFile.text, examplesFolder);
}

/**
 * Searches for README file across different naming conventions and file extensions
 * @param repository - Repository object containing file information
 * @param extensions - Array of possible file extensions
 * @param casings - Array of possible README name casings
 * @returns Object containing README text if found, null otherwise
 */
function findFirstReadme(
    repository: any,
    extensions: string[],
    casings: string[]
): { text: string } | null {
    for (const casing of casings) {
        for (const ext of extensions) {
            // Check uppercase extension variant
            const key = `${casing}${ext.toUpperCase()}` as keyof typeof repository;
            if (repository[key]?.text) {
                return repository[key];
            }

            // Check lowercase extension variant
            const keyLower = `${casing.toLowerCase()}${ext}` as keyof typeof repository;
            if (repository[keyLower]?.text) {
                return repository[keyLower];
            }
        }
    }
    return null;
}

/**
 * Searches for examples folder using different naming conventions
 * @param repository - Repository object containing folder information
 * @returns Examples folder object if found, null otherwise
 */
function findExamplesFolder(repository: any): any {
    const folderVariants = [
        'examplesFolder',
        'exampleFolder',
        'ExamplesFolder',
        'ExampleFolder'
    ];

    for (const variant of folderVariants) {
        if (repository[variant] != null) {
            return repository[variant];
        }
    }
    return null;
}