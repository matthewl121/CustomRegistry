"use strict";
/**
* githubApi.ts
* Functions for interacting with GitHub's REST and GraphQL APIs to fetch repository data
*/
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
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
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
exports.__esModule = true;
exports.getReadmeDetails = exports.checkFolderExists = exports.fetchRepoData = exports.fetchContributorActivity = exports.fetchCodeReviewActivity = exports.fetchPackageJson = void 0;
var apiUtils_1 = require("./apiUtils");
var graphqlQueries_1 = require("./graphqlQueries");
var log_1 = require("../utils/log");
var path = require("path");
var fs = require("fs");
var pLimit = require("p-limit");
// Base URL for GitHub API requests
var GITHUB_BASE_URL = "https://api.github.com";
var LOCAL_REPO_PATH = path.join(__dirname, '../../repos');
// Fetches package.json content from repository
var fetchPackageJson = function (owner, repo, token) { return __awaiter(void 0, void 0, void 0, function () {
    var url, response, content;
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                url = "https://api.github.com/repos/".concat(owner, "/").concat(repo, "/contents/package.json");
                return [4 /*yield*/, (0, apiUtils_1.apiGetRequest)(url, token)];
            case 1:
                response = _b.sent();
                if (response.error || !((_a = response.data) === null || _a === void 0 ? void 0 : _a.content)) {
                    return [2 /*return*/, { data: null, error: 'githubApi.ts: Failed to fetch package.json' }];
                }
                try {
                    content = Buffer.from(response.data.content, 'base64').toString();
                    return [2 /*return*/, { data: JSON.parse(content), error: null }];
                }
                catch (error) {
                    (0, log_1.logToFile)("Error parsing package.json: ".concat(error), 1);
                    return [2 /*return*/, { data: null, error: 'githubApi.ts: Error parsing package.json' }];
                }
                return [2 /*return*/];
        }
    });
}); };
exports.fetchPackageJson = fetchPackageJson;
// Recursively counts lines of code in repository
var countLinesInRepo = function (dir) {
    var totalLines = 0;
    var files = fs.readdirSync(dir);
    files.forEach(function (file) {
        var filePath = path.join(dir, file);
        var stat = fs.statSync(filePath);
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
var fetchPrAdditions = function (prNumber, owner, repo, token) { return __awaiter(void 0, void 0, void 0, function () {
    var url, response;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                url = "".concat(GITHUB_BASE_URL, "/repos/").concat(owner, "/").concat(repo, "/pulls/").concat(prNumber);
                return [4 /*yield*/, (0, apiUtils_1.apiGetRequest)(url, token)];
            case 1:
                response = _a.sent();
                if (response.error || !response.data) {
                    (0, log_1.logToFile)("Error fetching PR #".concat(prNumber, ": ").concat(response.error), 1);
                    return [2 /*return*/, 0];
                }
                return [2 /*return*/, response.data.additions];
        }
    });
}); };
// Analyzes code review activity by comparing PR additions to total lines
var fetchCodeReviewActivity = function (owner, repo, token) { return __awaiter(void 0, void 0, void 0, function () {
    var url, response, pullRequests, limit, additions, linesIntroduced, repoPath, totalLines;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                url = "".concat(GITHUB_BASE_URL, "/repos/").concat(owner, "/").concat(repo, "/pulls?state=all&per_page=100");
                return [4 /*yield*/, (0, apiUtils_1.apiGetRequest)(url, token)];
            case 1:
                response = _a.sent();
                if (response.error) {
                    (0, log_1.logToFile)("Error fetching pull requests: ".concat(response.error), 1);
                    return [2 /*return*/, { linesIntroduced: 0, totalLines: 0, error: response.error }];
                }
                pullRequests = response.data || [];
                limit = pLimit(10);
                return [4 /*yield*/, Promise.all(pullRequests.map(function (pr) { return limit(function () { return fetchPrAdditions(pr.number, owner, repo, token); }); }))];
            case 2:
                additions = _a.sent();
                linesIntroduced = additions.reduce(function (acc, curr) { return acc + curr; }, 0);
                repoPath = path.join(LOCAL_REPO_PATH, "".concat(owner, "_").concat(repo));
                totalLines = countLinesInRepo(repoPath);
                return [2 /*return*/, { linesIntroduced: linesIntroduced, totalLines: totalLines, error: null }];
        }
    });
}); };
exports.fetchCodeReviewActivity = fetchCodeReviewActivity;
// Fetches contributor commit activity statistics
var fetchContributorActivity = function (owner, repo, token) { return __awaiter(void 0, void 0, void 0, function () {
    var url, response;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                url = "".concat(GITHUB_BASE_URL, "/repos/").concat(owner, "/").concat(repo, "/stats/contributors");
                return [4 /*yield*/, (0, apiUtils_1.apiGetRequest)(url, token)];
            case 1:
                response = _a.sent();
                if (response.error) {
                    (0, log_1.logToFile)("Error fetching contributor commit activity: ".concat(response.error), 1);
                    return [2 /*return*/, { data: null, error: response.error }];
                }
                return [2 /*return*/, { data: response.data, error: null }];
        }
    });
}); };
exports.fetchContributorActivity = fetchContributorActivity;
// Fetches repository data using GitHub GraphQL API
var fetchRepoData = function (owner, repo, token) { return __awaiter(void 0, void 0, void 0, function () {
    var url, query, response;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                url = "".concat(GITHUB_BASE_URL, "/graphql");
                query = (0, graphqlQueries_1.getRepoDataQuery)(owner, repo);
                return [4 /*yield*/, (0, apiUtils_1.apiPostRequest)(url, JSON.stringify({ query: query }), token)];
            case 1:
                response = _a.sent();
                if (response.error || !response.data) {
                    (0, log_1.logToFile)("Error fetching repository data: ".concat(response.error), 1);
                    return [2 /*return*/, { data: null, error: response.error }];
                }
                return [2 /*return*/, { data: response.data, error: null }];
        }
    });
}); };
exports.fetchRepoData = fetchRepoData;
// Checks if examples folder exists in repository
var checkFolderExists = function (owner, repo, token) { return __awaiter(void 0, void 0, void 0, function () {
    var url, headers, response, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                url = "https://api.github.com/repos/".concat(owner, "/").concat(repo, "/contents/examples");
                headers = token ? { "Authorization": "token ".concat(token) } : {};
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                return [4 /*yield*/, fetch(url, { headers: headers })];
            case 2:
                response = _a.sent();
                return [2 /*return*/, response.status === 200];
            case 3:
                error_1 = _a.sent();
                (0, log_1.logToFile)("Request failed: ".concat(error_1), 1);
                return [2 /*return*/, false];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.checkFolderExists = checkFolderExists;
// Analyzes README.md content to determine documentation score
var getReadmeDetails = function (readMe, examplesFolder) { return __awaiter(void 0, void 0, void 0, function () {
    var lines;
    return __generator(this, function (_a) {
        try {
            lines = readMe.split('\n').length;
            if (lines > 75) {
                if (readMe.includes('documentation') && examplesFolder)
                    return [2 /*return*/, 0.1];
                if (readMe.includes('documentation'))
                    return [2 /*return*/, 0.2];
                if (examplesFolder)
                    return [2 /*return*/, 0.2];
                return [2 /*return*/, 0.5];
            }
            if (readMe.includes('documentation') && examplesFolder)
                return [2 /*return*/, 0.2];
            if (readMe.includes('documentation'))
                return [2 /*return*/, 0.3];
            if ((examplesFolder === null || examplesFolder === void 0 ? void 0 : examplesFolder.entries.length) > 15)
                return [2 /*return*/, 0.3];
            if ((examplesFolder === null || examplesFolder === void 0 ? void 0 : examplesFolder.entries.length) <= 15)
                return [2 /*return*/, 0.4];
            if (lines <= 5)
                return [2 /*return*/, 0.9];
            if (lines <= 20)
                return [2 /*return*/, 0.8];
            if (lines <= 35)
                return [2 /*return*/, 0.7];
            if (lines <= 50)
                return [2 /*return*/, 0.6];
            return [2 /*return*/, 0.5];
        }
        catch (error) {
            (0, log_1.logToFile)("".concat(error), 1);
            return [2 /*return*/, -1];
        }
        return [2 /*return*/];
    });
}); };
exports.getReadmeDetails = getReadmeDetails;
