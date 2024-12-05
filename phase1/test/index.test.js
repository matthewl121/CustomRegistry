"use strict";
/**
* index.test.ts
* Test suite for package metrics and utilities
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
const metric_1 = require("../src/metrics/metric");
const busFactor_1 = require("../src/metrics/busFactor");
const correctness_1 = require("../src/metrics/correctness");
const responsiveMaintainer_1 = require("../src/metrics/responsiveMaintainer");
const license_1 = require("../src/metrics/license");
const rampUp_1 = require("../src/metrics/rampUp");
const dependencyPinning_1 = require("../src/metrics/dependencyPinning");
const codeReview_1 = require("../src/metrics/codeReview");
const log_1 = require("../src/utils/log");
const path = __importStar(require("path"));
const worker_1 = require("../src/utils/worker");
const apiUtils_1 = require("../src/api/apiUtils");
const utils_1 = require("../src/utils/utils");
const npmApi_1 = require("../src/api/npmApi");
const graphqlQueries_1 = require("../src/api/graphqlQueries");
const { expect, describe, it } = require('@jest/globals');
jest.setTimeout(30000); // Set timeout to 20 seconds for all tests in this file
describe('Test suite', () => {
    // Testing all metrics with github/jspec
    test('github/jspec, bus factor', () => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b;
        const token = process.env.GITHUB_TOKEN || "";
        const inputURL = "https://github.com/wycats/jspec";
        const repoDetails = yield (0, urlHandler_1.getRepoDetails)(token, inputURL);
        const [owner, repo, repoURL] = repoDetails;
        const repoData = yield (0, githubApi_1.fetchRepoData)(owner, repo, token);
        let metrics = yield (0, metric_1.calculateMetrics)(owner, repo, token, repoURL, repoData, inputURL);
        expect(parseFloat((_b = (_a = metrics === null || metrics === void 0 ? void 0 : metrics.BusFactor) === null || _a === void 0 ? void 0 : _a.toFixed(2)) !== null && _b !== void 0 ? _b : '-1')).toBe(0.05);
    }));
    test('github/jspec, correctness', () => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b;
        const token = process.env.GITHUB_TOKEN || "";
        const inputURL = "https://github.com/wycats/jspec";
        const repoDetails = yield (0, urlHandler_1.getRepoDetails)(token, inputURL);
        const [owner, repo, repoURL] = repoDetails;
        const repoData = yield (0, githubApi_1.fetchRepoData)(owner, repo, token);
        let metrics = yield (0, metric_1.calculateMetrics)(owner, repo, token, repoURL, repoData, inputURL);
        expect(parseFloat((_b = (_a = metrics === null || metrics === void 0 ? void 0 : metrics.Correctness) === null || _a === void 0 ? void 0 : _a.toFixed(2)) !== null && _b !== void 0 ? _b : '-1')).toBe(0.00); // TODO: CHECK THIS
    }));
    test('github/jspec, ramp up', () => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b;
        const token = process.env.GITHUB_TOKEN || "";
        const inputURL = "https://github.com/wycats/jspec";
        const repoDetails = yield (0, urlHandler_1.getRepoDetails)(token, inputURL);
        const [owner, repo, repoURL] = repoDetails;
        const repoData = yield (0, githubApi_1.fetchRepoData)(owner, repo, token);
        let metrics = yield (0, metric_1.calculateMetrics)(owner, repo, token, repoURL, repoData, inputURL);
        expect(parseFloat((_b = (_a = metrics === null || metrics === void 0 ? void 0 : metrics.RampUp) === null || _a === void 0 ? void 0 : _a.toFixed(2)) !== null && _b !== void 0 ? _b : '-1')).toBe(0.90);
    }));
    test('github/jspec, responsiveness', () => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b;
        const token = process.env.GITHUB_TOKEN || "";
        const inputURL = "https://github.com/wycats/jspec";
        const repoDetails = yield (0, urlHandler_1.getRepoDetails)(token, inputURL);
        const [owner, repo, repoURL] = repoDetails;
        const repoData = yield (0, githubApi_1.fetchRepoData)(owner, repo, token);
        let metrics = yield (0, metric_1.calculateMetrics)(owner, repo, token, repoURL, repoData, inputURL);
        expect(parseFloat((_b = (_a = metrics === null || metrics === void 0 ? void 0 : metrics.ResponsiveMaintainer) === null || _a === void 0 ? void 0 : _a.toFixed(2)) !== null && _b !== void 0 ? _b : '-1')).toBe(0.00);
    }));
    test('github/jspec, license', () => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b;
        const token = process.env.GITHUB_TOKEN || "";
        const inputURL = "https://github.com/wycats/jspec";
        const repoDetails = yield (0, urlHandler_1.getRepoDetails)(token, inputURL);
        const [owner, repo, repoURL] = repoDetails;
        const repoData = yield (0, githubApi_1.fetchRepoData)(owner, repo, token);
        let metrics = yield (0, metric_1.calculateMetrics)(owner, repo, token, repoURL, repoData, inputURL);
        expect(parseFloat((_b = (_a = metrics === null || metrics === void 0 ? void 0 : metrics.License) === null || _a === void 0 ? void 0 : _a.toFixed(2)) !== null && _b !== void 0 ? _b : '-1')).toBe(1.00);
    }));
    test('github/jspec, dependency pinning', () => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b;
        const token = process.env.GITHUB_TOKEN || "";
        const inputURL = "https://github.com/wycats/jspec";
        const repoDetails = yield (0, urlHandler_1.getRepoDetails)(token, inputURL);
        const [owner, repo, repoURL] = repoDetails;
        const repoData = yield (0, githubApi_1.fetchRepoData)(owner, repo, token);
        let metrics = yield (0, metric_1.calculateMetrics)(owner, repo, token, repoURL, repoData, inputURL);
        expect(parseFloat((_b = (_a = metrics === null || metrics === void 0 ? void 0 : metrics.DependencyPinning) === null || _a === void 0 ? void 0 : _a.toFixed(2)) !== null && _b !== void 0 ? _b : '-1')).toBe(1.00);
    }));
    test('github/jspec, code review fraction', () => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b;
        const token = process.env.GITHUB_TOKEN || "";
        const inputURL = "https://github.com/wycats/jspec";
        const repoDetails = yield (0, urlHandler_1.getRepoDetails)(token, inputURL);
        const [owner, repo, repoURL] = repoDetails;
        const repoData = yield (0, githubApi_1.fetchRepoData)(owner, repo, token);
        let metrics = yield (0, metric_1.calculateMetrics)(owner, repo, token, repoURL, repoData, inputURL);
        expect(parseFloat((_b = (_a = metrics === null || metrics === void 0 ? void 0 : metrics.CodeReview) === null || _a === void 0 ? void 0 : _a.toFixed(2)) !== null && _b !== void 0 ? _b : '-1')).toBe(0.25);
    }));
    // Testing "all" metrics with npm/ts-node
    test('npm/ts-node, code review fraction', () => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b;
        const token = process.env.GITHUB_TOKEN || "";
        const inputURL = "https://www.npmjs.com/package/ts-node";
        const repoDetails = yield (0, urlHandler_1.getRepoDetails)(token, inputURL);
        const [owner, repo, repoURL] = repoDetails;
        const repoData = yield (0, githubApi_1.fetchRepoData)(owner, repo, token);
        let metrics = yield (0, metric_1.calculateMetrics)(owner, repo, token, repoURL, repoData, inputURL);
        expect(parseFloat((_b = (_a = metrics === null || metrics === void 0 ? void 0 : metrics.CodeReview) === null || _a === void 0 ? void 0 : _a.toFixed(2)) !== null && _b !== void 0 ? _b : '-1')).toBe(0.95);
    }));
    // Testing log file functions
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
        let metrics = yield (0, metric_1.calculateMetrics)(owner, repo, token, repoURL, repoData, inputURL);
        (0, log_1.metricsLogToStdout)(metrics, 2);
        const fs = require('fs');
        const logContent = fs.readFileSync(process.env.LOG_FILE, 'utf8');
        // check that log file is not empty
        expect(logContent.trim()).not.toBe('');
    }));
    // Testing all metric score functions
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
            busFactor = (0, busFactor_1.calcBusFactorScore)(contributorActivity.data);
        }
        expect(parseFloat((_a = (busFactor).toFixed(2)) !== null && _a !== void 0 ? _a : '-1')).toBe(0.05);
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
        const correctness = (0, correctness_1.calcCorrectnessScore)(totalOpenIssues.totalCount, totalClosedIssues.totalCount);
        expect(parseFloat((_c = (correctness).toFixed(2)) !== null && _c !== void 0 ? _c : '-1')).toBe(1.00);
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
        const responsiveness = (0, responsiveMaintainer_1.calcResponsivenessScore)(totalClosedIssues.nodes, totalOpenIssues.nodes, recentPullRequests.nodes, oneMonthAgo, isArchived !== null && isArchived !== void 0 ? isArchived : false);
        expect(parseFloat((_e = (responsiveness).toFixed(2)) !== null && _e !== void 0 ? _e : '-1')).toBe(0.00);
    }));
    test('calcLicenseScore', () => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        const token = process.env.GITHUB_TOKEN || "";
        const inputURL = "https://github.com/defunkt/zippy";
        const repoDetails = yield (0, urlHandler_1.getRepoDetails)(token, inputURL);
        const [owner, repo, repoURL] = repoDetails;
        const repoData = yield (0, githubApi_1.fetchRepoData)(owner, repo, token);
        const localDir = path.join("./repos", `${owner}_${repo}`);
        const license = yield (0, license_1.calcLicenseScore)(repoURL, localDir);
        expect(parseFloat((_a = (license).toFixed(2)) !== null && _a !== void 0 ? _a : '-1')).toBe(0.00);
    }));
    test('calcDependencyPinningScore', () => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b, _c, _d;
        // Test case 1: No dependencies
        const noDependencies = {
            data: {
                dependencies: {},
                devDependencies: {},
                peerDependencies: {}
            }
        };
        let result = yield (0, dependencyPinning_1.calcDependencyPinningScore)(noDependencies);
        expect(parseFloat((_a = (result).toFixed(2)) !== null && _a !== void 0 ? _a : '-1')).toBe(1.00);
        // Test case 2: All dependencies pinned
        const allPinned = {
            data: {
                dependencies: {
                    "react": "17.0.2",
                    "lodash": "4.17.21"
                }
            }
        };
        result = yield (0, dependencyPinning_1.calcDependencyPinningScore)(allPinned);
        expect(parseFloat((_b = (result).toFixed(2)) !== null && _b !== void 0 ? _b : '-1')).toBe(1.00);
        // Test case 3: Mixed pinned and unpinned
        const mixed = {
            data: {
                dependencies: {
                    "react": "hi",
                    "lodash": "4.17.21"
                }
            }
        };
        result = yield (0, dependencyPinning_1.calcDependencyPinningScore)(mixed);
        expect(parseFloat((_c = (result).toFixed(2)) !== null && _c !== void 0 ? _c : '-1')).toBe(0.50);
        // Test case 4: None pinned
        const nonePinned = {
            data: {
                dependencies: {
                    "react": "none",
                    "lodash": "hi"
                }
            }
        };
        result = yield (0, dependencyPinning_1.calcDependencyPinningScore)(nonePinned);
        expect(parseFloat((_d = (result).toFixed(2)) !== null && _d !== void 0 ? _d : '-1')).toBe(0.00);
    }));
    test('calcDependencyPinningScore w/ other dependencies', () => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
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
        let result = yield (0, dependencyPinning_1.calcDependencyPinningScore)(allPinned);
        expect(parseFloat((_a = (result).toFixed(2)) !== null && _a !== void 0 ? _a : '-1')).toBe(1.00);
    }));
    test('calcCodeReviewScore', () => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        const token = process.env.GITHUB_TOKEN || "";
        const inputURL = "https://github.com/defunkt/zippy";
        const repoDetails = yield (0, urlHandler_1.getRepoDetails)(token, inputURL);
        const [owner, repo, repoURL] = repoDetails;
        const repoData = yield (0, githubApi_1.fetchRepoData)(owner, repo, token);
        let codeReview;
        // get number of lines introduced and total lines in repo
        const codeReviewActivity = yield (0, githubApi_1.fetchCodeReviewActivity)(owner, repo, token);
        if (!codeReviewActivity.linesIntroduced || !codeReviewActivity.totalLines) {
            return 0;
        }
        // get score
        codeReview = (0, codeReview_1.calcCodeReviewScore)(codeReviewActivity.linesIntroduced, codeReviewActivity.totalLines);
        expect(parseFloat((_a = (codeReview).toFixed(2)) !== null && _a !== void 0 ? _a : '-1')).toBe(0.00);
    }));
    // Testing all metric functions
    test('calcBusFactor', () => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        const token = process.env.GITHUB_TOKEN || "";
        const inputURL = "https://github.com/defunkt/zippy";
        const repoDetails = yield (0, urlHandler_1.getRepoDetails)(token, inputURL);
        const [owner, repo, repoURL] = repoDetails;
        const repoData = yield (0, githubApi_1.fetchRepoData)(owner, repo, token);
        let busFactor = yield (0, busFactor_1.calcBusFactor)(owner, repo, token);
        expect(parseFloat((_a = (busFactor).toFixed(2)) !== null && _a !== void 0 ? _a : '-1')).toBe(0.05);
    }));
    test('calcCorrectness', () => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        const token = process.env.GITHUB_TOKEN || "";
        const inputURL = "https://github.com/defunkt/zippy";
        const repoDetails = yield (0, urlHandler_1.getRepoDetails)(token, inputURL);
        const [owner, repo, repoURL] = repoDetails;
        const repoData = yield (0, githubApi_1.fetchRepoData)(owner, repo, token);
        const correctness = (0, correctness_1.calcCorrectness)(repoData);
        expect(parseFloat((_a = (correctness).toFixed(2)) !== null && _a !== void 0 ? _a : '-1')).toBe(1.00);
    }));
    test('calcResponsiveness', () => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        const token = process.env.GITHUB_TOKEN || "";
        const inputURL = "https://github.com/defunkt/zippy";
        const repoDetails = yield (0, urlHandler_1.getRepoDetails)(token, inputURL);
        const [owner, repo, repoURL] = repoDetails;
        const repoData = yield (0, githubApi_1.fetchRepoData)(owner, repo, token);
        const responsiveness = (0, responsiveMaintainer_1.calcResponsiveness)(repoData);
        expect(parseFloat((_a = (responsiveness).toFixed(2)) !== null && _a !== void 0 ? _a : '-1')).toBe(0.00);
    }));
    test('calcLicense', () => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        const token = process.env.GITHUB_TOKEN || "";
        const inputURL = "https://github.com/defunkt/zippy";
        const repoDetails = yield (0, urlHandler_1.getRepoDetails)(token, inputURL);
        const [owner, repo, repoURL] = repoDetails;
        const repoData = yield (0, githubApi_1.fetchRepoData)(owner, repo, token);
        const license = yield (0, license_1.calcLicense)(owner, repo, repoURL);
        expect(parseFloat((_a = (license).toFixed(2)) !== null && _a !== void 0 ? _a : '-1')).toBe(0.00);
    }));
    test('calcRampUp', () => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        const token = process.env.GITHUB_TOKEN || "";
        const inputURL = "https://github.com/defunkt/zippy";
        const repoDetails = yield (0, urlHandler_1.getRepoDetails)(token, inputURL);
        const [owner, repo, repoURL] = repoDetails;
        const repoData = yield (0, githubApi_1.fetchRepoData)(owner, repo, token);
        const rampUp = yield (0, rampUp_1.calcRampUp)(repoData);
        expect(parseFloat((_a = (rampUp).toFixed(2)) !== null && _a !== void 0 ? _a : '-1')).toBe(0.80);
    }));
    test('calcDependencyPinning', () => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        const token = process.env.GITHUB_TOKEN || "";
        const inputURL = "https://github.com/defunkt/zippy";
        const repoDetails = yield (0, urlHandler_1.getRepoDetails)(token, inputURL);
        const [owner, repo, repoURL] = repoDetails;
        const dependencyPinning = yield (0, dependencyPinning_1.calcDependencyPinning)(owner, repo, token);
        expect(parseFloat((_a = (dependencyPinning).toFixed(2)) !== null && _a !== void 0 ? _a : '-1')).toBe(1.00);
    }));
    test('calcCodeReview', () => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        const token = process.env.GITHUB_TOKEN || "";
        const inputURL = "https://github.com/defunkt/zippy";
        const repoDetails = yield (0, urlHandler_1.getRepoDetails)(token, inputURL);
        const [owner, repo, repoURL] = repoDetails;
        const repoData = yield (0, githubApi_1.fetchRepoData)(owner, repo, token);
        const codeReview = yield (0, codeReview_1.calcCodeReview)(owner, repo, repoURL);
        expect(parseFloat((_a = (codeReview).toFixed(2)) !== null && _a !== void 0 ? _a : '-1')).toBe(0.00);
    }));
    // Testing workers
    test('workers', () => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        const token = process.env.GITHUB_TOKEN || "";
        const inputURL = "https://github.com/defunkt/zippy";
        const repoDetails = yield (0, urlHandler_1.getRepoDetails)(token, inputURL);
        const [owner, repo, repoURL] = repoDetails;
        const repoData = yield (0, githubApi_1.fetchRepoData)(owner, repo, token);
        const busFactorWorker = (0, worker_1.calculateMetric)({ owner, repo, token, repoURL, repoData, metric: "busFactor" });
        const correctnessWorker = (0, worker_1.calculateMetric)({ owner, repo, token, repoURL, repoData, metric: "correctness" });
        const rampUpWorker = (0, worker_1.calculateMetric)({ owner, repo, token, repoURL, repoData, metric: "rampUp" });
        const responsivenessWorker = (0, worker_1.calculateMetric)({ owner, repo, token, repoURL, repoData, metric: "responsiveness" });
        const licenseWorker = (0, worker_1.calculateMetric)({ owner, repo, token, repoURL, repoData, metric: "license" });
        const dependencyPinningWorker = (0, worker_1.calculateMetric)({ owner, repo, token, repoURL, repoData, metric: "dependencyPinning" });
        const results = yield Promise.all([
            busFactorWorker,
            correctnessWorker,
            rampUpWorker,
            responsivenessWorker,
            licenseWorker,
            dependencyPinningWorker
        ]);
        expect(parseFloat((_a = results[0].score.toFixed(2)) !== null && _a !== void 0 ? _a : '-1')).toBe(0.05);
    }));
    // Testing GitHub API requests
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
    // Testing writing to file
    test('writeFile', () => __awaiter(void 0, void 0, void 0, function* () {
        yield (0, utils_1.writeFile)("testing writeFile from test suite", process.env.LOG_FILE);
        const fs = require('fs');
        const logContent = fs.readFileSync(process.env.LOG_FILE, 'utf8');
        // check that log file is not empty
        expect(logContent.trim()).not.toBe('');
    }));
    // Testing helper functions for license metric
    test('hasLicenseHeading', () => __awaiter(void 0, void 0, void 0, function* () {
        let match = (0, utils_1.hasLicenseHeading)("this should not match anything");
        expect(match).toBe(false);
    }));
    // Testing helper functions for dependency pinning metric
    test('isVersionPinned', () => {
        // Test exact versions
        expect((0, dependencyPinning_1.isVersionPinned)("1.2.3")).toBe(true);
        // Test version ranges
        expect((0, dependencyPinning_1.isVersionPinned)("1.2.x")).toBe(true);
        expect((0, dependencyPinning_1.isVersionPinned)("1.2.*")).toBe(true);
        expect((0, dependencyPinning_1.isVersionPinned)("~1.2.0")).toBe(true);
        expect((0, dependencyPinning_1.isVersionPinned)("^1.0.0")).toBe(true);
        expect((0, dependencyPinning_1.isVersionPinned)(">=1.0.0")).toBe(true);
        expect((0, dependencyPinning_1.isVersionPinned)("<1.0.0")).toBe(true);
        // Test unpinned versions
        expect((0, dependencyPinning_1.isVersionPinned)("v1.2.3")).toBe(false);
        expect((0, dependencyPinning_1.isVersionPinned)("*")).toBe(false);
        expect((0, dependencyPinning_1.isVersionPinned)("latest")).toBe(false);
    });
    // Testing urlHandler.ts functions
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
    // Testing existence of folder (I THINK THIS IS NEVER CALLED FROM ANYWHERE)
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
