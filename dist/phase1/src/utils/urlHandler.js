"use strict";
/**
* urlHandler.ts
* Functions for parsing and extracting information from URLs
*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractGithubOwnerAndRepo = exports.extractNpmPackageName = exports.extractDomainFromUrl = void 0;
exports.getRepoDetails = getRepoDetails;
const npmApi_1 = require("../api/npmApi");
/**
* Extracts domain from URL, adding https:// if needed
*/
const extractDomainFromUrl = (url) => {
    if (url == null) {
        console.error('URL is null');
        return null;
    }
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
    }
    try {
        const parsedUrl = new URL(url);
        return parsedUrl.hostname;
    }
    catch (error) {
        console.error('Invalid URL:', error);
        return null;
    }
};
exports.extractDomainFromUrl = extractDomainFromUrl;
/**
* Extracts package name from NPM URL
*/
const extractNpmPackageName = (npmUrl) => {
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
exports.extractNpmPackageName = extractNpmPackageName;
/**
* Extracts owner and repository name from GitHub URL
*/
const extractGithubOwnerAndRepo = (repoURL) => {
    const parts = repoURL.split('/').slice(3);
    if (parts.length < 2) {
        console.error('repoURL does not contain enough parts');
        return null;
    }
    const [owner, repo] = parts;
    return [owner, repo];
};
exports.extractGithubOwnerAndRepo = extractGithubOwnerAndRepo;
/**
* Processes input URL to get repository details
* Handles both NPM and GitHub URLs
*/
async function getRepoDetails(token, inputURL) {
    const hostname = (0, exports.extractDomainFromUrl)(inputURL);
    if (!hostname || (hostname !== "www.npmjs.com" && hostname !== "github.com")) {
        process.exit(1);
    }
    let repoURL = "";
    if (hostname === "www.npmjs.com") {
        const npmPackageName = (0, exports.extractNpmPackageName)(inputURL);
        if (!npmPackageName) {
            process.exit(1);
        }
        const npmResponse = await (0, npmApi_1.fetchGithubUrlFromNpm)(npmPackageName);
        if (!npmResponse?.data) {
            process.exit(1);
        }
        repoURL = npmResponse.data;
    }
    else {
        repoURL = inputURL;
    }
    const repoDetails = (0, exports.extractGithubOwnerAndRepo)(repoURL);
    if (!repoDetails) {
        process.exit(1);
    }
    return [...repoDetails, repoURL];
}
//# sourceMappingURL=urlHandler.js.map