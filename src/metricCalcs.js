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
exports.calculateMetrics = exports.calcRampUp = exports.calcLicense = exports.calcResponsiveness = exports.calcCorrectness = exports.calcBusFactor = exports.calcLicenseScore = exports.calcResponsivenessScore = exports.calcCorrectnessScore = exports.calcBusFactorScore = void 0;
var isomorphic_git_1 = require("isomorphic-git");
var fs = require("fs");
var node_1 = require("isomorphic-git/http/node");
var utils_1 = require("./utils/utils");
var githubApi_1 = require("./api/githubApi");
var index_1 = require("./index");
var path = require("path");
var log_1 = require("./utils/log");
var calcBusFactorScore = function (contributorActivity) {
    if (!contributorActivity) {
        return 0;
    }
    var totalCommits = 0;
    var totalContributors = 0;
    for (var _i = 0, contributorActivity_1 = contributorActivity; _i < contributorActivity_1.length; _i++) {
        var contributor = contributorActivity_1[_i];
        totalCommits += contributor.total;
        ++totalContributors;
    }
    var threshold = Math.ceil(totalCommits * 0.5); // 50% of commits
    var curr = 0;
    var busFactor = 0;
    // contributorActivity default sorting is least to greatest, so iterate R to L 
    for (var i = contributorActivity.length - 1; i >= 0; i--) {
        curr += contributorActivity[i].total;
        busFactor++;
        if (curr >= threshold) {
            break;
        }
    }
    var averageBusFactor = 3;
    // if bus factor is 10+, thats more than enough
    if (busFactor > 9) {
        return 1;
    }
    // scale bus factor values using sigmoid function
    return 1 - Math.exp(-(Math.pow(busFactor, 2)) / (2 * Math.pow(averageBusFactor, 2)));
};
exports.calcBusFactorScore = calcBusFactorScore;
var calcCorrectnessScore = function (totalOpenIssuesCount, totalClosedIssuesCount) {
    var totalIssues = totalOpenIssuesCount + totalClosedIssuesCount;
    if (totalIssues == 0) {
        return 1;
    }
    return totalClosedIssuesCount / totalIssues;
};
exports.calcCorrectnessScore = calcCorrectnessScore;
var calcResponsivenessScore = function (closedIssues, openIssues, pullRequests, sinceDate, isArchived) {
    if (isArchived) {
        // repo is no longer maintained
        return 0;
    }
    var openIssueCount = 0;
    var closedIssueCount = 0;
    var openPRCount = 0;
    var closedPRCount = 0;
    for (var i = 0; i < Math.max(pullRequests.length, openIssues.length, closedIssues.length); ++i) {
        if (i < pullRequests.length && new Date(pullRequests[i].createdAt) >= sinceDate && !pullRequests[i].closedAt) {
            openPRCount++;
        }
        if (i < pullRequests.length && new Date(pullRequests[i].createdAt) >= sinceDate && pullRequests[i].closedAt) {
            closedPRCount++;
        }
        if (i < openIssues.length && new Date(openIssues[i].createdAt) >= sinceDate) {
            openIssueCount++;
        }
        if (i < closedIssues.length && new Date(closedIssues[i].createdAt) >= sinceDate) {
            closedIssueCount++;
        }
    }
    var totalRecentIssues = openIssueCount + closedIssueCount;
    var totalRecentPRs = openPRCount + closedPRCount;
    var issueCloseRatio = totalRecentIssues > 0
        ? closedIssueCount / totalRecentIssues
        : 0;
    var prCloseRatio = totalRecentPRs > 0
        ? closedPRCount / totalRecentPRs
        : 0;
    return 0.5 * issueCloseRatio + 0.5 * prCloseRatio;
};
exports.calcResponsivenessScore = calcResponsivenessScore;
var calcLicenseScore = function (repoUrl, localDir) { return __awaiter(void 0, void 0, void 0, function () {
    var licenseFilePath, readmeFilePath, packageJsonPath, packageJson, readmeText;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, (0, isomorphic_git_1.clone)({
                    fs: fs,
                    http: node_1["default"],
                    dir: localDir,
                    url: repoUrl,
                    singleBranch: true,
                    depth: 1
                })];
            case 1:
                _a.sent();
                licenseFilePath = "".concat(localDir, "/LICENSE");
                readmeFilePath = "".concat(localDir, "/README.md");
                packageJsonPath = "".concat(localDir, "/package.json");
                if (fs.existsSync(licenseFilePath)) {
                    return [2 /*return*/, 1];
                }
                if (fs.existsSync(packageJsonPath)) {
                    packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
                    if (packageJson.license) {
                        return [2 /*return*/, 1];
                    }
                }
                if (fs.existsSync(readmeFilePath)) {
                    readmeText = fs.readFileSync(readmeFilePath, 'utf8');
                    return [2 /*return*/, (0, utils_1.hasLicenseHeading)(readmeText) ? 1 : 0];
                }
                return [2 /*return*/, 0];
        }
    });
}); };
exports.calcLicenseScore = calcLicenseScore;
function calcBusFactor(owner, repo, token) {
    return __awaiter(this, void 0, void 0, function () {
        var busFactor, contributorActivity;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, githubApi_1.fetchContributorActivity)(owner, repo, token)];
                case 1:
                    contributorActivity = _a.sent();
                    if (!(contributorActivity === null || contributorActivity === void 0 ? void 0 : contributorActivity.data) || !Array.isArray(contributorActivity.data)) {
                        busFactor = -1;
                    }
                    else {
                        busFactor = (0, exports.calcBusFactorScore)(contributorActivity.data);
                    }
                    return [2 /*return*/, busFactor];
            }
        });
    });
}
exports.calcBusFactor = calcBusFactor;
function calcCorrectness(repoData) {
    var _a, _b;
    var totalOpenIssues = (_a = repoData.data) === null || _a === void 0 ? void 0 : _a.data.repository.openIssues;
    var totalClosedIssues = (_b = repoData.data) === null || _b === void 0 ? void 0 : _b.data.repository.closedIssues;
    if (!totalOpenIssues || !totalClosedIssues) {
        return -1;
    }
    var correctness = (0, exports.calcCorrectnessScore)(totalOpenIssues.totalCount, totalClosedIssues.totalCount);
    return correctness;
}
exports.calcCorrectness = calcCorrectness;
function calcResponsiveness(repoData) {
    var _a, _b, _c, _d;
    var recentPullRequests = (_a = repoData.data) === null || _a === void 0 ? void 0 : _a.data.repository.pullRequests;
    var isArchived = (_b = repoData.data) === null || _b === void 0 ? void 0 : _b.data.repository.isArchived;
    var totalOpenIssues = (_c = repoData.data) === null || _c === void 0 ? void 0 : _c.data.repository.openIssues;
    var totalClosedIssues = (_d = repoData.data) === null || _d === void 0 ? void 0 : _d.data.repository.closedIssues;
    var oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    if (!(recentPullRequests === null || recentPullRequests === void 0 ? void 0 : recentPullRequests.nodes) || !(totalClosedIssues === null || totalClosedIssues === void 0 ? void 0 : totalClosedIssues.nodes) || !(totalOpenIssues === null || totalOpenIssues === void 0 ? void 0 : totalOpenIssues.nodes)) {
        return -1;
    }
    var responsiveness = (0, exports.calcResponsivenessScore)(totalClosedIssues.nodes, totalOpenIssues.nodes, recentPullRequests.nodes, oneMonthAgo, isArchived !== null && isArchived !== void 0 ? isArchived : false);
    return responsiveness;
}
exports.calcResponsiveness = calcResponsiveness;
function calcLicense(owner, repo, repoURL) {
    return __awaiter(this, void 0, void 0, function () {
        var localDir, license;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    localDir = path.join("./repos", "".concat(owner, "_").concat(repo));
                    return [4 /*yield*/, (0, exports.calcLicenseScore)(repoURL, localDir)];
                case 1:
                    license = _a.sent();
                    return [2 /*return*/, license];
            }
        });
    });
}
exports.calcLicense = calcLicense;
function calcRampUp(repoData) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10, _11, _12, _13, _14, _15, _16, _17, _18, _19, _20, _21, _22, _23, _24, _25, _26, _27, _28, _29;
    return __awaiter(this, void 0, void 0, function () {
        var READMEMD, READMENOEXT, READMETXT, READMERDOC, READMEHTML, READMEADOC, READMEMARKDOWN, READMEYAML, READMERST, READMETEXTILE, readmemd, readmenoext, readmetxt, readmerdoc, readmehtml, readmeadoc, readmemarkdown, readmeyaml, readmerst, readmetextile, readMemd, readMenoext, readMetxt, readMerdoc, readMehtml, readMeadoc, readMemarkdown, readMeyaml, readMerst, readMetextile, ReadMemd, ReadMenoext, ReadMetxt, ReadMerdoc, ReadMehtml, ReadMeadoc, ReadMemarkdown, ReadMeyaml, ReadMerst, ReadMetextile, Readmemd, Readmenoext, Readmetxt, Readmerdoc, Readmehtml, Readmeadoc, Readmemarkdown, Readmeyaml, Readmerst, Readmetextile, examplesFolder, exampleFolder, ExamplesFolder, ExampleFolder, readMe, exFolder, rampUp;
        return __generator(this, function (_30) {
            switch (_30.label) {
                case 0:
                    READMEMD = (_a = repoData.data) === null || _a === void 0 ? void 0 : _a.data.repository.READMEMD;
                    READMENOEXT = (_b = repoData.data) === null || _b === void 0 ? void 0 : _b.data.repository.READMENOEXT;
                    READMETXT = (_c = repoData.data) === null || _c === void 0 ? void 0 : _c.data.repository.READMETXT;
                    READMERDOC = (_d = repoData.data) === null || _d === void 0 ? void 0 : _d.data.repository.READMERDOC;
                    READMEHTML = (_e = repoData.data) === null || _e === void 0 ? void 0 : _e.data.repository.READMEHTML;
                    READMEADOC = (_f = repoData.data) === null || _f === void 0 ? void 0 : _f.data.repository.READMEADOC;
                    READMEMARKDOWN = (_g = repoData.data) === null || _g === void 0 ? void 0 : _g.data.repository.READMEMARKDOWN;
                    READMEYAML = (_h = repoData.data) === null || _h === void 0 ? void 0 : _h.data.repository.READMEYAML;
                    READMERST = (_j = repoData.data) === null || _j === void 0 ? void 0 : _j.data.repository.READMERST;
                    READMETEXTILE = (_k = repoData.data) === null || _k === void 0 ? void 0 : _k.data.repository.READMETEXTILE;
                    readmemd = (_l = repoData.data) === null || _l === void 0 ? void 0 : _l.data.repository.readmemd;
                    readmenoext = (_m = repoData.data) === null || _m === void 0 ? void 0 : _m.data.repository.readmenoext;
                    readmetxt = (_o = repoData.data) === null || _o === void 0 ? void 0 : _o.data.repository.readmetxt;
                    readmerdoc = (_p = repoData.data) === null || _p === void 0 ? void 0 : _p.data.repository.readmerdoc;
                    readmehtml = (_q = repoData.data) === null || _q === void 0 ? void 0 : _q.data.repository.readmehtml;
                    readmeadoc = (_r = repoData.data) === null || _r === void 0 ? void 0 : _r.data.repository.readmeadoc;
                    readmemarkdown = (_s = repoData.data) === null || _s === void 0 ? void 0 : _s.data.repository.readmemarkdown;
                    readmeyaml = (_t = repoData.data) === null || _t === void 0 ? void 0 : _t.data.repository.readmeyaml;
                    readmerst = (_u = repoData.data) === null || _u === void 0 ? void 0 : _u.data.repository.readmerst;
                    readmetextile = (_v = repoData.data) === null || _v === void 0 ? void 0 : _v.data.repository.readmetextile;
                    readMemd = (_w = repoData.data) === null || _w === void 0 ? void 0 : _w.data.repository.readMemd;
                    readMenoext = (_x = repoData.data) === null || _x === void 0 ? void 0 : _x.data.repository.readMenoext;
                    readMetxt = (_y = repoData.data) === null || _y === void 0 ? void 0 : _y.data.repository.readMetxt;
                    readMerdoc = (_z = repoData.data) === null || _z === void 0 ? void 0 : _z.data.repository.readMerdoc;
                    readMehtml = (_0 = repoData.data) === null || _0 === void 0 ? void 0 : _0.data.repository.readMehtml;
                    readMeadoc = (_1 = repoData.data) === null || _1 === void 0 ? void 0 : _1.data.repository.readMeadoc;
                    readMemarkdown = (_2 = repoData.data) === null || _2 === void 0 ? void 0 : _2.data.repository.readMemarkdown;
                    readMeyaml = (_3 = repoData.data) === null || _3 === void 0 ? void 0 : _3.data.repository.readMeyaml;
                    readMerst = (_4 = repoData.data) === null || _4 === void 0 ? void 0 : _4.data.repository.readMerst;
                    readMetextile = (_5 = repoData.data) === null || _5 === void 0 ? void 0 : _5.data.repository.readMetextile;
                    ReadMemd = (_6 = repoData.data) === null || _6 === void 0 ? void 0 : _6.data.repository.ReadMemd;
                    ReadMenoext = (_7 = repoData.data) === null || _7 === void 0 ? void 0 : _7.data.repository.ReadMenoext;
                    ReadMetxt = (_8 = repoData.data) === null || _8 === void 0 ? void 0 : _8.data.repository.ReadMetxt;
                    ReadMerdoc = (_9 = repoData.data) === null || _9 === void 0 ? void 0 : _9.data.repository.ReadMerdoc;
                    ReadMehtml = (_10 = repoData.data) === null || _10 === void 0 ? void 0 : _10.data.repository.ReadMehtml;
                    ReadMeadoc = (_11 = repoData.data) === null || _11 === void 0 ? void 0 : _11.data.repository.ReadMeadoc;
                    ReadMemarkdown = (_12 = repoData.data) === null || _12 === void 0 ? void 0 : _12.data.repository.ReadMemarkdown;
                    ReadMeyaml = (_13 = repoData.data) === null || _13 === void 0 ? void 0 : _13.data.repository.ReadMeyaml;
                    ReadMerst = (_14 = repoData.data) === null || _14 === void 0 ? void 0 : _14.data.repository.ReadMerst;
                    ReadMetextile = (_15 = repoData.data) === null || _15 === void 0 ? void 0 : _15.data.repository.ReadMetextile;
                    Readmemd = (_16 = repoData.data) === null || _16 === void 0 ? void 0 : _16.data.repository.Readmemd;
                    Readmenoext = (_17 = repoData.data) === null || _17 === void 0 ? void 0 : _17.data.repository.Readmenoext;
                    Readmetxt = (_18 = repoData.data) === null || _18 === void 0 ? void 0 : _18.data.repository.Readmetxt;
                    Readmerdoc = (_19 = repoData.data) === null || _19 === void 0 ? void 0 : _19.data.repository.Readmerdoc;
                    Readmehtml = (_20 = repoData.data) === null || _20 === void 0 ? void 0 : _20.data.repository.Readmehtml;
                    Readmeadoc = (_21 = repoData.data) === null || _21 === void 0 ? void 0 : _21.data.repository.Readmeadoc;
                    Readmemarkdown = (_22 = repoData.data) === null || _22 === void 0 ? void 0 : _22.data.repository.Readmemarkdown;
                    Readmeyaml = (_23 = repoData.data) === null || _23 === void 0 ? void 0 : _23.data.repository.Readmeyaml;
                    Readmerst = (_24 = repoData.data) === null || _24 === void 0 ? void 0 : _24.data.repository.Readmerst;
                    Readmetextile = (_25 = repoData.data) === null || _25 === void 0 ? void 0 : _25.data.repository.Readmetextile;
                    examplesFolder = (_26 = repoData.data) === null || _26 === void 0 ? void 0 : _26.data.repository.examplesFolder;
                    exampleFolder = (_27 = repoData.data) === null || _27 === void 0 ? void 0 : _27.data.repository.exampleFolder;
                    ExamplesFolder = (_28 = repoData.data) === null || _28 === void 0 ? void 0 : _28.data.repository.ExamplesFolder;
                    ExampleFolder = (_29 = repoData.data) === null || _29 === void 0 ? void 0 : _29.data.repository.ExampleFolder;
                    return [4 /*yield*/, (0, utils_1.writeFile)(repoData, "repoData.json")];
                case 1:
                    _30.sent();
                    readMe = null;
                    if (READMEMD === null || READMEMD === void 0 ? void 0 : READMEMD.text) {
                        readMe = READMEMD;
                    }
                    else if (READMENOEXT === null || READMENOEXT === void 0 ? void 0 : READMENOEXT.text) {
                        readMe = READMENOEXT;
                    }
                    else if (READMETXT === null || READMETXT === void 0 ? void 0 : READMETXT.text) {
                        readMe = READMETXT;
                    }
                    else if (READMERDOC === null || READMERDOC === void 0 ? void 0 : READMERDOC.text) {
                        readMe = READMERDOC;
                    }
                    else if (READMEHTML === null || READMEHTML === void 0 ? void 0 : READMEHTML.text) {
                        readMe = READMEHTML;
                    }
                    else if (READMEADOC === null || READMEADOC === void 0 ? void 0 : READMEADOC.text) {
                        readMe = READMEADOC;
                    }
                    else if (READMEMARKDOWN === null || READMEMARKDOWN === void 0 ? void 0 : READMEMARKDOWN.text) {
                        readMe = READMEMARKDOWN;
                    }
                    else if (READMEYAML === null || READMEYAML === void 0 ? void 0 : READMEYAML.text) {
                        readMe = READMEYAML;
                    }
                    else if (READMERST === null || READMERST === void 0 ? void 0 : READMERST.text) {
                        readMe = READMERST;
                    }
                    else if (READMETEXTILE === null || READMETEXTILE === void 0 ? void 0 : READMETEXTILE.text) {
                        readMe = READMETEXTILE;
                    }
                    else if (readmemd === null || readmemd === void 0 ? void 0 : readmemd.text) {
                        readMe = readmemd;
                    }
                    else if (readmenoext === null || readmenoext === void 0 ? void 0 : readmenoext.text) {
                        readMe = readmenoext;
                    }
                    else if (readmetxt === null || readmetxt === void 0 ? void 0 : readmetxt.text) {
                        readMe = readmetxt;
                    }
                    else if (readmerdoc === null || readmerdoc === void 0 ? void 0 : readmerdoc.text) {
                        readMe = readmerdoc;
                    }
                    else if (readmehtml === null || readmehtml === void 0 ? void 0 : readmehtml.text) {
                        readMe = readmehtml;
                    }
                    else if (readmeadoc === null || readmeadoc === void 0 ? void 0 : readmeadoc.text) {
                        readMe = readmeadoc;
                    }
                    else if (readmemarkdown === null || readmemarkdown === void 0 ? void 0 : readmemarkdown.text) {
                        readMe = readmemarkdown;
                    }
                    else if (readmeyaml === null || readmeyaml === void 0 ? void 0 : readmeyaml.text) {
                        readMe = readmeyaml;
                    }
                    else if (readmerst === null || readmerst === void 0 ? void 0 : readmerst.text) {
                        readMe = readmerst;
                    }
                    else if (readmetextile === null || readmetextile === void 0 ? void 0 : readmetextile.text) {
                        readMe = readmetextile;
                    }
                    else if (readMemd === null || readMemd === void 0 ? void 0 : readMemd.text) {
                        readMe = readMemd;
                    }
                    else if (readMenoext === null || readMenoext === void 0 ? void 0 : readMenoext.text) {
                        readMe = readMenoext;
                    }
                    else if (readMetxt === null || readMetxt === void 0 ? void 0 : readMetxt.text) {
                        readMe = readMetxt;
                    }
                    else if (readMerdoc === null || readMerdoc === void 0 ? void 0 : readMerdoc.text) {
                        readMe = readMerdoc;
                    }
                    else if (readMehtml === null || readMehtml === void 0 ? void 0 : readMehtml.text) {
                        readMe = readMehtml;
                    }
                    else if (readMeadoc === null || readMeadoc === void 0 ? void 0 : readMeadoc.text) {
                        readMe = readMeadoc;
                    }
                    else if (readMemarkdown === null || readMemarkdown === void 0 ? void 0 : readMemarkdown.text) {
                        readMe = readMemarkdown;
                    }
                    else if (readMeyaml === null || readMeyaml === void 0 ? void 0 : readMeyaml.text) {
                        readMe = readMeyaml;
                    }
                    else if (readMerst === null || readMerst === void 0 ? void 0 : readMerst.text) {
                        readMe = readMerst;
                    }
                    else if (readMetextile === null || readMetextile === void 0 ? void 0 : readMetextile.text) {
                        readMe = readMetextile;
                    }
                    else if (ReadMemd === null || ReadMemd === void 0 ? void 0 : ReadMemd.text) {
                        readMe = ReadMemd;
                    }
                    else if (ReadMenoext === null || ReadMenoext === void 0 ? void 0 : ReadMenoext.text) {
                        readMe = ReadMenoext;
                    }
                    else if (ReadMetxt === null || ReadMetxt === void 0 ? void 0 : ReadMetxt.text) {
                        readMe = ReadMetxt;
                    }
                    else if (ReadMerdoc === null || ReadMerdoc === void 0 ? void 0 : ReadMerdoc.text) {
                        readMe = ReadMerdoc;
                    }
                    else if (ReadMehtml === null || ReadMehtml === void 0 ? void 0 : ReadMehtml.text) {
                        readMe = ReadMehtml;
                    }
                    else if (ReadMeadoc === null || ReadMeadoc === void 0 ? void 0 : ReadMeadoc.text) {
                        readMe = ReadMeadoc;
                    }
                    else if (ReadMemarkdown === null || ReadMemarkdown === void 0 ? void 0 : ReadMemarkdown.text) {
                        readMe = ReadMemarkdown;
                    }
                    else if (ReadMeyaml === null || ReadMeyaml === void 0 ? void 0 : ReadMeyaml.text) {
                        readMe = ReadMeyaml;
                    }
                    else if (ReadMerst === null || ReadMerst === void 0 ? void 0 : ReadMerst.text) {
                        readMe = ReadMerst;
                    }
                    else if (ReadMetextile === null || ReadMetextile === void 0 ? void 0 : ReadMetextile.text) {
                        readMe = ReadMetextile;
                    }
                    else if (Readmemd === null || Readmemd === void 0 ? void 0 : Readmemd.text) {
                        readMe = Readmemd;
                    }
                    else if (Readmenoext === null || Readmenoext === void 0 ? void 0 : Readmenoext.text) {
                        readMe = Readmenoext;
                    }
                    else if (Readmetxt === null || Readmetxt === void 0 ? void 0 : Readmetxt.text) {
                        readMe = Readmetxt;
                    }
                    else if (Readmerdoc === null || Readmerdoc === void 0 ? void 0 : Readmerdoc.text) {
                        readMe = Readmerdoc;
                    }
                    else if (Readmehtml === null || Readmehtml === void 0 ? void 0 : Readmehtml.text) {
                        readMe = Readmehtml;
                    }
                    else if (Readmeadoc === null || Readmeadoc === void 0 ? void 0 : Readmeadoc.text) {
                        readMe = Readmeadoc;
                    }
                    else if (Readmemarkdown === null || Readmemarkdown === void 0 ? void 0 : Readmemarkdown.text) {
                        readMe = Readmemarkdown;
                    }
                    else if (Readmeyaml === null || Readmeyaml === void 0 ? void 0 : Readmeyaml.text) {
                        readMe = Readmeyaml;
                    }
                    else if (Readmerst === null || Readmerst === void 0 ? void 0 : Readmerst.text) {
                        readMe = Readmerst;
                    }
                    else if (Readmetextile === null || Readmetextile === void 0 ? void 0 : Readmetextile.text) {
                        readMe = Readmetextile;
                    }
                    exFolder = null;
                    if (examplesFolder != null) {
                        exFolder = examplesFolder;
                    }
                    else if (exampleFolder != null) {
                        exFolder = exampleFolder;
                    }
                    else if (ExamplesFolder != null) {
                        exFolder = ExamplesFolder;
                    }
                    else if (ExampleFolder != null) {
                        exFolder = ExampleFolder;
                    }
                    rampUp = null;
                    if (!!(readMe === null || readMe === void 0 ? void 0 : readMe.text)) return [3 /*break*/, 2];
                    rampUp = 0.9;
                    return [3 /*break*/, 4];
                case 2: return [4 /*yield*/, (0, githubApi_1.getReadmeDetails)(readMe.text, exFolder)];
                case 3:
                    rampUp = _30.sent();
                    _30.label = 4;
                case 4: return [2 /*return*/, rampUp];
            }
        });
    });
}
exports.calcRampUp = calcRampUp;
function calculateMetrics(owner, repo, token, repoURL, repoData, inputURL) {
    return __awaiter(this, void 0, void 0, function () {
        var busFactorWorker, correctnessWorker, rampUpWorker, responsivenessWorker, licenseWorker, results, busFactor, correctness, rampUp, responsiveness, license, busFactorLatency, correctnessLatency, rampUpLatency, responsivenessLatency, licenseLatency, begin, netScore, end, metrics;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    busFactorWorker = (0, index_1.runWorker)(owner, repo, token, repoURL, repoData, "busFactor");
                    correctnessWorker = (0, index_1.runWorker)(owner, repo, token, repoURL, repoData, "correctness");
                    rampUpWorker = (0, index_1.runWorker)(owner, repo, token, repoURL, repoData, "rampUp");
                    responsivenessWorker = (0, index_1.runWorker)(owner, repo, token, repoURL, repoData, "responsiveness");
                    licenseWorker = (0, index_1.runWorker)(owner, repo, token, repoURL, repoData, "license");
                    return [4 /*yield*/, Promise.all([busFactorWorker, correctnessWorker, rampUpWorker, responsivenessWorker, licenseWorker])];
                case 1:
                    results = _a.sent();
                    busFactor = results[0].score;
                    correctness = results[1].score;
                    rampUp = results[2].score;
                    responsiveness = results[3].score;
                    license = results[4].score;
                    busFactorLatency = results[0].latency;
                    correctnessLatency = results[1].latency;
                    rampUpLatency = results[2].latency;
                    responsivenessLatency = results[3].latency;
                    licenseLatency = results[4].latency;
                    // verify calculations
                    if (correctness == -1) {
                        (0, log_1.logToFile)("Unable to calculate correctness", 1);
                        return [2 /*return*/, null];
                    }
                    if (responsiveness == -1) {
                        (0, log_1.logToFile)("Unable to calculate responsiveness", 1);
                        return [2 /*return*/, null];
                    }
                    begin = Date.now();
                    netScore = (busFactor * 0.25) + (correctness * 0.30) + (rampUp * 0.20) + (responsiveness * 0.15) + (license * 0.10);
                    end = Date.now();
                    metrics = {
                        URL: inputURL,
                        NetScore: netScore,
                        NetScore_Latency: (end - begin) / 1000,
                        RampUp: rampUp,
                        RampUp_Latency: rampUpLatency,
                        Correctness: correctness,
                        Correctness_Latency: correctnessLatency,
                        BusFactor: busFactor,
                        BusFactor_Latency: busFactorLatency,
                        ResponsiveMaintainer: responsiveness,
                        ResponsiveMaintainer_Latency: responsivenessLatency,
                        License: license,
                        License_Latency: licenseLatency
                    };
                    return [2 /*return*/, metrics];
            }
        });
    });
}
exports.calculateMetrics = calculateMetrics;
