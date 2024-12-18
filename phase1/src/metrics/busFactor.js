"use strict";
/**
 * @fileoverview Calculates a repository's bus factor score based on contributor commit distribution
 * Bus factor represents the minimum number of developers that would need to leave a project
 * to significantly impact its maintenance. Higher scores indicate less risk from developer departure.
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
exports.calcBusFactor = calcBusFactor;
exports.calcBusFactorScore = calcBusFactorScore;
var githubApi_1 = require("../api/githubApi");
/**
 * Entry point for bus factor calculation
 * @param owner - Repository owner's username
 * @param repo - Repository name
 * @param token - GitHub API token for authentication
 * @returns Promise<number> - Returns score between 0 and 1, or -1 if data fetch fails
 */
function calcBusFactor(owner, repo, token) {
    return __awaiter(this, void 0, void 0, function () {
        var contributorActivity;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, githubApi_1.fetchContributorActivity)(owner, repo, token)];
                case 1:
                    contributorActivity = _a.sent();
                    // Return -1 if we couldn't fetch valid contributor data
                    if (!(contributorActivity === null || contributorActivity === void 0 ? void 0 : contributorActivity.data) || !Array.isArray(contributorActivity.data)) {
                        return [2 /*return*/, -1];
                    }
                    return [2 /*return*/, calcBusFactorScore(contributorActivity.data)];
            }
        });
    });
}
/**
 * Calculates the bus factor score based on contributor commit distribution
 * Uses a Gaussian function to normalize the score between 0 and 1
 *
 * @param contributorActivity - Array of contributor data with commit counts
 * @returns number - Score between 0 and 1, where:
 *   0 = High risk (few contributors make most commits)
 *   1 = Low risk (commits evenly distributed across many contributors)
 */
function calcBusFactorScore(contributorActivity) {
    if (!contributorActivity) {
        return 0;
    }
    // Calculate total commits and number of contributors
    var totalCommits = 0;
    var totalContributors = 0;
    for (var _i = 0, contributorActivity_1 = contributorActivity; _i < contributorActivity_1.length; _i++) {
        var contributor = contributorActivity_1[_i];
        totalCommits += contributor.total;
        ++totalContributors;
    }
    // Set threshold at 50% of total commits
    // This determines how many contributors it takes to account for half of all commits
    var threshold = Math.ceil(totalCommits * 0.5);
    // Count contributors needed to reach threshold
    var curr = 0;
    var busFactor = 0;
    for (var i = contributorActivity.length - 1; i >= 0; i--) {
        curr += contributorActivity[i].total;
        busFactor++;
        if (curr >= threshold)
            break;
    }
    // Constants for score calculation
    var averageBusFactor = 3; // Expected average number of key contributors
    // If bus factor is very high (>9), return perfect score
    if (busFactor > 9)
        return 1;
    // Calculate normalized score using Gaussian function
    // Score approaches 1 as bus factor increases
    return 1 - Math.exp(-(Math.pow(busFactor, 2)) / (2 * Math.pow(averageBusFactor, 2)));
}
