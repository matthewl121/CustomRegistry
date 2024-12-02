/**
* urlHandler.ts
* Functions for parsing and extracting information from URLs
*/

import { fetchGithubUrlFromNpm } from '../api/npmApi';

/**
* Extracts domain from URL, adding https:// if needed
*/
export const extractDomainFromUrl = (url: string): string | null => {
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

/**
* Extracts package name from NPM URL
*/
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

/**
* Extracts owner and repository name from GitHub URL
*/
export const extractGithubOwnerAndRepo = (repoURL: string): [string, string] | null => {
   const parts = repoURL.split('/').slice(3);
   if (parts.length < 2) {
       console.error('repoURL does not contain enough parts');
       return null;
   }

   const [owner, repo] = parts;
   return [owner, repo];
};

/**
* Processes input URL to get repository details
* Handles both NPM and GitHub URLs
*/
export async function getRepoDetails(token: string, inputURL: string): Promise<[string, string, string]> {
   const hostname = extractDomainFromUrl(inputURL);
   if (!hostname || (hostname !== "www.npmjs.com" && hostname !== "github.com")) {
       process.exit(1);
   }

   let repoURL: string = "";

   if (hostname === "www.npmjs.com") {
       const npmPackageName = extractNpmPackageName(inputURL);
       if (!npmPackageName) {
           process.exit(1);
       }

       const npmResponse = await fetchGithubUrlFromNpm(npmPackageName);
       if (!npmResponse?.data) {
           process.exit(1);
       }
       repoURL = npmResponse.data;
   } else {
       repoURL = inputURL;
   }

   const repoDetails = extractGithubOwnerAndRepo(repoURL);
   if (!repoDetails) {
       process.exit(1);
   }

   return [...repoDetails, repoURL];
}