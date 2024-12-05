/**
* npmApi.ts
* Functions for interacting with NPM registry API to fetch package details
*/
import { apiGetRequest } from './apiUtils';
// Base URL for NPM registry
const NPM_BASE_URL = "https://registry.npmjs.org";
/**
* Fetches and normalizes GitHub repository URL from NPM package
* @param packageName - NPM package name to look up
* @returns Normalized GitHub repo URL or error
*/
export const fetchGithubUrlFromNpm = async (packageName) => {
    // Get package details from NPM
    const url = `${NPM_BASE_URL}/${packageName}`;
    const response = await apiGetRequest(url);
    // Validate response data
    if (response.error || !response.data?.repository?.url) {
        return { data: null, error: 'Repository URL not found' };
    }
    // Clean up repository URL
    let repoUrl = response.data.repository.url
        .replace(/^git\+/, '') // Remove git+ prefix
        .replace(/\.git$/, ''); // Remove .git suffix
    // Convert various Git URL formats to HTTPS
    if (repoUrl.startsWith('ssh://')) {
        repoUrl = repoUrl.replace('ssh://git@', 'https://');
    }
    else if (repoUrl.startsWith('git@')) {
        repoUrl = repoUrl.replace('git@', 'https://').replace('.com:', '.com/');
    }
    else if (repoUrl.startsWith('git://')) {
        repoUrl = repoUrl.replace('git://', 'https://');
    }
    return { data: repoUrl, error: null };
};
//# sourceMappingURL=npmApi.js.map