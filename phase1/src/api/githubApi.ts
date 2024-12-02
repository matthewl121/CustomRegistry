/**
* githubApi.ts
* Functions for interacting with GitHub's REST and GraphQL APIs to fetch repository data
*/

import { apiGetRequest, apiPostRequest } from './apiUtils'
import { ApiResponse, GraphQLResponse, ContributorResponse, PullRequestDetails } from '../types';
import { getRepoDataQuery } from './graphqlQueries';
import { logToFile } from '../utils/log';
import * as path from 'path';
import * as fs from 'fs';
import pLimit = require('p-limit');

// Base URL for GitHub API requests
const GITHUB_BASE_URL: string = "https://api.github.com"
const LOCAL_REPO_PATH = path.join(__dirname, '../../repos');

// Fetches package.json content from repository
export const fetchPackageJson = async (owner: string, repo: string, token: string): Promise<ApiResponse<any>> => {
   const url = `https://api.github.com/repos/${owner}/${repo}/contents/package.json`;
   const response = await apiGetRequest<any>(url, token);

   if (response.error || !response.data?.content) {
       return { data: null, error: 'githubApi.ts: Failed to fetch package.json' };
   }

   try {
       const content = Buffer.from(response.data.content, 'base64').toString();
       return { data: JSON.parse(content), error: null };
   } catch (error) {
       logToFile(`Error parsing package.json: ${error}`, 1);
       return { data: null, error: 'githubApi.ts: Error parsing package.json' };
   }
};

// Recursively counts lines of code in repository
const countLinesInRepo = (dir: string): number => {
   let totalLines = 0;
   const files = fs.readdirSync(dir);

   files.forEach(file => {
       const filePath = path.join(dir, file);
       const stat = fs.statSync(filePath);

       if (stat.isDirectory()) {
           totalLines += countLinesInRepo(filePath);
       } else if (stat.isFile() && filePath.endsWith('.js')) {
           totalLines += fs.readFileSync(filePath, 'utf-8').split('\n').length;
       }
   });

   return totalLines;
};

// Fetches additions for a single pull request
const fetchPrAdditions = async (prNumber: number, owner: string, repo: string, token: string): Promise<number> => {
   const url = `${GITHUB_BASE_URL}/repos/${owner}/${repo}/pulls/${prNumber}`;
   const response = await apiGetRequest<PullRequestDetails>(url, token);

   if (response.error || !response.data) {
       logToFile(`Error fetching PR #${prNumber}: ${response.error}`, 1);
       return 0;
   }

   return response.data.additions;
};

// Analyzes code review activity by comparing PR additions to total lines
export const fetchCodeReviewActivity = async (
   owner: string, 
   repo: string,
   token: string
): Promise<{ linesIntroduced: number; totalLines: number; error: string | null }> => {
   const url = `${GITHUB_BASE_URL}/repos/${owner}/${repo}/pulls?state=all&per_page=100`;
   const response = await apiGetRequest(url, token);

   if (response.error) {
       logToFile(`Error fetching pull requests: ${response.error}`, 1);
       return { linesIntroduced: 0, totalLines: 0, error: response.error };
   }

   const pullRequests = response.data as { number: number; additions: number }[] || [];
   const limit = pLimit(10);
   
   const additions = await Promise.all(
       pullRequests.map(pr => limit(() => fetchPrAdditions(pr.number, owner, repo, token)))
   );

   const linesIntroduced = additions.reduce((acc, curr) => acc + curr, 0);
   const repoPath = path.join(LOCAL_REPO_PATH, `${owner}_${repo}`);
   const totalLines = countLinesInRepo(repoPath);

   return { linesIntroduced, totalLines, error: null };
};

// Fetches contributor commit activity statistics
export const fetchContributorActivity = async (
   owner: string,
   repo: string, 
   token: string
): Promise<ApiResponse<ContributorResponse[] | null>> => {
   const url = `${GITHUB_BASE_URL}/repos/${owner}/${repo}/stats/contributors`;
   const response = await apiGetRequest<ContributorResponse[]>(url, token);

   if (response.error) {
       logToFile(`Error fetching contributor commit activity: ${response.error}`, 1);
       return { data: null, error: response.error };
   }

   return { data: response.data, error: null };
}

// Fetches repository data using GitHub GraphQL API
export const fetchRepoData = async (
   owner: string,
   repo: string,
   token: string
): Promise<ApiResponse<GraphQLResponse | null>> => {
   const url = `${GITHUB_BASE_URL}/graphql`;
   const query = getRepoDataQuery(owner, repo);
   const response = await apiPostRequest<GraphQLResponse>(url, JSON.stringify({ query }), token);

   if (response.error || !response.data) {
       logToFile(`Error fetching repository data: ${response.error}`, 1);
       return { data: null, error: response.error };
   }

   return { data: response.data, error: null };
};

// Checks if examples folder exists in repository
export const checkFolderExists = async (
   owner: string,
   repo: string, 
   token?: string
): Promise<boolean> => {
   const url = `https://api.github.com/repos/${owner}/${repo}/contents/examples`;
   const headers: Record<string, string> = token ? { "Authorization": `token ${token}` } : {};

   try {
       const response = await fetch(url, { headers });
       return response.status === 200;
   } catch (error) {
       logToFile(`Request failed: ${error}`, 1);
       return false;
   }
}

// Analyzes README.md content to determine documentation score
export const getReadmeDetails = async (
   readMe: string,
   examplesFolder: any
): Promise<number> => {
   try {
       const lines = readMe.split('\n').length;
       
       if (lines > 75) {
           if (readMe.includes('documentation') && examplesFolder) return 0.1;
           if (readMe.includes('documentation')) return 0.2;
           if (examplesFolder) return 0.2;
           return 0.5;
       }

       if (readMe.includes('documentation') && examplesFolder) return 0.2;
       if (readMe.includes('documentation')) return 0.3;
       if (examplesFolder?.entries.length > 15) return 0.3;
       if (examplesFolder?.entries.length <= 15) return 0.4;
       if (lines <= 5) return 0.9;
       if (lines <= 20) return 0.8;
       if (lines <= 35) return 0.7;
       if (lines <= 50) return 0.6;
       
       return 0.5;
   } catch (error) {
       logToFile(`${error}`, 1);
       return -1;
   }
}