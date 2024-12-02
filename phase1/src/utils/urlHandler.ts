import { fetchGithubUrlFromNpm } from '../api/npmApi';


export const extractDomainFromUrl = (url: string): string | null => {
    // unsure if we would receive a url without this
    if(url == null) {
        console.error('URL is null');
        return null;
    }
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
    }

    try {
        const parsedUrl = new URL(url);
        return parsedUrl.hostname;
    } catch (error) {
        console.error('Invalid URL:', error);
        return null;
    }
}

export const extractNpmPackageName = (npmUrl: string): string | null => {
    if (!npmUrl) {
        console.error('npmUrl is undefined or empty');
        return null;
    }

    const parts = npmUrl.split('/');
    const packageName = parts.pop();

    if (!packageName) {
        console.error('Unable to extract package name from URL');
        return null;
    }

    return packageName;
};

export const extractGithubOwnerAndRepo = (repoURL: string): [string, string] | null => {
    const parts = repoURL.split('/').slice(3);

    if (parts.length < 2) {
        console.error('repoURL does not contain enough parts');
        return null;
    }

    const [owner, repo] = parts;

    return [owner, repo];
};

export async function getRepoDetails(token: string, inputURL: string): Promise<[string, string, string]> {
    // Extract hostname (www.npm.js or github.com or null)
    const hostname = extractDomainFromUrl(inputURL);
    if (!hostname || (hostname !== "www.npmjs.com" && hostname !== "github.com")) {
        process.exit(1);
    }

    let repoURL: string = "";

    // If url is npm, fetch the github repo
    if (hostname === "www.npmjs.com") {
        const npmPackageName = extractNpmPackageName(inputURL);
        if (!npmPackageName) {
            process.exit(1);
        }

        // Fetch the Github repo url from npm package
        const npmResponse = await fetchGithubUrlFromNpm(npmPackageName);
        if (!npmResponse?.data) {
            process.exit(1);
        }

        repoURL = npmResponse.data;
    } else {
        // URL must be github, so use it directly
        repoURL = inputURL;
    }

    const repoDetails = extractGithubOwnerAndRepo(repoURL);
    if (!repoDetails) {
        process.exit(1);
    }

    const extendedDetails: [string, string, string] = [...repoDetails, repoURL];

    return extendedDetails;
}