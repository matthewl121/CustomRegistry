"use strict";
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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const githubApi_1 = require("../src/api/githubApi");
const urlHandler_1 = require("../src/utils/urlHandler");
const metricCalcs_1 = require("../src/metricCalcs");
const log_1 = require("../src/utils/log");
const path = __importStar(require("path"));
const index_1 = require("../src/index");
const apiUtils_1 = require("../src/api/apiUtils");
const utils_1 = require("../src/utils/utils");
const npmApi_1 = require("../src/api/npmApi");
const graphqlQueries_1 = require("../src/api/graphqlQueries");
describe('Test suite', () => {
    test('github/jspec, bus factor', () => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b;
        const token = process.env.GITHUB_TOKEN || "";
        const inputURL = "https://github.com/wycats/jspec";
        const repoDetails = yield (0, urlHandler_1.getRepoDetails)(token, inputURL);
        const [owner, repo, repoURL] = repoDetails;
        const repoData = yield (0, githubApi_1.fetchRepoData)(owner, repo, token);
        let metrics = yield (0, metricCalcs_1.calculateMetrics)(owner, repo, token, repoURL, repoData, inputURL);
        expect(parseFloat((_b = (_a = metrics === null || metrics === void 0 ? void 0 : metrics.BusFactor) === null || _a === void 0 ? void 0 : _a.toFixed(2)) !== null && _b !== void 0 ? _b : '0')).toBe(0.05);
    }));
    test('github/jspec, correctness', () => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b;
        const token = process.env.GITHUB_TOKEN || "";
        const inputURL = "https://github.com/wycats/jspec";
        const repoDetails = yield (0, urlHandler_1.getRepoDetails)(token, inputURL);
        const [owner, repo, repoURL] = repoDetails;
        const repoData = yield (0, githubApi_1.fetchRepoData)(owner, repo, token);
        let metrics = yield (0, metricCalcs_1.calculateMetrics)(owner, repo, token, repoURL, repoData, inputURL);
        expect(parseFloat((_b = (_a = metrics === null || metrics === void 0 ? void 0 : metrics.Correctness) === null || _a === void 0 ? void 0 : _a.toFixed(2)) !== null && _b !== void 0 ? _b : '0')).toBe(1.00);
    }));
    test('github/jspec, ramp up', () => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b;
        const token = process.env.GITHUB_TOKEN || "";
        const inputURL = "https://github.com/wycats/jspec";
        const repoDetails = yield (0, urlHandler_1.getRepoDetails)(token, inputURL);
        const [owner, repo, repoURL] = repoDetails;
        const repoData = yield (0, githubApi_1.fetchRepoData)(owner, repo, token);
        let metrics = yield (0, metricCalcs_1.calculateMetrics)(owner, repo, token, repoURL, repoData, inputURL);
        expect(parseFloat((_b = (_a = metrics === null || metrics === void 0 ? void 0 : metrics.RampUp) === null || _a === void 0 ? void 0 : _a.toFixed(2)) !== null && _b !== void 0 ? _b : '0')).toBe(0.90);
    }));
    test('github/jspec, responsiveness', () => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b;
        const token = process.env.GITHUB_TOKEN || "";
        const inputURL = "https://github.com/wycats/jspec";
        const repoDetails = yield (0, urlHandler_1.getRepoDetails)(token, inputURL);
        const [owner, repo, repoURL] = repoDetails;
        const repoData = yield (0, githubApi_1.fetchRepoData)(owner, repo, token);
        let metrics = yield (0, metricCalcs_1.calculateMetrics)(owner, repo, token, repoURL, repoData, inputURL);
        expect(parseFloat((_b = (_a = metrics === null || metrics === void 0 ? void 0 : metrics.ResponsiveMaintainer) === null || _a === void 0 ? void 0 : _a.toFixed(2)) !== null && _b !== void 0 ? _b : '0')).toBe(0.00);
    }));
    test('github/jspec, license', () => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b;
        const token = process.env.GITHUB_TOKEN || "";
        const inputURL = "https://github.com/wycats/jspec";
        const repoDetails = yield (0, urlHandler_1.getRepoDetails)(token, inputURL);
        const [owner, repo, repoURL] = repoDetails;
        const repoData = yield (0, githubApi_1.fetchRepoData)(owner, repo, token);
        let metrics = yield (0, metricCalcs_1.calculateMetrics)(owner, repo, token, repoURL, repoData, inputURL);
        expect(parseFloat((_b = (_a = metrics === null || metrics === void 0 ? void 0 : metrics.License) === null || _a === void 0 ? void 0 : _a.toFixed(2)) !== null && _b !== void 0 ? _b : '0')).toBe(1.00);
    }));
    test('logging messages to log file', () => __awaiter(void 0, void 0, void 0, function* () {
        (0, log_1.initLogFile)();
        (0, log_1.logToFile)("Informational log from test", 1);
        (0, log_1.logToFile)("Debugging log from test", 2);
        const fs = require('fs');
        const logContent = fs.readFileSync(process.env.LOG_FILE, 'utf8');
        // check that log file is not empty
        expect(logContent.trim()).not.toBe('');
    }));
    test('logging metrics log file with null', () => __awaiter(void 0, void 0, void 0, function* () {
        (0, log_1.initLogFile)();
        (0, log_1.metricsLogToStdout)("Metric scoring from test", 2);
        const fs = require('fs');
        const logContent = fs.readFileSync(process.env.LOG_FILE, 'utf8');
        // check that log file is empty
        expect(logContent.trim()).toBe('');
    }));
    test('logging metrics log file with object', () => __awaiter(void 0, void 0, void 0, function* () {
        (0, log_1.initLogFile)();
        const token = process.env.GITHUB_TOKEN || "";
        const inputURL = "https://github.com/wycats/jspec";
        const repoDetails = yield (0, urlHandler_1.getRepoDetails)(token, inputURL);
        const [owner, repo, repoURL] = repoDetails;
        const repoData = yield (0, githubApi_1.fetchRepoData)(owner, repo, token);
        let metrics = yield (0, metricCalcs_1.calculateMetrics)(owner, repo, token, repoURL, repoData, inputURL);
        (0, log_1.metricsLogToStdout)(metrics, 2);
        const fs = require('fs');
        const logContent = fs.readFileSync(process.env.LOG_FILE, 'utf8');
        // check that log file is not empty
        expect(logContent.trim()).not.toBe('');
    }));
    test('calcBusFactorScore', () => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        const token = process.env.GITHUB_TOKEN || "";
        const inputURL = "https://github.com/defunkt/zippy";
        const repoDetails = yield (0, urlHandler_1.getRepoDetails)(token, inputURL);
        const [owner, repo, repoURL] = repoDetails;
        const repoData = yield (0, githubApi_1.fetchRepoData)(owner, repo, token);
        let busFactor;
        const contributorActivity = yield (0, githubApi_1.fetchContributorActivity)(owner, repo, token);
        if (!(contributorActivity === null || contributorActivity === void 0 ? void 0 : contributorActivity.data) || !Array.isArray(contributorActivity.data)) {
            busFactor = -1;
        }
        else {
            busFactor = (0, metricCalcs_1.calcBusFactorScore)(contributorActivity.data);
        }
        expect(parseFloat((_a = (busFactor).toFixed(2)) !== null && _a !== void 0 ? _a : '0')).toBe(0.05);
    }));
    test('calcCorrectnessScore', () => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b, _c;
        const token = process.env.GITHUB_TOKEN || "";
        const inputURL = "https://github.com/defunkt/zippy";
        const repoDetails = yield (0, urlHandler_1.getRepoDetails)(token, inputURL);
        const [owner, repo, repoURL] = repoDetails;
        const repoData = yield (0, githubApi_1.fetchRepoData)(owner, repo, token);
        const totalOpenIssues = (_a = repoData.data) === null || _a === void 0 ? void 0 : _a.data.repository.openIssues;
        const totalClosedIssues = (_b = repoData.data) === null || _b === void 0 ? void 0 : _b.data.repository.closedIssues;
        if (!totalOpenIssues || !totalClosedIssues) {
            return -1;
        }
        const correctness = (0, metricCalcs_1.calcCorrectnessScore)(totalOpenIssues.totalCount, totalClosedIssues.totalCount);
        expect(parseFloat((_c = (correctness).toFixed(2)) !== null && _c !== void 0 ? _c : '0')).toBe(1.00);
    }));
    test('calcResponsivenessScore', () => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b, _c, _d, _e;
        const token = process.env.GITHUB_TOKEN || "";
        const inputURL = "https://github.com/defunkt/zippy";
        const repoDetails = yield (0, urlHandler_1.getRepoDetails)(token, inputURL);
        const [owner, repo, repoURL] = repoDetails;
        const repoData = yield (0, githubApi_1.fetchRepoData)(owner, repo, token);
        const recentPullRequests = (_a = repoData.data) === null || _a === void 0 ? void 0 : _a.data.repository.pullRequests;
        const isArchived = (_b = repoData.data) === null || _b === void 0 ? void 0 : _b.data.repository.isArchived;
        const totalOpenIssues = (_c = repoData.data) === null || _c === void 0 ? void 0 : _c.data.repository.openIssues;
        const totalClosedIssues = (_d = repoData.data) === null || _d === void 0 ? void 0 : _d.data.repository.closedIssues;
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
        if (!(recentPullRequests === null || recentPullRequests === void 0 ? void 0 : recentPullRequests.nodes) || !(totalClosedIssues === null || totalClosedIssues === void 0 ? void 0 : totalClosedIssues.nodes) || !(totalOpenIssues === null || totalOpenIssues === void 0 ? void 0 : totalOpenIssues.nodes)) {
            return -1;
        }
        const responsiveness = (0, metricCalcs_1.calcResponsivenessScore)(totalClosedIssues.nodes, totalOpenIssues.nodes, recentPullRequests.nodes, oneMonthAgo, isArchived !== null && isArchived !== void 0 ? isArchived : false);
        expect(parseFloat((_e = (responsiveness).toFixed(2)) !== null && _e !== void 0 ? _e : '0')).toBe(0.00);
    }));
    test('calcLicenseScore', () => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        const token = process.env.GITHUB_TOKEN || "";
        const inputURL = "https://github.com/defunkt/zippy";
        const repoDetails = yield (0, urlHandler_1.getRepoDetails)(token, inputURL);
        const [owner, repo, repoURL] = repoDetails;
        const repoData = yield (0, githubApi_1.fetchRepoData)(owner, repo, token);
        const localDir = path.join("./repos", `${owner}_${repo}`);
        const license = yield (0, metricCalcs_1.calcLicenseScore)(repoURL, localDir);
        expect(parseFloat((_a = (license).toFixed(2)) !== null && _a !== void 0 ? _a : '0')).toBe(0.00);
    }));
    test('calcBusFactor', () => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        const token = process.env.GITHUB_TOKEN || "";
        const inputURL = "https://github.com/defunkt/zippy";
        const repoDetails = yield (0, urlHandler_1.getRepoDetails)(token, inputURL);
        const [owner, repo, repoURL] = repoDetails;
        const repoData = yield (0, githubApi_1.fetchRepoData)(owner, repo, token);
        let busFactor = yield (0, metricCalcs_1.calcBusFactor)(owner, repo, token);
        expect(parseFloat((_a = (busFactor).toFixed(2)) !== null && _a !== void 0 ? _a : '0')).toBe(0.05);
    }));
    test('calcCorrectness', () => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        const token = process.env.GITHUB_TOKEN || "";
        const inputURL = "https://github.com/defunkt/zippy";
        const repoDetails = yield (0, urlHandler_1.getRepoDetails)(token, inputURL);
        const [owner, repo, repoURL] = repoDetails;
        const repoData = yield (0, githubApi_1.fetchRepoData)(owner, repo, token);
        const correctness = (0, metricCalcs_1.calcCorrectness)(repoData);
        expect(parseFloat((_a = (correctness).toFixed(2)) !== null && _a !== void 0 ? _a : '0')).toBe(1.00);
    }));
    test('calcResponsiveness', () => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        const token = process.env.GITHUB_TOKEN || "";
        const inputURL = "https://github.com/defunkt/zippy";
        const repoDetails = yield (0, urlHandler_1.getRepoDetails)(token, inputURL);
        const [owner, repo, repoURL] = repoDetails;
        const repoData = yield (0, githubApi_1.fetchRepoData)(owner, repo, token);
        const responsiveness = (0, metricCalcs_1.calcResponsiveness)(repoData);
        expect(parseFloat((_a = (responsiveness).toFixed(2)) !== null && _a !== void 0 ? _a : '0')).toBe(0.00);
    }));
    test('calcLicense', () => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        const token = process.env.GITHUB_TOKEN || "";
        const inputURL = "https://github.com/defunkt/zippy";
        const repoDetails = yield (0, urlHandler_1.getRepoDetails)(token, inputURL);
        const [owner, repo, repoURL] = repoDetails;
        const repoData = yield (0, githubApi_1.fetchRepoData)(owner, repo, token);
        const license = yield (0, metricCalcs_1.calcLicense)(owner, repo, repoURL);
        expect(parseFloat((_a = (license).toFixed(2)) !== null && _a !== void 0 ? _a : '0')).toBe(0.00);
    }));
    test('calcRampUp', () => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        const token = process.env.GITHUB_TOKEN || "";
        const inputURL = "https://github.com/defunkt/zippy";
        const repoDetails = yield (0, urlHandler_1.getRepoDetails)(token, inputURL);
        const [owner, repo, repoURL] = repoDetails;
        const repoData = yield (0, githubApi_1.fetchRepoData)(owner, repo, token);
        const rampUp = yield (0, metricCalcs_1.calcRampUp)(repoData);
        expect(parseFloat((_a = (rampUp).toFixed(2)) !== null && _a !== void 0 ? _a : '0')).toBe(0.80);
    }));
    test('workers', () => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        const token = process.env.GITHUB_TOKEN || "";
        const inputURL = "https://github.com/defunkt/zippy";
        const repoDetails = yield (0, urlHandler_1.getRepoDetails)(token, inputURL);
        const [owner, repo, repoURL] = repoDetails;
        const repoData = yield (0, githubApi_1.fetchRepoData)(owner, repo, token);
        const busFactorWorker = (0, index_1.runWorker)(owner, repo, token, repoURL, repoData, "busFactor");
        const correctnessWorker = (0, index_1.runWorker)(owner, repo, token, repoURL, repoData, "correctness");
        const rampUpWorker = (0, index_1.runWorker)(owner, repo, token, repoURL, repoData, "rampUp");
        const responsivenessWorker = (0, index_1.runWorker)(owner, repo, token, repoURL, repoData, "responsiveness");
        const licenseWorker = (0, index_1.runWorker)(owner, repo, token, repoURL, repoData, "license");
        const results = yield Promise.all([busFactorWorker, correctnessWorker, rampUpWorker, responsivenessWorker, licenseWorker]);
        expect(parseFloat((_a = results[0].score.toFixed(2)) !== null && _a !== void 0 ? _a : '0')).toBe(0.05); // bus factor score
    }));
    test('apiGetRequest', () => __awaiter(void 0, void 0, void 0, function* () {
        const GITHUB_BASE_URL = "https://api.github.com";
        const token = process.env.GITHUB_TOKEN || "";
        const inputURL = "https://github.com/defunkt/zippy";
        const repoDetails = yield (0, urlHandler_1.getRepoDetails)(token, inputURL);
        const [owner, repo, repoURL] = repoDetails;
        const repoData = yield (0, githubApi_1.fetchRepoData)(owner, repo, token);
        const url = `${GITHUB_BASE_URL}/repos/${owner}/${repo}/stats/contributors`;
        const response = yield (0, apiUtils_1.apiGetRequest)(url, token);
        expect(response).not.toBe(null);
    }));
    test('apiPostRequest', () => __awaiter(void 0, void 0, void 0, function* () {
        const GITHUB_BASE_URL = "https://api.github.com";
        const token = process.env.GITHUB_TOKEN || "";
        const inputURL = "https://github.com/defunkt/zippy";
        const repoDetails = yield (0, urlHandler_1.getRepoDetails)(token, inputURL);
        const [owner, repo, repoURL] = repoDetails;
        const repoData = yield (0, githubApi_1.fetchRepoData)(owner, repo, token);
        const url = `${GITHUB_BASE_URL}/graphql`;
        const query = (0, graphqlQueries_1.getRepoDataQuery)(owner, repo);
        const body = JSON.stringify({ query });
        const response = yield (0, apiUtils_1.apiPostRequest)(url, body, token);
        expect(response).not.toBe(null);
    }));
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
    test('writeFile', () => __awaiter(void 0, void 0, void 0, function* () {
        yield (0, utils_1.writeFile)("testing writeFile from test suite", process.env.LOG_FILE);
        const fs = require('fs');
        const logContent = fs.readFileSync(process.env.LOG_FILE, 'utf8');
        // check that log file is not empty
        expect(logContent.trim()).not.toBe('');
    }));
    test('hasLicenseHeading', () => __awaiter(void 0, void 0, void 0, function* () {
        let match = (0, utils_1.hasLicenseHeading)("this should not match anything");
        expect(match).toBe(false);
    }));
    test('extractDomainFromUrl, extractNpmPackageName, fetchGithubUrlFromNpm, extractGithubOwnerAndRepo', () => __awaiter(void 0, void 0, void 0, function* () {
        const token = process.env.GITHUB_TOKEN || "";
        const inputURL = "https://github.com/wycats/jspec";
        // Extract hostname (www.npm.js or github.com or null)
        const hostname = (0, urlHandler_1.extractDomainFromUrl)(inputURL);
        let repoURL = "";
        // If url is npm, fetch the github repo
        if (hostname === "www.npmjs.com") {
            const npmPackageName = (0, urlHandler_1.extractNpmPackageName)(inputURL);
            // Fetch the Github repo url from npm package
            const npmResponse = yield (0, npmApi_1.fetchGithubUrlFromNpm)(npmPackageName);
            repoURL = npmResponse.data;
        }
        else {
            // URL must be github, so use it directly
            repoURL = inputURL;
        }
        const repoDetails = (0, urlHandler_1.extractGithubOwnerAndRepo)(repoURL);
        expect(repoDetails).not.toBe(null);
    }));
    test('checkFolderExists', () => __awaiter(void 0, void 0, void 0, function* () {
        const token = process.env.GITHUB_TOKEN || "";
        const inputURL = "https://github.com/wycats/jspec";
        const repoDetails = yield (0, urlHandler_1.getRepoDetails)(token, inputURL);
        const [owner, repo, repoURL] = repoDetails;
        const repoData = yield (0, githubApi_1.fetchRepoData)(owner, repo, token);
        let exists = yield (0, githubApi_1.checkFolderExists)(owner, repo, token);
        expect(exists).toBe(false);
    }));
});
