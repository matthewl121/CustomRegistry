"use strict";
/**
* githubApi.ts
* Functions for interacting with GitHub's REST and GraphQL APIs to fetch repository data
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getReadmeDetails = exports.checkFolderExists = exports.fetchRepoData = exports.fetchContributorActivity = exports.fetchCodeReviewActivity = exports.fetchPackageJson = void 0;
const apiUtils_1 = require("./apiUtils");
const graphqlQueries_1 = require("./graphqlQueries");
const log_1 = require("../utils/log");
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const pLimit = require("p-limit");
// Base URL for GitHub API requests
const GITHUB_BASE_URL = "https://api.github.com";
const LOCAL_REPO_PATH = path.join(__dirname, '../../repos');
// Fetches package.json content from repository
const fetchPackageJson = async (owner, repo, token) => {
    const url = `https://api.github.com/repos/${owner}/${repo}/contents/package.json`;
    const response = await (0, apiUtils_1.apiGetRequest)(url, token);
    if (response.error || !response.data?.content) {
        return { data: null, error: 'githubApi.ts: Failed to fetch package.json' };
    }
    try {
        const content = Buffer.from(response.data.content, 'base64').toString();
        return { data: JSON.parse(content), error: null };
    }
    catch (error) {
        (0, log_1.logToFile)(`Error parsing package.json: ${error}`, 1);
        return { data: null, error: 'githubApi.ts: Error parsing package.json' };
    }
};
exports.fetchPackageJson = fetchPackageJson;
// Recursively counts lines of code in repository
const countLinesInRepo = (dir) => {
    let totalLines = 0;
    const files = fs.readdirSync(dir);
    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
            totalLines += countLinesInRepo(filePath);
        }
        else if (stat.isFile() && filePath.endsWith('.js')) {
            totalLines += fs.readFileSync(filePath, 'utf-8').split('\n').length;
        }
    });
    return totalLines;
};
// Fetches additions for a single pull request
const fetchPrAdditions = async (prNumber, owner, repo, token) => {
    const url = `${GITHUB_BASE_URL}/repos/${owner}/${repo}/pulls/${prNumber}`;
    const response = await (0, apiUtils_1.apiGetRequest)(url, token);
    if (response.error || !response.data) {
        (0, log_1.logToFile)(`Error fetching PR #${prNumber}: ${response.error}`, 1);
        return 0;
    }
    return response.data.additions;
};
// Analyzes code review activity by comparing PR additions to total lines
const fetchCodeReviewActivity = async (owner, repo, token) => {
    const url = `${GITHUB_BASE_URL}/repos/${owner}/${repo}/pulls?state=all&per_page=100`;
    const response = await (0, apiUtils_1.apiGetRequest)(url, token);
    if (response.error) {
        (0, log_1.logToFile)(`Error fetching pull requests: ${response.error}`, 1);
        return { linesIntroduced: 0, totalLines: 0, error: response.error };
    }
    const pullRequests = response.data || [];
    const limit = pLimit(10);
    const additions = await Promise.all(pullRequests.map(pr => limit(() => fetchPrAdditions(pr.number, owner, repo, token))));
    const linesIntroduced = additions.reduce((acc, curr) => acc + curr, 0);
    const repoPath = path.join(LOCAL_REPO_PATH, `${owner}_${repo}`);
    const totalLines = countLinesInRepo(repoPath);
    return { linesIntroduced, totalLines, error: null };
};
exports.fetchCodeReviewActivity = fetchCodeReviewActivity;
// Fetches contributor commit activity statistics
const fetchContributorActivity = async (owner, repo, token) => {
    const url = `${GITHUB_BASE_URL}/repos/${owner}/${repo}/stats/contributors`;
    const response = await (0, apiUtils_1.apiGetRequest)(url, token);
    if (response.error) {
        (0, log_1.logToFile)(`Error fetching contributor commit activity: ${response.error}`, 1);
        return { data: null, error: response.error };
    }
    return { data: response.data, error: null };
};
exports.fetchContributorActivity = fetchContributorActivity;
// Fetches repository data using GitHub GraphQL API
const fetchRepoData = async (owner, repo, token) => {
    const url = `${GITHUB_BASE_URL}/graphql`;
    const query = (0, graphqlQueries_1.getRepoDataQuery)(owner, repo);
    const response = await (0, apiUtils_1.apiPostRequest)(url, JSON.stringify({ query }), token);
    if (response.error || !response.data) {
        (0, log_1.logToFile)(`Error fetching repository data: ${response.error}`, 1);
        return { data: null, error: response.error };
    }
    return { data: response.data, error: null };
};
exports.fetchRepoData = fetchRepoData;
// Checks if examples folder exists in repository
const checkFolderExists = async (owner, repo, token) => {
    const url = `https://api.github.com/repos/${owner}/${repo}/contents/examples`;
    const headers = token ? { "Authorization": `token ${token}` } : {};
    try {
        const response = await fetch(url, { headers });
        return response.status === 200;
    }
    catch (error) {
        (0, log_1.logToFile)(`Request failed: ${error}`, 1);
        return false;
    }
};
exports.checkFolderExists = checkFolderExists;
// Analyzes README.md content to determine documentation score
const getReadmeDetails = async (readMe, examplesFolder) => {
    try {
        const lines = readMe.split('\n').length;
        if (lines > 75) {
            if (readMe.includes('documentation') && examplesFolder)
                return 0.1;
            if (readMe.includes('documentation'))
                return 0.2;
            if (examplesFolder)
                return 0.2;
            return 0.5;
        }
        if (readMe.includes('documentation') && examplesFolder)
            return 0.2;
        if (readMe.includes('documentation'))
            return 0.3;
        if (examplesFolder?.entries.length > 15)
            return 0.3;
        if (examplesFolder?.entries.length <= 15)
            return 0.4;
        if (lines <= 5)
            return 0.9;
        if (lines <= 20)
            return 0.8;
        if (lines <= 35)
            return 0.7;
        if (lines <= 50)
            return 0.6;
        return 0.5;
    }
    catch (error) {
        (0, log_1.logToFile)(`${error}`, 1);
        return -1;
    }
};
exports.getReadmeDetails = getReadmeDetails;
//# sourceMappingURL=githubApi.js.map