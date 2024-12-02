/**
* index.test.ts
* Test suite for package metrics and utilities
*/

import { fetchCodeReviewActivity, fetchContributorActivity, fetchRepoData, checkFolderExists, getReadmeDetails } from "../src/api/githubApi";
import { getRepoDetails, extractDomainFromUrl, extractNpmPackageName, extractGithubOwnerAndRepo } from '../src/utils/urlHandler';
import { calculateMetrics} from "../src/metrics/metric";
import { calcBusFactor, calcBusFactorScore } from '../src/metrics/busFactor';
import { calcCorrectness, calcCorrectnessScore } from '../src/metrics/correctness';
import { calcResponsiveness, calcResponsivenessScore } from '../src/metrics/responsiveMaintainer';
import { calcLicense, calcLicenseScore } from '../src/metrics/license';
import { calcRampUp } from '../src/metrics/rampUp';
import { calcDependencyPinning, calcDependencyPinningScore, isVersionPinned } from '../src/metrics/dependencyPinning';
import { calcCodeReview, calcCodeReviewScore } from '../src/metrics/codeReview';
import { initLogFile, logToFile, metricsLogToStdout } from "../src/utils/log";
import * as path from 'path';
import { calculateMetric } from '../src/utils/worker';
import { apiGetRequest, apiPostRequest } from '../src/api/apiUtils'
import { ContributorResponse, ApiResponse, GraphQLResponse } from '../src/types';
import { writeFile, hasLicenseHeading } from '../src/utils/utils';
import { fetchGithubUrlFromNpm } from '../src/api/npmApi';
import { getRepoDataQuery } from '../src/api/graphqlQueries';
import { runWorker } from "../src";

const {expect, describe, it} = require('@jest/globals');

jest.setTimeout(30000); // Set timeout to 20 seconds for all tests in this file

describe('Test suite', () => {
    // Testing all metrics with github/jspec
    test('github/jspec, bus factor', async () => {
        const token = process.env.GITHUB_TOKEN || "";
        const inputURL = "https://github.com/wycats/jspec";

        const repoDetails = await getRepoDetails(token, inputURL);
        const [owner, repo, repoURL]: [string, string, string] = repoDetails;
        const repoData = await fetchRepoData(owner, repo, token);

        let metrics = await calculateMetrics(owner, repo, token, repoURL, repoData, inputURL);

        expect(parseFloat(metrics?.BusFactor?.toFixed(2) ?? '-1')).toBe(0.05);
    });
    test('github/jspec, correctness', async () => {
        const token = process.env.GITHUB_TOKEN || "";
        const inputURL = "https://github.com/wycats/jspec";

        const repoDetails = await getRepoDetails(token, inputURL);
        const [owner, repo, repoURL]: [string, string, string] = repoDetails;
        const repoData = await fetchRepoData(owner, repo, token);

        let metrics = await calculateMetrics(owner, repo, token, repoURL, repoData, inputURL);

        expect(parseFloat(metrics?.Correctness?.toFixed(2) ?? '-1')).toBe(1.00);
    });
    test('github/jspec, ramp up', async () => {
        const token = process.env.GITHUB_TOKEN || "";
        const inputURL = "https://github.com/wycats/jspec";

        const repoDetails = await getRepoDetails(token, inputURL);
        const [owner, repo, repoURL]: [string, string, string] = repoDetails;
        const repoData = await fetchRepoData(owner, repo, token);

        let metrics = await calculateMetrics(owner, repo, token, repoURL, repoData, inputURL);

        expect(parseFloat(metrics?.RampUp?.toFixed(2) ?? '-1')).toBe(0.90);
    });
    test('github/jspec, responsiveness', async () => {
        const token = process.env.GITHUB_TOKEN || "";
        const inputURL = "https://github.com/wycats/jspec";

        const repoDetails = await getRepoDetails(token, inputURL);
        const [owner, repo, repoURL]: [string, string, string] = repoDetails;
        const repoData = await fetchRepoData(owner, repo, token);

        let metrics = await calculateMetrics(owner, repo, token, repoURL, repoData, inputURL);

        expect(parseFloat(metrics?.ResponsiveMaintainer?.toFixed(2) ?? '-1')).toBe(0.00);
    });
    test('github/jspec, license', async () => {
        const token = process.env.GITHUB_TOKEN || "";
        const inputURL = "https://github.com/wycats/jspec";

        const repoDetails = await getRepoDetails(token, inputURL);
        const [owner, repo, repoURL]: [string, string, string] = repoDetails;
        const repoData = await fetchRepoData(owner, repo, token);

        let metrics = await calculateMetrics(owner, repo, token, repoURL, repoData, inputURL);

        expect(parseFloat(metrics?.License?.toFixed(2) ?? '-1')).toBe(1.00);
    });
    test('github/jspec, dependency pinning', async () => {
        const token = process.env.GITHUB_TOKEN || "";
        const inputURL = "https://github.com/wycats/jspec";

        const repoDetails = await getRepoDetails(token, inputURL);
        const [owner, repo, repoURL]: [string, string, string] = repoDetails;
        const repoData = await fetchRepoData(owner, repo, token);

        let metrics = await calculateMetrics(owner, repo, token, repoURL, repoData, inputURL);

        expect(parseFloat(metrics?.DependencyPinning?.toFixed(2) ?? '-1')).toBe(1.00);
    });
    test('github/jspec, code review fraction', async () => {
        const token = process.env.GITHUB_TOKEN || "";
        const inputURL = "https://github.com/wycats/jspec";

        const repoDetails = await getRepoDetails(token, inputURL);
        const [owner, repo, repoURL]: [string, string, string] = repoDetails;
        const repoData = await fetchRepoData(owner, repo, token);

        let metrics = await calculateMetrics(owner, repo, token, repoURL, repoData, inputURL);

        expect(parseFloat(metrics?.CodeReview?.toFixed(2) ?? '-1')).toBe(0.25);
    });

    // Testing "all" metrics with npm/ts-node
    test('npm/ts-node, code review fraction', async () => {
        const token = process.env.GITHUB_TOKEN || "";
        const inputURL = "https://www.npmjs.com/package/ts-node";

        const repoDetails = await getRepoDetails(token, inputURL);
        const [owner, repo, repoURL]: [string, string, string] = repoDetails;
        const repoData = await fetchRepoData(owner, repo, token);

        let metrics = await calculateMetrics(owner, repo, token, repoURL, repoData, inputURL);

        expect(parseFloat(metrics?.CodeReview?.toFixed(2) ?? '-1')).toBe(0.95);
    });

    // Testing log file functions
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

    // Testing all metric score functions
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

        expect(parseFloat((busFactor).toFixed(2) ?? '-1')).toBe(0.05);
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

        expect(parseFloat((correctness).toFixed(2) ?? '-1')).toBe(1.00);
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

        expect(parseFloat((responsiveness).toFixed(2) ?? '-1')).toBe(0.00);
    });
    test('calcLicenseScore', async () => {
        const token = process.env.GITHUB_TOKEN || "";
        const inputURL = "https://github.com/defunkt/zippy";

        const repoDetails = await getRepoDetails(token, inputURL);
        const [owner, repo, repoURL]: [string, string, string] = repoDetails;
        const repoData = await fetchRepoData(owner, repo, token);

        const localDir = path.join("./repos", `${owner}_${repo}`);
        const license = await calcLicenseScore(repoURL, localDir);
        
        expect(parseFloat((license).toFixed(2) ?? '-1')).toBe(0.00);
    });
    test('calcDependencyPinningScore', async () => {
        // Test case 1: No dependencies
        const noDependencies = {
            data: {
                dependencies: {},
                devDependencies: {},
                peerDependencies: {}
            }
        };
        let result = await calcDependencyPinningScore(noDependencies);
        expect(parseFloat((result).toFixed(2) ?? '-1')).toBe(1.00);

        // Test case 2: All dependencies pinned
        const allPinned = {
            data: {
                dependencies: {
                    "react": "17.0.2",
                    "lodash": "4.17.21"
                }
            }
        };
        result = await calcDependencyPinningScore(allPinned);
        expect(parseFloat((result).toFixed(2) ?? '-1')).toBe(1.00);
        
        // Test case 3: Mixed pinned and unpinned
        const mixed = {
            data: {
                dependencies: {
                    "react": "hi",
                    "lodash": "4.17.21"
                }
            }
        };
        result = await calcDependencyPinningScore(mixed);
        expect(parseFloat((result).toFixed(2) ?? '-1')).toBe(0.50);
        
        // Test case 4: None pinned
        const nonePinned = {
            data: {
                dependencies: {
                    "react": "none",
                    "lodash": "hi"
                }
            }
        };
        result = await calcDependencyPinningScore(nonePinned);
        expect(parseFloat((result).toFixed(2) ?? '-1')).toBe(0.00);
    });
    test('calcDependencyPinningScore w/ other dependencies', async () => {
        const allPinned = {
            data: {
                dependencies: {
                    "react": "17.0.2",
                    "lodash": "4.17.21"
                },
                devDependencies: {
                    "typescript": "4.5.4"
                },
                peerDependencies: {
                    '@swc/core': '>=1.3.85'
                }
            }
        };
        let result = await calcDependencyPinningScore(allPinned);
        expect(parseFloat((result).toFixed(2) ?? '-1')).toBe(1.00);
    });
    test('calcCodeReviewScore', async () => {
        const token = process.env.GITHUB_TOKEN || "";
        const inputURL = "https://github.com/defunkt/zippy";

        const repoDetails = await getRepoDetails(token, inputURL);
        const [owner, repo, repoURL]: [string, string, string] = repoDetails;
        const repoData = await fetchRepoData(owner, repo, token);

        let codeReview;

        // get number of lines introduced and total lines in repo
        const codeReviewActivity = await fetchCodeReviewActivity(owner, repo, token);
        if (!codeReviewActivity.linesIntroduced || !codeReviewActivity.totalLines) {
            return 0;
        }
        
        // get score
        codeReview = calcCodeReviewScore(codeReviewActivity.linesIntroduced, codeReviewActivity.totalLines);
        
        expect(parseFloat((codeReview).toFixed(2) ?? '-1')).toBe(0.00);
    });

    // Testing all metric functions
    test('calcBusFactor', async () => {
        const token = process.env.GITHUB_TOKEN || "";
        const inputURL = "https://github.com/defunkt/zippy";

        const repoDetails = await getRepoDetails(token, inputURL);
        const [owner, repo, repoURL]: [string, string, string] = repoDetails;
        const repoData = await fetchRepoData(owner, repo, token);

        let busFactor = await calcBusFactor(owner, repo, token);

        expect(parseFloat((busFactor).toFixed(2) ?? '-1')).toBe(0.05);
    });
    test('calcCorrectness', async () => {
        const token = process.env.GITHUB_TOKEN || "";
        const inputURL = "https://github.com/defunkt/zippy";

        const repoDetails = await getRepoDetails(token, inputURL);
        const [owner, repo, repoURL]: [string, string, string] = repoDetails;
        const repoData = await fetchRepoData(owner, repo, token);

        const correctness = calcCorrectness(repoData);

        expect(parseFloat((correctness).toFixed(2) ?? '-1')).toBe(1.00);
    });
    test('calcResponsiveness', async () => {
        const token = process.env.GITHUB_TOKEN || "";
        const inputURL = "https://github.com/defunkt/zippy";

        const repoDetails = await getRepoDetails(token, inputURL);
        const [owner, repo, repoURL]: [string, string, string] = repoDetails;
        const repoData = await fetchRepoData(owner, repo, token);

        const responsiveness = calcResponsiveness(repoData);
        
        expect(parseFloat((responsiveness).toFixed(2) ?? '-1')).toBe(0.00);
    });
    test('calcLicense', async () => {
        const token = process.env.GITHUB_TOKEN || "";
        const inputURL = "https://github.com/defunkt/zippy";

        const repoDetails = await getRepoDetails(token, inputURL);
        const [owner, repo, repoURL]: [string, string, string] = repoDetails;
        const repoData = await fetchRepoData(owner, repo, token);

        const license = await calcLicense(owner, repo, repoURL);
        
        expect(parseFloat((license).toFixed(2) ?? '-1')).toBe(0.00);
    });
    test('calcRampUp', async () => {
        const token = process.env.GITHUB_TOKEN || "";
        const inputURL = "https://github.com/defunkt/zippy";

        const repoDetails = await getRepoDetails(token, inputURL);
        const [owner, repo, repoURL]: [string, string, string] = repoDetails;
        const repoData = await fetchRepoData(owner, repo, token);

        const rampUp = await calcRampUp(repoData);
        
        expect(parseFloat((rampUp).toFixed(2) ?? '-1')).toBe(0.80);
    });
    test('calcDependencyPinning', async () => {
        const token = process.env.GITHUB_TOKEN || "";
        const inputURL = "https://github.com/defunkt/zippy";

        const repoDetails = await getRepoDetails(token, inputURL);
        const [owner, repo, repoURL]: [string, string, string] = repoDetails;

        const dependencyPinning = await calcDependencyPinning(owner, repo, token);
        
        expect(parseFloat((dependencyPinning).toFixed(2) ?? '-1')).toBe(1.00);
    });
    test('calcCodeReview', async () => {
        const token = process.env.GITHUB_TOKEN || "";
        const inputURL = "https://github.com/defunkt/zippy";

        const repoDetails = await getRepoDetails(token, inputURL);
        const [owner, repo, repoURL]: [string, string, string] = repoDetails;
        const repoData = await fetchRepoData(owner, repo, token);

        const codeReview = await calcCodeReview(owner, repo, repoURL);
        
        expect(parseFloat((codeReview).toFixed(2) ?? '-1')).toBe(0.00);
    });

    // Testing workers
    test('workers', async () => {
        const token = process.env.GITHUB_TOKEN || "";
        const inputURL = "https://github.com/defunkt/zippy";
        const repoDetails = await getRepoDetails(token, inputURL);
        const [owner, repo, repoURL]: [string, string, string] = repoDetails;
        const repoData = await fetchRepoData(owner, repo, token);
    
        const busFactorWorker = calculateMetric({ owner, repo, token, repoURL, repoData, metric: "busFactor" });
        const correctnessWorker = calculateMetric({ owner, repo, token, repoURL, repoData, metric: "correctness" });
        const rampUpWorker = calculateMetric({ owner, repo, token, repoURL, repoData, metric: "rampUp" });
        const responsivenessWorker = calculateMetric({ owner, repo, token, repoURL, repoData, metric: "responsiveness" });
        const licenseWorker = calculateMetric({ owner, repo, token, repoURL, repoData, metric: "license" });
        const dependencyPinningWorker = calculateMetric({ owner, repo, token, repoURL, repoData, metric: "dependencyPinning" });
    
        const results = await Promise.all([
            busFactorWorker,
            correctnessWorker,
            rampUpWorker,
            responsivenessWorker,
            licenseWorker,
            dependencyPinningWorker
        ]);
    
        expect(parseFloat(results[0].score.toFixed(2) ?? '-1')).toBe(0.05);
    });

    // Testing GitHub API requests
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

    // Testing writing to file
    test('writeFile', async () => {
        await writeFile("testing writeFile from test suite", process.env.LOG_FILE!);

        const fs = require('fs');
        const logContent = fs.readFileSync(process.env.LOG_FILE, 'utf8');

        // check that log file is not empty
        expect(logContent.trim()).not.toBe('');
    });

    // Testing helper functions for license metric
    test('hasLicenseHeading', async () => {
        let match = hasLicenseHeading("this should not match anything");
        expect(match).toBe(false);
    });

    // Testing helper functions for dependency pinning metric
    test('isVersionPinned', () => {
        // Test exact versions
        expect(isVersionPinned("1.2.3")).toBe(true);
        
        // Test version ranges
        expect(isVersionPinned("1.2.x")).toBe(true);
        expect(isVersionPinned("1.2.*")).toBe(true);
        expect(isVersionPinned("~1.2.0")).toBe(true);
        expect(isVersionPinned("^1.0.0")).toBe(true);
        expect(isVersionPinned(">=1.0.0")).toBe(true);
        expect(isVersionPinned("<1.0.0")).toBe(true);
        
        // Test unpinned versions
        expect(isVersionPinned("v1.2.3")).toBe(false);
        expect(isVersionPinned("*")).toBe(false);
        expect(isVersionPinned("latest")).toBe(false);
    });

    // Testing urlHandler.ts functions
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

    // Testing existence of folder (I THINK THIS IS NEVER CALLED FROM ANYWHERE)
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