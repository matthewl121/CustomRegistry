"use strict";
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
exports.getReadmeDetails = exports.checkFolderExists = exports.fetchRepoData = exports.fetchContributorActivity = void 0;
var apiUtils_1 = require("./apiUtils");
var graphqlQueries_1 = require("./graphqlQueries");
var GITHUB_BASE_URL = "https://api.github.com";
/*  Fetches contributor commit activity for the given repository.
    Metrics Used: Bus Factor

    Example 200 response:
    data: {
        total: number; // total number of commits by author
        weeks: []; // not needed
        author: {
            login: string; // author's github username
        },
    }
*/
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
                    console.error('Error fetching contributor commit activity', response.error);
                    return [2 /*return*/, { data: null, error: response.error }];
                }
                return [2 /*return*/, { data: response.data, error: null }];
        }
    });
}); };
exports.fetchContributorActivity = fetchContributorActivity;
var fetchRepoData = function (owner, repo, token) { return __awaiter(void 0, void 0, void 0, function () {
    var url, query, body, response;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                url = "".concat(GITHUB_BASE_URL, "/graphql");
                query = (0, graphqlQueries_1.getRepoDataQuery)(owner, repo);
                body = JSON.stringify({ query: query });
                return [4 /*yield*/, (0, apiUtils_1.apiPostRequest)(url, body, token)];
            case 1:
                response = _a.sent();
                // await writeFile(response, "response1.json")
                if (response.error || !response.data) {
                    console.error('Error fetching repository data:', response.error);
                    return [2 /*return*/, { data: null, error: response.error }];
                }
                return [2 /*return*/, { data: response.data, error: null }];
        }
    });
}); };
exports.fetchRepoData = fetchRepoData;
// /*  Fetches 100 most recent issues for the given repository filtered by state (open/closed).
//     Metrics Used: Correctness, Responsive Maintainer
//     Example 200 response:
//     data: {
//         total_count: number; // total issues matching the query state
//         items: [
//             {
//                 created_at: string; // issue creation date
//                 updated_at: string; // last update date
//                 closed_at: string | null; // issue closing date (null if open)
//             },
//         ],
//     }
// */
// export const fetchRecentIssuesByState = async (
//     owner: string, 
//     repo: string, 
//     state: string, 
//     token: string
// ): Promise<ApiResponse<IssueSearchResponse | null>> => {
//     const q = `repo:${owner}/${repo}+type:issue+state:${state}&per_page=100`;
//     const url = `${GITHUB_BASE_URL}/search/issues?q=${q}`;
//     const response = await apiGetRequest<IssueSearchResponse>(url, token);
//     if (response.error) {
//         console.error('Error fetching issues:', response.error);
//         return { data: null, error: response.error };
//     }
//     return { data: response.data, error: null };
// }
// /*  Fetches 100 most recent pull requests for the given repository, sorted by the most recently updated.
//     Metrics Used: Responsive Maintainer
//     Example 200 response:
//     data: {
//         total_count: number; // total number of pull requests
//         items: [
//             {
//                 created_at: string; // pull request creation date
//                 updated_at: string; // last update date
//                 closed_at: string | null; // pull request closing date (null if open)
//             },
//         ],
//     }
// */
// export const fetchRecentPullRequests = async (
//     owner: string, 
//     repo: string, 
//     token: string
// ): Promise<ApiResponse<IssueSearchResponse | null>> => {
//     const q = `repo:${owner}/${repo}+type:pr&sort=updated&order=desc&per_page=100`
//     const url = `${GITHUB_BASE_URL}/search/issues?q=${q}`;
//     const response = await apiGetRequest<IssueSearchResponse>(url, token);
//     if (response.error || !response.data) {
//         console.error('Error fetching recent pull requests:', response.error);
//         return { data: null, error: response.error };
//     }
//     return { data: response.data, error: null };
// };
// /*  Fetches the license information for the given repository.
//     Metrics Used: License
//     Example 200 response:
//     data: {
//         license: {
//             key: string; // license identifier (e.g., 'mit')
//             name: string; // full license name (e.g., 'MIT License')
//             spdx_id: string; // SPDX identifier (e.g., 'MIT')
//             url: string; // URL to the license text
//         },
//     }
// */
// export const fetchLicense = async (
//     owner: string, 
//     repo: string, 
//     token: string
// ): Promise<ApiResponse<LicenseResponse>> => {
//     const url = `${GITHUB_BASE_URL}/repos/${owner}/${repo}/license`;
//     const response = await apiGetRequest<LicenseResponse>(url, token);
//     await writeFile(response, "licenserep.json");
//     if (response.error) {
//         if (response.error === "Not Found") {
//             return { data: { license: null, hasLicense: false }, error: null };
//         }
//         console.error('Error fetching licenses:', response.error);
//         return { data: null, error: response.error };
//     }
//     const data = response.data ?? { license: null, hasLicense: false };
//     return { data: { ...data, hasLicense: true }, error: null };
// };
// export const fetchReadme = async (
//     owner: string,
//     repo: string,
//     token: string
// ): Promise<ApiResponse<ReadmeResponse | null>> => {
//     const url = `${GITHUB_BASE_URL}/repos/${owner}/${repo}/readme`;
//     const response = await apiGetRequest<ReadmeResponse>(url, token)
//     if (response.error || !response.data?.content) {
//         console.error('Error fetching issues:', response.error);
//         return { data: null, error: response.error };
//     }
//     return { data: response.data, error: null};
// };
// export const fetchReadMe = async (
//     owner: string, 
//     repo: string, 
//     token: string
// ): Promise<ApiResponse<IssueSearchResponse | null>> => {
//     const q = `repo:${owner}/${repo}+filename:readme`;
//     const url = `${GITHUB_BASE_URL}/search/code?q=${q}`;
//     const response = await apiGetRequest_NoOutput<IssueSearchResponse>(url, token);
//     if (response.error) {
//         console.error('Error fetching readme file:', response.error);
//         return { data: null, error: response.error };
//     }
//     return { data: response.data, error: null };
// }
var checkFolderExists = function (owner, repo, token) { return __awaiter(void 0, void 0, void 0, function () {
    var url, headers, response, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                url = "https://api.github.com/repos/".concat(owner, "/").concat(repo, "/contents/examples");
                headers = {};
                if (token) {
                    headers["Authorization"] = "token ".concat(token);
                }
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                return [4 /*yield*/, fetch(url, { headers: headers })];
            case 2:
                response = _a.sent();
                if (response.status === 200) {
                    return [2 /*return*/, true];
                }
                else if (response.status === 404) {
                    // console.log("Folder does not exist.");
                    return [2 /*return*/, false];
                }
                else {
                    // console.log(`Error: ${response.status} - ${response.statusText}`);
                    return [2 /*return*/, false];
                }
                return [3 /*break*/, 4];
            case 3:
                error_1 = _a.sent();
                console.error("Request failed:", error_1);
                return [2 /*return*/, false];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.checkFolderExists = checkFolderExists;
var getReadmeDetails = function (readMe, examplesFolder) { return __awaiter(void 0, void 0, void 0, function () {
    var linesLength;
    return __generator(this, function (_a) {
        try {
            linesLength = readMe.split('\n').length;
            if (linesLength > 75) {
                if (readMe.includes('documentation') && examplesFolder != null) {
                    return [2 /*return*/, 0.1];
                }
                else if (readMe.includes('documentation')) {
                    return [2 /*return*/, 0.2];
                }
                else if (examplesFolder != null) {
                    return [2 /*return*/, 0.2];
                }
                else {
                    return [2 /*return*/, 0.5];
                }
            }
            else if (readMe.includes('documentation') && examplesFolder != null) {
                return [2 /*return*/, 0.2];
            }
            else if (readMe.includes('documentation')) {
                return [2 /*return*/, 0.3];
            }
            else if (examplesFolder != null && examplesFolder.entries.length > 15) {
                return [2 /*return*/, 0.3];
            }
            else if (examplesFolder != null && examplesFolder.entries.length <= 15) {
                return [2 /*return*/, 0.4];
            }
            else if (linesLength <= 5) {
                return [2 /*return*/, 0.9];
            }
            else if (linesLength > 5 && linesLength <= 20) {
                return [2 /*return*/, 0.8];
            }
            else if (linesLength > 20 && linesLength <= 35) {
                return [2 /*return*/, 0.7];
            }
            else if (linesLength > 35 && linesLength <= 50) {
                return [2 /*return*/, 0.6];
            }
            else {
                return [2 /*return*/, 0.5];
            }
        }
        catch (error) {
            console.error(error);
            return [2 /*return*/, -1];
        }
        return [2 /*return*/];
    });
}); };
exports.getReadmeDetails = getReadmeDetails;
