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
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var githubApi_1 = require("../src/api/githubApi");
var urlHandler_1 = require("../src/utils/urlHandler");
var metric_1 = require("../src/metrics/metric");
var busFactor_1 = require("../src/metrics/busFactor");
var correctness_1 = require("../src/metrics/correctness");
var responsiveMaintainer_1 = require("../src/metrics/responsiveMaintainer");
var license_1 = require("../src/metrics/license");
var rampUp_1 = require("../src/metrics/rampUp");
var dependencyPinning_1 = require("../src/metrics/dependencyPinning");
var codeReview_1 = require("../src/metrics/codeReview");
var log_1 = require("../src/utils/log");
var path = __importStar(require("path"));
var worker_1 = require("../src/utils/worker");
var apiUtils_1 = require("../src/api/apiUtils");
var utils_1 = require("../src/utils/utils");
var npmApi_1 = require("../src/api/npmApi");
var graphqlQueries_1 = require("../src/api/graphqlQueries");
var _a = require('@jest/globals'), expect = _a.expect, describe = _a.describe, it = _a.it;
jest.setTimeout(30000); // Set timeout to 20 seconds for all tests in this file
describe('Test suite', function () {
    // Testing all metrics with github/jspec
    test('github/jspec, bus factor', function () { return __awaiter(void 0, void 0, void 0, function () {
        var token, inputURL, repoDetails, owner, repo, repoURL, repoData, metrics;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    token = process.env.GITHUB_TOKEN || "";
                    inputURL = "https://github.com/wycats/jspec";
                    return [4 /*yield*/, (0, urlHandler_1.getRepoDetails)(token, inputURL)];
                case 1:
                    repoDetails = _c.sent();
                    owner = repoDetails[0], repo = repoDetails[1], repoURL = repoDetails[2];
                    return [4 /*yield*/, (0, githubApi_1.fetchRepoData)(owner, repo, token)];
                case 2:
                    repoData = _c.sent();
                    return [4 /*yield*/, (0, metric_1.calculateMetrics)(owner, repo, token, repoURL, repoData, inputURL)];
                case 3:
                    metrics = _c.sent();
                    expect(parseFloat((_b = (_a = metrics === null || metrics === void 0 ? void 0 : metrics.BusFactor) === null || _a === void 0 ? void 0 : _a.toFixed(2)) !== null && _b !== void 0 ? _b : '-1')).toBe(0.05);
                    return [2 /*return*/];
            }
        });
    }); });
    test('github/jspec, correctness', function () { return __awaiter(void 0, void 0, void 0, function () {
        var token, inputURL, repoDetails, owner, repo, repoURL, repoData, metrics;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    token = process.env.GITHUB_TOKEN || "";
                    inputURL = "https://github.com/wycats/jspec";
                    return [4 /*yield*/, (0, urlHandler_1.getRepoDetails)(token, inputURL)];
                case 1:
                    repoDetails = _c.sent();
                    owner = repoDetails[0], repo = repoDetails[1], repoURL = repoDetails[2];
                    return [4 /*yield*/, (0, githubApi_1.fetchRepoData)(owner, repo, token)];
                case 2:
                    repoData = _c.sent();
                    return [4 /*yield*/, (0, metric_1.calculateMetrics)(owner, repo, token, repoURL, repoData, inputURL)];
                case 3:
                    metrics = _c.sent();
                    expect(parseFloat((_b = (_a = metrics === null || metrics === void 0 ? void 0 : metrics.Correctness) === null || _a === void 0 ? void 0 : _a.toFixed(2)) !== null && _b !== void 0 ? _b : '-1')).toBe(0.00); // TODO: CHECK THIS
                    return [2 /*return*/];
            }
        });
    }); });
    test('github/jspec, ramp up', function () { return __awaiter(void 0, void 0, void 0, function () {
        var token, inputURL, repoDetails, owner, repo, repoURL, repoData, metrics;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    token = process.env.GITHUB_TOKEN || "";
                    inputURL = "https://github.com/wycats/jspec";
                    return [4 /*yield*/, (0, urlHandler_1.getRepoDetails)(token, inputURL)];
                case 1:
                    repoDetails = _c.sent();
                    owner = repoDetails[0], repo = repoDetails[1], repoURL = repoDetails[2];
                    return [4 /*yield*/, (0, githubApi_1.fetchRepoData)(owner, repo, token)];
                case 2:
                    repoData = _c.sent();
                    return [4 /*yield*/, (0, metric_1.calculateMetrics)(owner, repo, token, repoURL, repoData, inputURL)];
                case 3:
                    metrics = _c.sent();
                    expect(parseFloat((_b = (_a = metrics === null || metrics === void 0 ? void 0 : metrics.RampUp) === null || _a === void 0 ? void 0 : _a.toFixed(2)) !== null && _b !== void 0 ? _b : '-1')).toBe(0.90);
                    return [2 /*return*/];
            }
        });
    }); });
    test('github/jspec, responsiveness', function () { return __awaiter(void 0, void 0, void 0, function () {
        var token, inputURL, repoDetails, owner, repo, repoURL, repoData, metrics;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    token = process.env.GITHUB_TOKEN || "";
                    inputURL = "https://github.com/wycats/jspec";
                    return [4 /*yield*/, (0, urlHandler_1.getRepoDetails)(token, inputURL)];
                case 1:
                    repoDetails = _c.sent();
                    owner = repoDetails[0], repo = repoDetails[1], repoURL = repoDetails[2];
                    return [4 /*yield*/, (0, githubApi_1.fetchRepoData)(owner, repo, token)];
                case 2:
                    repoData = _c.sent();
                    return [4 /*yield*/, (0, metric_1.calculateMetrics)(owner, repo, token, repoURL, repoData, inputURL)];
                case 3:
                    metrics = _c.sent();
                    expect(parseFloat((_b = (_a = metrics === null || metrics === void 0 ? void 0 : metrics.ResponsiveMaintainer) === null || _a === void 0 ? void 0 : _a.toFixed(2)) !== null && _b !== void 0 ? _b : '-1')).toBe(0.00);
                    return [2 /*return*/];
            }
        });
    }); });
    test('github/jspec, license', function () { return __awaiter(void 0, void 0, void 0, function () {
        var token, inputURL, repoDetails, owner, repo, repoURL, repoData, metrics;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    token = process.env.GITHUB_TOKEN || "";
                    inputURL = "https://github.com/wycats/jspec";
                    return [4 /*yield*/, (0, urlHandler_1.getRepoDetails)(token, inputURL)];
                case 1:
                    repoDetails = _c.sent();
                    owner = repoDetails[0], repo = repoDetails[1], repoURL = repoDetails[2];
                    return [4 /*yield*/, (0, githubApi_1.fetchRepoData)(owner, repo, token)];
                case 2:
                    repoData = _c.sent();
                    return [4 /*yield*/, (0, metric_1.calculateMetrics)(owner, repo, token, repoURL, repoData, inputURL)];
                case 3:
                    metrics = _c.sent();
                    expect(parseFloat((_b = (_a = metrics === null || metrics === void 0 ? void 0 : metrics.License) === null || _a === void 0 ? void 0 : _a.toFixed(2)) !== null && _b !== void 0 ? _b : '-1')).toBe(1.00);
                    return [2 /*return*/];
            }
        });
    }); });
    test('github/jspec, dependency pinning', function () { return __awaiter(void 0, void 0, void 0, function () {
        var token, inputURL, repoDetails, owner, repo, repoURL, repoData, metrics;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    token = process.env.GITHUB_TOKEN || "";
                    inputURL = "https://github.com/wycats/jspec";
                    return [4 /*yield*/, (0, urlHandler_1.getRepoDetails)(token, inputURL)];
                case 1:
                    repoDetails = _c.sent();
                    owner = repoDetails[0], repo = repoDetails[1], repoURL = repoDetails[2];
                    return [4 /*yield*/, (0, githubApi_1.fetchRepoData)(owner, repo, token)];
                case 2:
                    repoData = _c.sent();
                    return [4 /*yield*/, (0, metric_1.calculateMetrics)(owner, repo, token, repoURL, repoData, inputURL)];
                case 3:
                    metrics = _c.sent();
                    expect(parseFloat((_b = (_a = metrics === null || metrics === void 0 ? void 0 : metrics.DependencyPinning) === null || _a === void 0 ? void 0 : _a.toFixed(2)) !== null && _b !== void 0 ? _b : '-1')).toBe(1.00);
                    return [2 /*return*/];
            }
        });
    }); });
    test('github/jspec, code review fraction', function () { return __awaiter(void 0, void 0, void 0, function () {
        var token, inputURL, repoDetails, owner, repo, repoURL, repoData, metrics;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    token = process.env.GITHUB_TOKEN || "";
                    inputURL = "https://github.com/wycats/jspec";
                    return [4 /*yield*/, (0, urlHandler_1.getRepoDetails)(token, inputURL)];
                case 1:
                    repoDetails = _c.sent();
                    owner = repoDetails[0], repo = repoDetails[1], repoURL = repoDetails[2];
                    return [4 /*yield*/, (0, githubApi_1.fetchRepoData)(owner, repo, token)];
                case 2:
                    repoData = _c.sent();
                    return [4 /*yield*/, (0, metric_1.calculateMetrics)(owner, repo, token, repoURL, repoData, inputURL)];
                case 3:
                    metrics = _c.sent();
                    expect(parseFloat((_b = (_a = metrics === null || metrics === void 0 ? void 0 : metrics.CodeReview) === null || _a === void 0 ? void 0 : _a.toFixed(2)) !== null && _b !== void 0 ? _b : '-1')).toBe(0.25);
                    return [2 /*return*/];
            }
        });
    }); });
    // Testing "all" metrics with npm/ts-node
    test('npm/ts-node, code review fraction', function () { return __awaiter(void 0, void 0, void 0, function () {
        var token, inputURL, repoDetails, owner, repo, repoURL, repoData, metrics;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    token = process.env.GITHUB_TOKEN || "";
                    inputURL = "https://www.npmjs.com/package/ts-node";
                    return [4 /*yield*/, (0, urlHandler_1.getRepoDetails)(token, inputURL)];
                case 1:
                    repoDetails = _c.sent();
                    owner = repoDetails[0], repo = repoDetails[1], repoURL = repoDetails[2];
                    return [4 /*yield*/, (0, githubApi_1.fetchRepoData)(owner, repo, token)];
                case 2:
                    repoData = _c.sent();
                    return [4 /*yield*/, (0, metric_1.calculateMetrics)(owner, repo, token, repoURL, repoData, inputURL)];
                case 3:
                    metrics = _c.sent();
                    expect(parseFloat((_b = (_a = metrics === null || metrics === void 0 ? void 0 : metrics.CodeReview) === null || _a === void 0 ? void 0 : _a.toFixed(2)) !== null && _b !== void 0 ? _b : '-1')).toBe(0.95);
                    return [2 /*return*/];
            }
        });
    }); });
    // Testing log file functions
    test('logging messages to log file', function () { return __awaiter(void 0, void 0, void 0, function () {
        var fs, logContent;
        return __generator(this, function (_a) {
            (0, log_1.initLogFile)();
            (0, log_1.logToFile)("Informational log from test", 1);
            (0, log_1.logToFile)("Debugging log from test", 2);
            fs = require('fs');
            logContent = fs.readFileSync(process.env.LOG_FILE, 'utf8');
            // check that log file is not empty
            expect(logContent.trim()).not.toBe('');
            return [2 /*return*/];
        });
    }); });
    test('logging metrics log file with null', function () { return __awaiter(void 0, void 0, void 0, function () {
        var fs, logContent;
        return __generator(this, function (_a) {
            (0, log_1.initLogFile)();
            (0, log_1.metricsLogToStdout)("Metric scoring from test", 2);
            fs = require('fs');
            logContent = fs.readFileSync(process.env.LOG_FILE, 'utf8');
            // check that log file is empty
            expect(logContent.trim()).toBe('');
            return [2 /*return*/];
        });
    }); });
    test('logging metrics log file with object', function () { return __awaiter(void 0, void 0, void 0, function () {
        var token, inputURL, repoDetails, owner, repo, repoURL, repoData, metrics, fs, logContent;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    (0, log_1.initLogFile)();
                    token = process.env.GITHUB_TOKEN || "";
                    inputURL = "https://github.com/wycats/jspec";
                    return [4 /*yield*/, (0, urlHandler_1.getRepoDetails)(token, inputURL)];
                case 1:
                    repoDetails = _a.sent();
                    owner = repoDetails[0], repo = repoDetails[1], repoURL = repoDetails[2];
                    return [4 /*yield*/, (0, githubApi_1.fetchRepoData)(owner, repo, token)];
                case 2:
                    repoData = _a.sent();
                    return [4 /*yield*/, (0, metric_1.calculateMetrics)(owner, repo, token, repoURL, repoData, inputURL)];
                case 3:
                    metrics = _a.sent();
                    (0, log_1.metricsLogToStdout)(metrics, 2);
                    fs = require('fs');
                    logContent = fs.readFileSync(process.env.LOG_FILE, 'utf8');
                    // check that log file is not empty
                    expect(logContent.trim()).not.toBe('');
                    return [2 /*return*/];
            }
        });
    }); });
    // Testing all metric score functions
    test('calcBusFactorScore', function () { return __awaiter(void 0, void 0, void 0, function () {
        var token, inputURL, repoDetails, owner, repo, repoURL, repoData, busFactor, contributorActivity;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    token = process.env.GITHUB_TOKEN || "";
                    inputURL = "https://github.com/defunkt/zippy";
                    return [4 /*yield*/, (0, urlHandler_1.getRepoDetails)(token, inputURL)];
                case 1:
                    repoDetails = _b.sent();
                    owner = repoDetails[0], repo = repoDetails[1], repoURL = repoDetails[2];
                    return [4 /*yield*/, (0, githubApi_1.fetchRepoData)(owner, repo, token)];
                case 2:
                    repoData = _b.sent();
                    return [4 /*yield*/, (0, githubApi_1.fetchContributorActivity)(owner, repo, token)];
                case 3:
                    contributorActivity = _b.sent();
                    if (!(contributorActivity === null || contributorActivity === void 0 ? void 0 : contributorActivity.data) || !Array.isArray(contributorActivity.data)) {
                        busFactor = -1;
                    }
                    else {
                        busFactor = (0, busFactor_1.calcBusFactorScore)(contributorActivity.data);
                    }
                    expect(parseFloat((_a = (busFactor).toFixed(2)) !== null && _a !== void 0 ? _a : '-1')).toBe(0.05);
                    return [2 /*return*/];
            }
        });
    }); });
    test('calcCorrectnessScore', function () { return __awaiter(void 0, void 0, void 0, function () {
        var token, inputURL, repoDetails, owner, repo, repoURL, repoData, totalOpenIssues, totalClosedIssues, correctness;
        var _a, _b, _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    token = process.env.GITHUB_TOKEN || "";
                    inputURL = "https://github.com/defunkt/zippy";
                    return [4 /*yield*/, (0, urlHandler_1.getRepoDetails)(token, inputURL)];
                case 1:
                    repoDetails = _d.sent();
                    owner = repoDetails[0], repo = repoDetails[1], repoURL = repoDetails[2];
                    return [4 /*yield*/, (0, githubApi_1.fetchRepoData)(owner, repo, token)];
                case 2:
                    repoData = _d.sent();
                    totalOpenIssues = (_a = repoData.data) === null || _a === void 0 ? void 0 : _a.data.repository.openIssues;
                    totalClosedIssues = (_b = repoData.data) === null || _b === void 0 ? void 0 : _b.data.repository.closedIssues;
                    if (!totalOpenIssues || !totalClosedIssues) {
                        return [2 /*return*/, -1];
                    }
                    correctness = (0, correctness_1.calcCorrectnessScore)(totalOpenIssues.totalCount, totalClosedIssues.totalCount);
                    expect(parseFloat((_c = (correctness).toFixed(2)) !== null && _c !== void 0 ? _c : '-1')).toBe(1.00);
                    return [2 /*return*/];
            }
        });
    }); });
    test('calcResponsivenessScore', function () { return __awaiter(void 0, void 0, void 0, function () {
        var token, inputURL, repoDetails, owner, repo, repoURL, repoData, recentPullRequests, isArchived, totalOpenIssues, totalClosedIssues, oneMonthAgo, responsiveness;
        var _a, _b, _c, _d, _e;
        return __generator(this, function (_f) {
            switch (_f.label) {
                case 0:
                    token = process.env.GITHUB_TOKEN || "";
                    inputURL = "https://github.com/defunkt/zippy";
                    return [4 /*yield*/, (0, urlHandler_1.getRepoDetails)(token, inputURL)];
                case 1:
                    repoDetails = _f.sent();
                    owner = repoDetails[0], repo = repoDetails[1], repoURL = repoDetails[2];
                    return [4 /*yield*/, (0, githubApi_1.fetchRepoData)(owner, repo, token)];
                case 2:
                    repoData = _f.sent();
                    recentPullRequests = (_a = repoData.data) === null || _a === void 0 ? void 0 : _a.data.repository.pullRequests;
                    isArchived = (_b = repoData.data) === null || _b === void 0 ? void 0 : _b.data.repository.isArchived;
                    totalOpenIssues = (_c = repoData.data) === null || _c === void 0 ? void 0 : _c.data.repository.openIssues;
                    totalClosedIssues = (_d = repoData.data) === null || _d === void 0 ? void 0 : _d.data.repository.closedIssues;
                    oneMonthAgo = new Date();
                    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
                    if (!(recentPullRequests === null || recentPullRequests === void 0 ? void 0 : recentPullRequests.nodes) || !(totalClosedIssues === null || totalClosedIssues === void 0 ? void 0 : totalClosedIssues.nodes) || !(totalOpenIssues === null || totalOpenIssues === void 0 ? void 0 : totalOpenIssues.nodes)) {
                        return [2 /*return*/, -1];
                    }
                    responsiveness = (0, responsiveMaintainer_1.calcResponsivenessScore)(totalClosedIssues.nodes, totalOpenIssues.nodes, recentPullRequests.nodes, oneMonthAgo, isArchived !== null && isArchived !== void 0 ? isArchived : false);
                    expect(parseFloat((_e = (responsiveness).toFixed(2)) !== null && _e !== void 0 ? _e : '-1')).toBe(0.00);
                    return [2 /*return*/];
            }
        });
    }); });
    test('calcLicenseScore', function () { return __awaiter(void 0, void 0, void 0, function () {
        var token, inputURL, repoDetails, owner, repo, repoURL, repoData, localDir, license;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    token = process.env.GITHUB_TOKEN || "";
                    inputURL = "https://github.com/defunkt/zippy";
                    return [4 /*yield*/, (0, urlHandler_1.getRepoDetails)(token, inputURL)];
                case 1:
                    repoDetails = _b.sent();
                    owner = repoDetails[0], repo = repoDetails[1], repoURL = repoDetails[2];
                    return [4 /*yield*/, (0, githubApi_1.fetchRepoData)(owner, repo, token)];
                case 2:
                    repoData = _b.sent();
                    localDir = path.join("./repos", "".concat(owner, "_").concat(repo));
                    return [4 /*yield*/, (0, license_1.calcLicenseScore)(repoURL, localDir)];
                case 3:
                    license = _b.sent();
                    expect(parseFloat((_a = (license).toFixed(2)) !== null && _a !== void 0 ? _a : '-1')).toBe(0.00);
                    return [2 /*return*/];
            }
        });
    }); });
    test('calcDependencyPinningScore', function () { return __awaiter(void 0, void 0, void 0, function () {
        var noDependencies, result, allPinned, mixed, nonePinned;
        var _a, _b, _c, _d;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    noDependencies = {
                        data: {
                            dependencies: {},
                            devDependencies: {},
                            peerDependencies: {}
                        }
                    };
                    return [4 /*yield*/, (0, dependencyPinning_1.calcDependencyPinningScore)(noDependencies)];
                case 1:
                    result = _e.sent();
                    expect(parseFloat((_a = (result).toFixed(2)) !== null && _a !== void 0 ? _a : '-1')).toBe(1.00);
                    allPinned = {
                        data: {
                            dependencies: {
                                "react": "17.0.2",
                                "lodash": "4.17.21"
                            }
                        }
                    };
                    return [4 /*yield*/, (0, dependencyPinning_1.calcDependencyPinningScore)(allPinned)];
                case 2:
                    result = _e.sent();
                    expect(parseFloat((_b = (result).toFixed(2)) !== null && _b !== void 0 ? _b : '-1')).toBe(1.00);
                    mixed = {
                        data: {
                            dependencies: {
                                "react": "hi",
                                "lodash": "4.17.21"
                            }
                        }
                    };
                    return [4 /*yield*/, (0, dependencyPinning_1.calcDependencyPinningScore)(mixed)];
                case 3:
                    result = _e.sent();
                    expect(parseFloat((_c = (result).toFixed(2)) !== null && _c !== void 0 ? _c : '-1')).toBe(0.50);
                    nonePinned = {
                        data: {
                            dependencies: {
                                "react": "none",
                                "lodash": "hi"
                            }
                        }
                    };
                    return [4 /*yield*/, (0, dependencyPinning_1.calcDependencyPinningScore)(nonePinned)];
                case 4:
                    result = _e.sent();
                    expect(parseFloat((_d = (result).toFixed(2)) !== null && _d !== void 0 ? _d : '-1')).toBe(0.00);
                    return [2 /*return*/];
            }
        });
    }); });
    test('calcDependencyPinningScore w/ other dependencies', function () { return __awaiter(void 0, void 0, void 0, function () {
        var allPinned, result;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    allPinned = {
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
                    return [4 /*yield*/, (0, dependencyPinning_1.calcDependencyPinningScore)(allPinned)];
                case 1:
                    result = _b.sent();
                    expect(parseFloat((_a = (result).toFixed(2)) !== null && _a !== void 0 ? _a : '-1')).toBe(1.00);
                    return [2 /*return*/];
            }
        });
    }); });
    test('calcCodeReviewScore', function () { return __awaiter(void 0, void 0, void 0, function () {
        var token, inputURL, repoDetails, owner, repo, repoURL, repoData, codeReview, codeReviewActivity;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    token = process.env.GITHUB_TOKEN || "";
                    inputURL = "https://github.com/defunkt/zippy";
                    return [4 /*yield*/, (0, urlHandler_1.getRepoDetails)(token, inputURL)];
                case 1:
                    repoDetails = _b.sent();
                    owner = repoDetails[0], repo = repoDetails[1], repoURL = repoDetails[2];
                    return [4 /*yield*/, (0, githubApi_1.fetchRepoData)(owner, repo, token)];
                case 2:
                    repoData = _b.sent();
                    return [4 /*yield*/, (0, githubApi_1.fetchCodeReviewActivity)(owner, repo, token)];
                case 3:
                    codeReviewActivity = _b.sent();
                    if (!codeReviewActivity.linesIntroduced || !codeReviewActivity.totalLines) {
                        return [2 /*return*/, 0];
                    }
                    // get score
                    codeReview = (0, codeReview_1.calcCodeReviewScore)(codeReviewActivity.linesIntroduced, codeReviewActivity.totalLines);
                    expect(parseFloat((_a = (codeReview).toFixed(2)) !== null && _a !== void 0 ? _a : '-1')).toBe(0.00);
                    return [2 /*return*/];
            }
        });
    }); });
    // Testing all metric functions
    test('calcBusFactor', function () { return __awaiter(void 0, void 0, void 0, function () {
        var token, inputURL, repoDetails, owner, repo, repoURL, repoData, busFactor;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    token = process.env.GITHUB_TOKEN || "";
                    inputURL = "https://github.com/defunkt/zippy";
                    return [4 /*yield*/, (0, urlHandler_1.getRepoDetails)(token, inputURL)];
                case 1:
                    repoDetails = _b.sent();
                    owner = repoDetails[0], repo = repoDetails[1], repoURL = repoDetails[2];
                    return [4 /*yield*/, (0, githubApi_1.fetchRepoData)(owner, repo, token)];
                case 2:
                    repoData = _b.sent();
                    return [4 /*yield*/, (0, busFactor_1.calcBusFactor)(owner, repo, token)];
                case 3:
                    busFactor = _b.sent();
                    expect(parseFloat((_a = (busFactor).toFixed(2)) !== null && _a !== void 0 ? _a : '-1')).toBe(0.05);
                    return [2 /*return*/];
            }
        });
    }); });
    test('calcCorrectness', function () { return __awaiter(void 0, void 0, void 0, function () {
        var token, inputURL, repoDetails, owner, repo, repoURL, repoData, correctness;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    token = process.env.GITHUB_TOKEN || "";
                    inputURL = "https://github.com/defunkt/zippy";
                    return [4 /*yield*/, (0, urlHandler_1.getRepoDetails)(token, inputURL)];
                case 1:
                    repoDetails = _b.sent();
                    owner = repoDetails[0], repo = repoDetails[1], repoURL = repoDetails[2];
                    return [4 /*yield*/, (0, githubApi_1.fetchRepoData)(owner, repo, token)];
                case 2:
                    repoData = _b.sent();
                    correctness = (0, correctness_1.calcCorrectness)(repoData);
                    expect(parseFloat((_a = (correctness).toFixed(2)) !== null && _a !== void 0 ? _a : '-1')).toBe(1.00);
                    return [2 /*return*/];
            }
        });
    }); });
    test('calcResponsiveness', function () { return __awaiter(void 0, void 0, void 0, function () {
        var token, inputURL, repoDetails, owner, repo, repoURL, repoData, responsiveness;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    token = process.env.GITHUB_TOKEN || "";
                    inputURL = "https://github.com/defunkt/zippy";
                    return [4 /*yield*/, (0, urlHandler_1.getRepoDetails)(token, inputURL)];
                case 1:
                    repoDetails = _b.sent();
                    owner = repoDetails[0], repo = repoDetails[1], repoURL = repoDetails[2];
                    return [4 /*yield*/, (0, githubApi_1.fetchRepoData)(owner, repo, token)];
                case 2:
                    repoData = _b.sent();
                    responsiveness = (0, responsiveMaintainer_1.calcResponsiveness)(repoData);
                    expect(parseFloat((_a = (responsiveness).toFixed(2)) !== null && _a !== void 0 ? _a : '-1')).toBe(0.00);
                    return [2 /*return*/];
            }
        });
    }); });
    test('calcLicense', function () { return __awaiter(void 0, void 0, void 0, function () {
        var token, inputURL, repoDetails, owner, repo, repoURL, repoData, license;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    token = process.env.GITHUB_TOKEN || "";
                    inputURL = "https://github.com/defunkt/zippy";
                    return [4 /*yield*/, (0, urlHandler_1.getRepoDetails)(token, inputURL)];
                case 1:
                    repoDetails = _b.sent();
                    owner = repoDetails[0], repo = repoDetails[1], repoURL = repoDetails[2];
                    return [4 /*yield*/, (0, githubApi_1.fetchRepoData)(owner, repo, token)];
                case 2:
                    repoData = _b.sent();
                    return [4 /*yield*/, (0, license_1.calcLicense)(owner, repo, repoURL)];
                case 3:
                    license = _b.sent();
                    expect(parseFloat((_a = (license).toFixed(2)) !== null && _a !== void 0 ? _a : '-1')).toBe(0.00);
                    return [2 /*return*/];
            }
        });
    }); });
    test('calcRampUp', function () { return __awaiter(void 0, void 0, void 0, function () {
        var token, inputURL, repoDetails, owner, repo, repoURL, repoData, rampUp;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    token = process.env.GITHUB_TOKEN || "";
                    inputURL = "https://github.com/defunkt/zippy";
                    return [4 /*yield*/, (0, urlHandler_1.getRepoDetails)(token, inputURL)];
                case 1:
                    repoDetails = _b.sent();
                    owner = repoDetails[0], repo = repoDetails[1], repoURL = repoDetails[2];
                    return [4 /*yield*/, (0, githubApi_1.fetchRepoData)(owner, repo, token)];
                case 2:
                    repoData = _b.sent();
                    return [4 /*yield*/, (0, rampUp_1.calcRampUp)(repoData)];
                case 3:
                    rampUp = _b.sent();
                    expect(parseFloat((_a = (rampUp).toFixed(2)) !== null && _a !== void 0 ? _a : '-1')).toBe(0.80);
                    return [2 /*return*/];
            }
        });
    }); });
    test('calcDependencyPinning', function () { return __awaiter(void 0, void 0, void 0, function () {
        var token, inputURL, repoDetails, owner, repo, repoURL, dependencyPinning;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    token = process.env.GITHUB_TOKEN || "";
                    inputURL = "https://github.com/defunkt/zippy";
                    return [4 /*yield*/, (0, urlHandler_1.getRepoDetails)(token, inputURL)];
                case 1:
                    repoDetails = _b.sent();
                    owner = repoDetails[0], repo = repoDetails[1], repoURL = repoDetails[2];
                    return [4 /*yield*/, (0, dependencyPinning_1.calcDependencyPinning)(owner, repo, token)];
                case 2:
                    dependencyPinning = _b.sent();
                    expect(parseFloat((_a = (dependencyPinning).toFixed(2)) !== null && _a !== void 0 ? _a : '-1')).toBe(1.00);
                    return [2 /*return*/];
            }
        });
    }); });
    test('calcCodeReview', function () { return __awaiter(void 0, void 0, void 0, function () {
        var token, inputURL, repoDetails, owner, repo, repoURL, repoData, codeReview;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    token = process.env.GITHUB_TOKEN || "";
                    inputURL = "https://github.com/defunkt/zippy";
                    return [4 /*yield*/, (0, urlHandler_1.getRepoDetails)(token, inputURL)];
                case 1:
                    repoDetails = _b.sent();
                    owner = repoDetails[0], repo = repoDetails[1], repoURL = repoDetails[2];
                    return [4 /*yield*/, (0, githubApi_1.fetchRepoData)(owner, repo, token)];
                case 2:
                    repoData = _b.sent();
                    return [4 /*yield*/, (0, codeReview_1.calcCodeReview)(owner, repo, repoURL)];
                case 3:
                    codeReview = _b.sent();
                    expect(parseFloat((_a = (codeReview).toFixed(2)) !== null && _a !== void 0 ? _a : '-1')).toBe(0.00);
                    return [2 /*return*/];
            }
        });
    }); });
    // Testing workers
    test('workers', function () { return __awaiter(void 0, void 0, void 0, function () {
        var token, inputURL, repoDetails, owner, repo, repoURL, repoData, busFactorWorker, correctnessWorker, rampUpWorker, responsivenessWorker, licenseWorker, dependencyPinningWorker, results;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    token = process.env.GITHUB_TOKEN || "";
                    inputURL = "https://github.com/defunkt/zippy";
                    return [4 /*yield*/, (0, urlHandler_1.getRepoDetails)(token, inputURL)];
                case 1:
                    repoDetails = _b.sent();
                    owner = repoDetails[0], repo = repoDetails[1], repoURL = repoDetails[2];
                    return [4 /*yield*/, (0, githubApi_1.fetchRepoData)(owner, repo, token)];
                case 2:
                    repoData = _b.sent();
                    busFactorWorker = (0, worker_1.calculateMetric)({ owner: owner, repo: repo, token: token, repoURL: repoURL, repoData: repoData, metric: "busFactor" });
                    correctnessWorker = (0, worker_1.calculateMetric)({ owner: owner, repo: repo, token: token, repoURL: repoURL, repoData: repoData, metric: "correctness" });
                    rampUpWorker = (0, worker_1.calculateMetric)({ owner: owner, repo: repo, token: token, repoURL: repoURL, repoData: repoData, metric: "rampUp" });
                    responsivenessWorker = (0, worker_1.calculateMetric)({ owner: owner, repo: repo, token: token, repoURL: repoURL, repoData: repoData, metric: "responsiveness" });
                    licenseWorker = (0, worker_1.calculateMetric)({ owner: owner, repo: repo, token: token, repoURL: repoURL, repoData: repoData, metric: "license" });
                    dependencyPinningWorker = (0, worker_1.calculateMetric)({ owner: owner, repo: repo, token: token, repoURL: repoURL, repoData: repoData, metric: "dependencyPinning" });
                    return [4 /*yield*/, Promise.all([
                            busFactorWorker,
                            correctnessWorker,
                            rampUpWorker,
                            responsivenessWorker,
                            licenseWorker,
                            dependencyPinningWorker
                        ])];
                case 3:
                    results = _b.sent();
                    expect(parseFloat((_a = results[0].score.toFixed(2)) !== null && _a !== void 0 ? _a : '-1')).toBe(0.05);
                    return [2 /*return*/];
            }
        });
    }); });
    // Testing GitHub API requests
    test('apiGetRequest', function () { return __awaiter(void 0, void 0, void 0, function () {
        var GITHUB_BASE_URL, token, inputURL, repoDetails, owner, repo, repoURL, repoData, url, response;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    GITHUB_BASE_URL = "https://api.github.com";
                    token = process.env.GITHUB_TOKEN || "";
                    inputURL = "https://github.com/defunkt/zippy";
                    return [4 /*yield*/, (0, urlHandler_1.getRepoDetails)(token, inputURL)];
                case 1:
                    repoDetails = _a.sent();
                    owner = repoDetails[0], repo = repoDetails[1], repoURL = repoDetails[2];
                    return [4 /*yield*/, (0, githubApi_1.fetchRepoData)(owner, repo, token)];
                case 2:
                    repoData = _a.sent();
                    url = "".concat(GITHUB_BASE_URL, "/repos/").concat(owner, "/").concat(repo, "/stats/contributors");
                    return [4 /*yield*/, (0, apiUtils_1.apiGetRequest)(url, token)];
                case 3:
                    response = _a.sent();
                    expect(response).not.toBe(null);
                    return [2 /*return*/];
            }
        });
    }); });
    test('apiPostRequest', function () { return __awaiter(void 0, void 0, void 0, function () {
        var GITHUB_BASE_URL, token, inputURL, repoDetails, owner, repo, repoURL, repoData, url, query, body, response;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    GITHUB_BASE_URL = "https://api.github.com";
                    token = process.env.GITHUB_TOKEN || "";
                    inputURL = "https://github.com/defunkt/zippy";
                    return [4 /*yield*/, (0, urlHandler_1.getRepoDetails)(token, inputURL)];
                case 1:
                    repoDetails = _a.sent();
                    owner = repoDetails[0], repo = repoDetails[1], repoURL = repoDetails[2];
                    return [4 /*yield*/, (0, githubApi_1.fetchRepoData)(owner, repo, token)];
                case 2:
                    repoData = _a.sent();
                    url = "".concat(GITHUB_BASE_URL, "/graphql");
                    query = (0, graphqlQueries_1.getRepoDataQuery)(owner, repo);
                    body = JSON.stringify({ query: query });
                    return [4 /*yield*/, (0, apiUtils_1.apiPostRequest)(url, body, token)];
                case 3:
                    response = _a.sent();
                    expect(response).not.toBe(null);
                    return [2 /*return*/];
            }
        });
    }); });
    // Testing writing to file
    test('writeFile', function () { return __awaiter(void 0, void 0, void 0, function () {
        var fs, logContent;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, utils_1.writeFile)("testing writeFile from test suite", process.env.LOG_FILE)];
                case 1:
                    _a.sent();
                    fs = require('fs');
                    logContent = fs.readFileSync(process.env.LOG_FILE, 'utf8');
                    // check that log file is not empty
                    expect(logContent.trim()).not.toBe('');
                    return [2 /*return*/];
            }
        });
    }); });
    // Testing helper functions for license metric
    test('hasLicenseHeading', function () { return __awaiter(void 0, void 0, void 0, function () {
        var match;
        return __generator(this, function (_a) {
            match = (0, utils_1.hasLicenseHeading)("this should not match anything");
            expect(match).toBe(false);
            return [2 /*return*/];
        });
    }); });
    // Testing helper functions for dependency pinning metric
    test('isVersionPinned', function () {
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
    test('extractDomainFromUrl, extractNpmPackageName, fetchGithubUrlFromNpm, extractGithubOwnerAndRepo', function () { return __awaiter(void 0, void 0, void 0, function () {
        var token, inputURL, hostname, repoURL, npmPackageName, npmResponse, repoDetails;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    token = process.env.GITHUB_TOKEN || "";
                    inputURL = "https://github.com/wycats/jspec";
                    hostname = (0, urlHandler_1.extractDomainFromUrl)(inputURL);
                    repoURL = "";
                    if (!(hostname === "www.npmjs.com")) return [3 /*break*/, 2];
                    npmPackageName = (0, urlHandler_1.extractNpmPackageName)(inputURL);
                    return [4 /*yield*/, (0, npmApi_1.fetchGithubUrlFromNpm)(npmPackageName)];
                case 1:
                    npmResponse = _a.sent();
                    repoURL = npmResponse.data;
                    return [3 /*break*/, 3];
                case 2:
                    // URL must be github, so use it directly
                    repoURL = inputURL;
                    _a.label = 3;
                case 3:
                    repoDetails = (0, urlHandler_1.extractGithubOwnerAndRepo)(repoURL);
                    expect(repoDetails).not.toBe(null);
                    return [2 /*return*/];
            }
        });
    }); });
    // Testing existence of folder (I THINK THIS IS NEVER CALLED FROM ANYWHERE)
    test('checkFolderExists', function () { return __awaiter(void 0, void 0, void 0, function () {
        var token, inputURL, repoDetails, owner, repo, repoURL, repoData, exists;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    token = process.env.GITHUB_TOKEN || "";
                    inputURL = "https://github.com/wycats/jspec";
                    return [4 /*yield*/, (0, urlHandler_1.getRepoDetails)(token, inputURL)];
                case 1:
                    repoDetails = _a.sent();
                    owner = repoDetails[0], repo = repoDetails[1], repoURL = repoDetails[2];
                    return [4 /*yield*/, (0, githubApi_1.fetchRepoData)(owner, repo, token)];
                case 2:
                    repoData = _a.sent();
                    return [4 /*yield*/, (0, githubApi_1.checkFolderExists)(owner, repo, token)];
                case 3:
                    exists = _a.sent();
                    expect(exists).toBe(false);
                    return [2 /*return*/];
            }
        });
    }); });
});
