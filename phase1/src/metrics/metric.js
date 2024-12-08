"use strict";
/**
 * @fileoverview Main metrics calculator that orchestrates the sequential calculation
 * of various repository quality metrics and combines them into a weighted net score.
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
exports.calculateMetrics = exports.metricsCalculator = void 0;
var log_1 = require("../utils/log");
var netScore_1 = require("./netScore");
var worker_1 = require("../utils/worker");
require("./busFactor");
require("./codeReview");
require("./correctness");
require("./dependencyPinning");
require("./license");
require("./rampUp");
require("./responsiveMaintainer");
/**
 * Implementation of the MetricsCalculator interface that handles sequential
 * calculation of all metrics and their aggregation into a final score
 */
exports.metricsCalculator = {
    calculateMetrics: function (owner, repo, token, repoURL, repoData, inputURL) {
        return __awaiter(this, void 0, void 0, function () {
            var busFactorResult, correctnessResult, rampUpResult, responsivenessResult, licenseResult, dependencyPinningResult, codeReviewResult, busFactor, busFactorLatency, correctness, correctnessLatency, responsiveness, responsivenessLatency, license, licenseLatency, dependencyPinning, dependencyPinningLatency, codeReview, codeReviewLatency, rampUp, rampUpLatency, scores, _a, netScore, netScoreLatency, metrics, error_1;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 8, , 9]);
                        return [4 /*yield*/, (0, worker_1.calculateMetric)({
                                owner: owner,
                                repo: repo,
                                token: token,
                                repoURL: repoURL,
                                repoData: repoData,
                                metric: "busFactor"
                            })];
                    case 1:
                        busFactorResult = _b.sent();
                        return [4 /*yield*/, (0, worker_1.calculateMetric)({
                                owner: owner,
                                repo: repo,
                                token: token,
                                repoURL: repoURL,
                                repoData: repoData,
                                metric: "correctness"
                            })];
                    case 2:
                        correctnessResult = _b.sent();
                        return [4 /*yield*/, (0, worker_1.calculateMetric)({
                                owner: owner,
                                repo: repo,
                                token: token,
                                repoURL: repoURL,
                                repoData: repoData,
                                metric: "rampUp"
                            })];
                    case 3:
                        rampUpResult = _b.sent();
                        return [4 /*yield*/, (0, worker_1.calculateMetric)({
                                owner: owner,
                                repo: repo,
                                token: token,
                                repoURL: repoURL,
                                repoData: repoData,
                                metric: "responsiveness"
                            })];
                    case 4:
                        responsivenessResult = _b.sent();
                        return [4 /*yield*/, (0, worker_1.calculateMetric)({
                                owner: owner,
                                repo: repo,
                                token: token,
                                repoURL: repoURL,
                                repoData: repoData,
                                metric: "license"
                            })];
                    case 5:
                        licenseResult = _b.sent();
                        return [4 /*yield*/, (0, worker_1.calculateMetric)({
                                owner: owner,
                                repo: repo,
                                token: token,
                                repoURL: repoURL,
                                repoData: repoData,
                                metric: "dependencyPinning"
                            })];
                    case 6:
                        dependencyPinningResult = _b.sent();
                        return [4 /*yield*/, (0, worker_1.calculateMetric)({
                                owner: owner,
                                repo: repo,
                                token: token,
                                repoURL: repoURL,
                                repoData: repoData,
                                metric: "codeReview"
                            })];
                    case 7:
                        codeReviewResult = _b.sent();
                        busFactor = busFactorResult.score, busFactorLatency = busFactorResult.latency;
                        correctness = correctnessResult.score, correctnessLatency = correctnessResult.latency;
                        responsiveness = responsivenessResult.score, responsivenessLatency = responsivenessResult.latency;
                        license = licenseResult.score, licenseLatency = licenseResult.latency;
                        dependencyPinning = dependencyPinningResult.score, dependencyPinningLatency = dependencyPinningResult.latency;
                        codeReview = codeReviewResult.score, codeReviewLatency = codeReviewResult.latency;
                        rampUp = rampUpResult.score, rampUpLatency = rampUpResult.latency;
                        scores = {
                            busFactor: busFactor,
                            correctness: correctness,
                            responsiveness: responsiveness,
                            license: license,
                            dependencyPinning: dependencyPinning,
                            codeReview: codeReview,
                            rampUp: rampUp
                        };
                        if (!(0, netScore_1.validateMetricScores)(scores)) {
                            (0, log_1.logToFile)("One or more critical metrics could not be calculated", 1);
                            return [2 /*return*/, null];
                        }
                        _a = (0, netScore_1.calculateNetScore)(scores), netScore = _a.score, netScoreLatency = _a.latency;
                        metrics = {
                            URL: inputURL,
                            NetScore: netScore,
                            NetScore_Latency: netScoreLatency,
                            RampUp: rampUp,
                            RampUp_Latency: rampUpLatency,
                            Correctness: correctness,
                            Correctness_Latency: correctnessLatency,
                            BusFactor: busFactor,
                            BusFactor_Latency: busFactorLatency,
                            ResponsiveMaintainer: responsiveness,
                            ResponsiveMaintainer_Latency: responsivenessLatency,
                            License: license,
                            License_Latency: licenseLatency,
                            DependencyPinning: dependencyPinning,
                            DependencyPinning_Latency: dependencyPinningLatency,
                            CodeReview: codeReview,
                            CodeReview_Latency: codeReviewLatency
                        };
                        return [2 /*return*/, metrics];
                    case 8:
                        error_1 = _b.sent();
                        (0, log_1.logToFile)("Error in calculateMetrics: ".concat(error_1 instanceof Error ? error_1.message : String(error_1)), 1);
                        return [2 /*return*/, null];
                    case 9: return [2 /*return*/];
                }
            });
        });
    }
};
// Export the main calculateMetrics function
exports.calculateMetrics = exports.metricsCalculator.calculateMetrics;
