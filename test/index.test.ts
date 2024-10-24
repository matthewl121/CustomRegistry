import { fetchContributorActivity, fetchRepoData, checkFolderExists, getReadmeDetails } from "../src/api/githubApi";
import { getRepoDetails, extractDomainFromUrl, extractNpmPackageName, extractGithubOwnerAndRepo } from '../src/utils/urlHandler';
import { calcBusFactorScore, calcCorrectnessScore, calcResponsivenessScore, calcLicenseScore, calculateMetrics, calcBusFactor, calcCorrectness, calcResponsiveness, calcLicense, calcRampUp } from "../src/metricCalcs";
import { initLogFile, logToFile, metricsLogToStdout } from "../src/utils/log";
import * as path from 'path';
import { runWorker } from '../src/index';
import { apiGetRequest, apiPostRequest } from '../src/api/apiUtils'
import { ContributorResponse, ApiResponse, GraphQLResponse } from '../src/types';
import { writeFile, hasLicenseHeading } from '../src/utils/utils';
import { fetchGithubUrlFromNpm } from '../src/api/npmApi';
import { getRepoDataQuery } from '../src/api/graphqlQueries';

const {expect, describe, it} = require('@jest/globals');


describe('Test suite', () => {
    test('github/jspec, bus factor', async () => {
        const token = process.env.GITHUB_TOKEN || "";
        const inputURL = "https://github.com/wycats/jspec";

        const repoDetails = await getRepoDetails(token, inputURL);
        const [owner, repo, repoURL]: [string, string, string] = repoDetails;
        const repoData = await fetchRepoData(owner, repo, token);

        let metrics = await calculateMetrics(owner, repo, token, repoURL, repoData, inputURL);

        expect(parseFloat(metrics?.BusFactor?.toFixed(2) ?? '0')).toBe(0.05);
    });
    test('github/jspec, correctness', async () => {
        const token = process.env.GITHUB_TOKEN || "";
        const inputURL = "https://github.com/wycats/jspec";

        const repoDetails = await getRepoDetails(token, inputURL);
        const [owner, repo, repoURL]: [string, string, string] = repoDetails;
        const repoData = await fetchRepoData(owner, repo, token);

        let metrics = await calculateMetrics(owner, repo, token, repoURL, repoData, inputURL);

        expect(parseFloat(metrics?.Correctness?.toFixed(2) ?? '0')).toBe(1.00);
    });
    test('github/jspec, ramp up', async () => {
        const token = process.env.GITHUB_TOKEN || "";
        const inputURL = "https://github.com/wycats/jspec";

        const repoDetails = await getRepoDetails(token, inputURL);
        const [owner, repo, repoURL]: [string, string, string] = repoDetails;
        const repoData = await fetchRepoData(owner, repo, token);

        let metrics = await calculateMetrics(owner, repo, token, repoURL, repoData, inputURL);

        expect(parseFloat(metrics?.RampUp?.toFixed(2) ?? '0')).toBe(0.90);
    });
    test('github/jspec, responsiveness', async () => {
        const token = process.env.GITHUB_TOKEN || "";
        const inputURL = "https://github.com/wycats/jspec";

        const repoDetails = await getRepoDetails(token, inputURL);
        const [owner, repo, repoURL]: [string, string, string] = repoDetails;
        const repoData = await fetchRepoData(owner, repo, token);

        let metrics = await calculateMetrics(owner, repo, token, repoURL, repoData, inputURL);

        expect(parseFloat(metrics?.ResponsiveMaintainer?.toFixed(2) ?? '0')).toBe(0.00);
    });
    test('github/jspec, license', async () => {
        const token = process.env.GITHUB_TOKEN || "";
        const inputURL = "https://github.com/wycats/jspec";

        const repoDetails = await getRepoDetails(token, inputURL);
        const [owner, repo, repoURL]: [string, string, string] = repoDetails;
        const repoData = await fetchRepoData(owner, repo, token);

        let metrics = await calculateMetrics(owner, repo, token, repoURL, repoData, inputURL);

        expect(parseFloat(metrics?.License?.toFixed(2) ?? '0')).toBe(1.00);
    });

    test('logging messages to log file', async () => {
        initLogFile();
        logToFile("Informational log from test", 1);
        logToFile("Debugging log from test", 2);

        const fs = require('fs');
        const logContent = fs.readFileSync(process.env.LOG_FILE, 'utf8');

        // check that log file is not empty
        expect(logContent.trim()).not.toBe('');
    });
    test('logging metrics log file with null', async () => {
        initLogFile();
        metricsLogToStdout("Metric scoring from test", 2);

        const fs = require('fs');
        const logContent = fs.readFileSync(process.env.LOG_FILE, 'utf8');

        // check that log file is empty
        expect(logContent.trim()).toBe('');
    });
    test('logging metrics log file with object', async () => {
        initLogFile();
        const token = process.env.GITHUB_TOKEN || "";
        const inputURL = "https://github.com/wycats/jspec";

        const repoDetails = await getRepoDetails(token, inputURL);
        const [owner, repo, repoURL]: [string, string, string] = repoDetails;
        const repoData = await fetchRepoData(owner, repo, token);

        let metrics = await calculateMetrics(owner, repo, token, repoURL, repoData, inputURL);
        metricsLogToStdout(metrics!, 2);

        const fs = require('fs');
        const logContent = fs.readFileSync(process.env.LOG_FILE, 'utf8');

        // check that log file is not empty
        expect(logContent.trim()).not.toBe('');
    });

    test('calcBusFactorScore', async () => {
        const token = process.env.GITHUB_TOKEN || "";
        const inputURL = "https://github.com/defunkt/zippy";

        const repoDetails = await getRepoDetails(token, inputURL);
        const [owner, repo, repoURL]: [string, string, string] = repoDetails;
        const repoData = await fetchRepoData(owner, repo, token);

        let busFactor;
        const contributorActivity = await fetchContributorActivity(owner, repo, token);
        if (!contributorActivity?.data || !Array.isArray(contributorActivity.data)) {
            busFactor = -1;
        } else {
            busFactor = calcBusFactorScore(contributorActivity.data);
        }

        expect(parseFloat((busFactor).toFixed(2) ?? '0')).toBe(0.05);
    });
    test('calcCorrectnessScore', async () => {
        const token = process.env.GITHUB_TOKEN || "";
        const inputURL = "https://github.com/defunkt/zippy";

        const repoDetails = await getRepoDetails(token, inputURL);
        const [owner, repo, repoURL]: [string, string, string] = repoDetails;
        const repoData = await fetchRepoData(owner, repo, token);

        const totalOpenIssues = repoData.data?.data.repository.openIssues;
        const totalClosedIssues = repoData.data?.data.repository.closedIssues;

        if (!totalOpenIssues || !totalClosedIssues) {
            return -1;
        }
        const correctness = calcCorrectnessScore(totalOpenIssues.totalCount, totalClosedIssues.totalCount);

        expect(parseFloat((correctness).toFixed(2) ?? '0')).toBe(1.00);
    });
    test('calcResponsivenessScore', async () => {
        const token = process.env.GITHUB_TOKEN || "";
        const inputURL = "https://github.com/defunkt/zippy";

        const repoDetails = await getRepoDetails(token, inputURL);
        const [owner, repo, repoURL]: [string, string, string] = repoDetails;
        const repoData = await fetchRepoData(owner, repo, token);

        const recentPullRequests = repoData.data?.data.repository.pullRequests;
        const isArchived = repoData.data?.data.repository.isArchived;
        const totalOpenIssues = repoData.data?.data.repository.openIssues;
        const totalClosedIssues = repoData.data?.data.repository.closedIssues;
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

        if (!recentPullRequests?.nodes || !totalClosedIssues?.nodes || !totalOpenIssues?.nodes) {
            return -1;
        }
        const responsiveness = calcResponsivenessScore(totalClosedIssues.nodes, totalOpenIssues.nodes, recentPullRequests.nodes, oneMonthAgo, isArchived ?? false);

        expect(parseFloat((responsiveness).toFixed(2) ?? '0')).toBe(0.00);
    });
    test('calcLicenseScore', async () => {
        const token = process.env.GITHUB_TOKEN || "";
        const inputURL = "https://github.com/defunkt/zippy";

        const repoDetails = await getRepoDetails(token, inputURL);
        const [owner, repo, repoURL]: [string, string, string] = repoDetails;
        const repoData = await fetchRepoData(owner, repo, token);

        const localDir = path.join("./repos", `${owner}_${repo}`);
        const license = await calcLicenseScore(repoURL, localDir);
        
        expect(parseFloat((license).toFixed(2) ?? '0')).toBe(0.00);
    });

    test('calcBusFactor', async () => {
        const token = process.env.GITHUB_TOKEN || "";
        const inputURL = "https://github.com/defunkt/zippy";

        const repoDetails = await getRepoDetails(token, inputURL);
        const [owner, repo, repoURL]: [string, string, string] = repoDetails;
        const repoData = await fetchRepoData(owner, repo, token);

        let busFactor = await calcBusFactor(owner, repo, token);

        expect(parseFloat((busFactor).toFixed(2) ?? '0')).toBe(0.05);
    });
    test('calcCorrectness', async () => {
        const token = process.env.GITHUB_TOKEN || "";
        const inputURL = "https://github.com/defunkt/zippy";

        const repoDetails = await getRepoDetails(token, inputURL);
        const [owner, repo, repoURL]: [string, string, string] = repoDetails;
        const repoData = await fetchRepoData(owner, repo, token);

        const correctness = calcCorrectness(repoData);

        expect(parseFloat((correctness).toFixed(2) ?? '0')).toBe(1.00);
    });
    test('calcResponsiveness', async () => {
        const token = process.env.GITHUB_TOKEN || "";
        const inputURL = "https://github.com/defunkt/zippy";

        const repoDetails = await getRepoDetails(token, inputURL);
        const [owner, repo, repoURL]: [string, string, string] = repoDetails;
        const repoData = await fetchRepoData(owner, repo, token);

        const responsiveness = calcResponsiveness(repoData);
        
        expect(parseFloat((responsiveness).toFixed(2) ?? '0')).toBe(0.00);
    });
    test('calcLicense', async () => {
        const token = process.env.GITHUB_TOKEN || "";
        const inputURL = "https://github.com/defunkt/zippy";

        const repoDetails = await getRepoDetails(token, inputURL);
        const [owner, repo, repoURL]: [string, string, string] = repoDetails;
        const repoData = await fetchRepoData(owner, repo, token);

        const license = await calcLicense(owner, repo, repoURL);
        
        expect(parseFloat((license).toFixed(2) ?? '0')).toBe(0.00);
    });
    test('calcRampUp', async () => {
        const token = process.env.GITHUB_TOKEN || "";
        const inputURL = "https://github.com/defunkt/zippy";

        const repoDetails = await getRepoDetails(token, inputURL);
        const [owner, repo, repoURL]: [string, string, string] = repoDetails;
        const repoData = await fetchRepoData(owner, repo, token);

        const rampUp = await calcRampUp(repoData);
        
        expect(parseFloat((rampUp).toFixed(2) ?? '0')).toBe(0.80);
    });

    test('workers', async () => {
        const token = process.env.GITHUB_TOKEN || "";
        const inputURL = "https://github.com/defunkt/zippy";

        const repoDetails = await getRepoDetails(token, inputURL);
        const [owner, repo, repoURL]: [string, string, string] = repoDetails;
        const repoData = await fetchRepoData(owner, repo, token);

        const busFactorWorker = runWorker(owner, repo, token, repoURL, repoData, "busFactor");
        const correctnessWorker = runWorker(owner, repo, token, repoURL, repoData, "correctness");
        const rampUpWorker = runWorker(owner, repo, token, repoURL, repoData, "rampUp");
        const responsivenessWorker = runWorker(owner, repo, token, repoURL, repoData, "responsiveness");
        const licenseWorker = runWorker(owner, repo, token, repoURL, repoData, "license");
        
        const results = await Promise.all([busFactorWorker, correctnessWorker, rampUpWorker, responsivenessWorker, licenseWorker]);
        
        expect(parseFloat(results[0].score.toFixed(2) ?? '0')).toBe(0.05); // bus factor score
    });

    test('apiGetRequest', async () => {
        const GITHUB_BASE_URL: string = "https://api.github.com"
        const token = process.env.GITHUB_TOKEN || "";
        const inputURL = "https://github.com/defunkt/zippy";

        const repoDetails = await getRepoDetails(token, inputURL);
        const [owner, repo, repoURL]: [string, string, string] = repoDetails;
        const repoData = await fetchRepoData(owner, repo, token);

        const url = `${GITHUB_BASE_URL}/repos/${owner}/${repo}/stats/contributors`;
        const response = await apiGetRequest<ContributorResponse[]>(url, token);
        
        expect(response).not.toBe(null);
    });
    test('apiPostRequest', async () => {
        const GITHUB_BASE_URL: string = "https://api.github.com"
        const token = process.env.GITHUB_TOKEN || "";
        const inputURL = "https://github.com/defunkt/zippy";

        const repoDetails = await getRepoDetails(token, inputURL);
        const [owner, repo, repoURL]: [string, string, string] = repoDetails;
        const repoData = await fetchRepoData(owner, repo, token);

        const url = `${GITHUB_BASE_URL}/graphql`;
        const query = getRepoDataQuery(owner, repo);
        const body = JSON.stringify({ query });

        const response = await apiPostRequest<GraphQLResponse>(url, body, token);
        
        expect(response).not.toBe(null);
    });
    // test('apiGetRequest_NoOutput', async () => {
    //     const GITHUB_BASE_URL: string = "https://api.github.com"
    //     const token = process.env.GITHUB_TOKEN || "";
    //     const inputURL = "https://github.com/anotherjesse/foxtracs";

    //     const repoDetails = await getRepoDetails(token, inputURL);
    //     const [owner, repo, repoURL]: [string, string, string] = repoDetails;
    //     const repoData = await fetchRepoData(owner, repo, token);

    //     const q = `repo:${owner}/${repo}+filename:readme`;
    //     const url = `${GITHUB_BASE_URL}/search/code?q=${q}`;

    //     const response = await apiGetRequest_NoOutput<IssueSearchResponse>(url, token);
        
    //     expect(response).not.toBe(null);
    // });

    test('writeFile', async () => {
        await writeFile("testing writeFile from test suite", process.env.LOG_FILE!);

        const fs = require('fs');
        const logContent = fs.readFileSync(process.env.LOG_FILE, 'utf8');

        // check that log file is not empty
        expect(logContent.trim()).not.toBe('');
    });
    test('hasLicenseHeading', async () => {
        let match = hasLicenseHeading("this should not match anything");

        expect(match).toBe(false);
    });

    test('extractDomainFromUrl, extractNpmPackageName, fetchGithubUrlFromNpm, extractGithubOwnerAndRepo', async () => {
        const token = process.env.GITHUB_TOKEN || "";
        const inputURL = "https://github.com/wycats/jspec";

        // Extract hostname (www.npm.js or github.com or null)
        const hostname = extractDomainFromUrl(inputURL);

        let repoURL: string = "";

        // If url is npm, fetch the github repo
        if (hostname === "www.npmjs.com") {
            const npmPackageName = extractNpmPackageName(inputURL);

            // Fetch the Github repo url from npm package
            const npmResponse = await fetchGithubUrlFromNpm(npmPackageName!);

            repoURL = npmResponse.data!;
        } else {
            // URL must be github, so use it directly
            repoURL = inputURL;
        }

        const repoDetails = extractGithubOwnerAndRepo(repoURL);

        expect(repoDetails).not.toBe(null);
    });

    test('checkFolderExists', async () => {
        const token = process.env.GITHUB_TOKEN || "";
        const inputURL = "https://github.com/wycats/jspec";

        const repoDetails = await getRepoDetails(token, inputURL);
        const [owner, repo, repoURL]: [string, string, string] = repoDetails;
        const repoData = await fetchRepoData(owner, repo, token);

        let exists = await checkFolderExists(owner, repo, token);

        expect(exists).toBe(false);
    });
});