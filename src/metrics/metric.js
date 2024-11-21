"use strict";
// /**
//  * @fileoverview Main metrics calculator that orchestrates the calculation of various
//  * repository quality metrics and combines them into a weighted net score.
//  */
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
exports.calculateMetrics = exports.metricsCalculator = void 0;
// import { logToFile } from '../utils/log';
// import { ApiResponse, GraphQLResponse, Metrics } from '../types';
// import { runWorker } from '../index';
// import { calculateNetScore, validateMetricScores } from './netScore';
// import './busFactor';
// import './codeReview';
// import './correctness';
// import './dependencyPinning';
// import './license';
// import './rampUp';
// import './responsiveMaintainer';
// /**
//  * Interface defining the contract for metrics calculation
//  */
// export interface MetricsCalculator {
//     calculateMetrics(
//         owner: string,          // Repository owner
//         repo: string,           // Repository name
//         token: string,          // GitHub API token
//         repoURL: string,        // Repository URL
//         repoData: ApiResponse<GraphQLResponse | null>,  // Repository data from GitHub API
//         inputURL: string        // Original input URL
//     ): Promise<Metrics | null>;
// }
// /**
//  * Implementation of the MetricsCalculator interface that handles parallel
//  * calculation of all metrics and their aggregation into a final score
//  */
// export const metricsCalculator: MetricsCalculator = {
//     async calculateMetrics(
//         owner: string,
//         repo: string,
//         token: string,
//         repoURL: string,
//         repoData: ApiResponse<GraphQLResponse | null>,
//         inputURL: string
//     ): Promise<Metrics | null> {
//         try {
//             // Launch parallel workers for each metric calculation
//             const busFactorWorker = runWorker(owner, repo, token, repoURL, repoData, "busFactor"); // Calculate Bus Factor
//             const correctnessWorker = runWorker(owner, repo, token, repoURL, repoData, "correctness"); // Calculate Correctness
//             // const rampUpWorker = runWorker(owner, repo, token, repoURL, repoData, "rampUp"); // Calculate Ramp Up
//             const responsivenessWorker = runWorker(owner, repo, token, repoURL, repoData, "responsiveness"); // Calculate Responsiveness
//             const licenseWorker = runWorker(owner, repo, token, repoURL, repoData, "license"); // Calculate License 
//             const dependencyPinningWorker = runWorker(owner, repo, token, repoURL, repoData, "dependencyPinning"); // Calculate Dependency Pinning
//             const codeReviewWorker = runWorker(owner, repo, token, repoURL, repoData, "codeReview"); // Calculate Code Review
//             // Wait for all metric calculations to complete
//             const results = await Promise.all([
//                 busFactorWorker,
//                 correctnessWorker,
//                 // rampUpWorker,
//                 responsivenessWorker,
//                 licenseWorker,
//                 dependencyPinningWorker,
//                 codeReviewWorker
//             ]);
//             // Destructure results into scores and latencies
//             const [
//                 { score: busFactor, latency: busFactorLatency },
//                 { score: correctness, latency: correctnessLatency },
//                 // { score: rampUp, latency: rampUpLatency },
//                 { score: responsiveness, latency: responsivenessLatency },
//                 { score: license, latency: licenseLatency },
//                 { score: dependencyPinning, latency: dependencyPinningLatency },
//                 { score: codeReview, latency: codeReviewLatency } 
//             ] = results;
//             // Validate metrics
//             const scores = {
//                 busFactor,
//                 correctness,
//                 // rampUp,
//                 responsiveness,
//                 license,
//                 dependencyPinning,
//                 codeReview
//             };
//             if (!validateMetricScores(scores)) {
//                 logToFile("One or more critical metrics could not be calculated", 1);
//                 return null;
//             }
//             // Calculate net score
//             const { score: netScore, latency: netScoreLatency } = calculateNetScore(scores);
//             // Construct final metrics object
//             const metrics: Metrics = {
//                 URL: inputURL,
//                 // NetScore: netScore,
//                 // NetScore_Latency: netScoreLatency,
//                 // RampUp: rampUp,
//                 // RampUp_Latency: rampUpLatency,
//                 Correctness: correctness,
//                 Correctness_Latency: correctnessLatency,
//                 BusFactor: busFactor,
//                 BusFactor_Latency: busFactorLatency,
//                 ResponsiveMaintainer: responsiveness,
//                 ResponsiveMaintainer_Latency: responsivenessLatency,
//                 License: license,
//                 License_Latency: licenseLatency,
//                 DependencyPinning: dependencyPinning,                // Add new metric
//                 DependencyPinning_Latency: dependencyPinningLatency,  // Add new metric
//                 CodeReview: codeReview,                              // Add new metric
//                 CodeReview_Latency: codeReviewLatency                // Add new metric
//             };
//             return metrics;
//         } catch (error) {
//             logToFile(`Error in calculateMetrics: ${error instanceof Error ? error.message : String(error)}`, 1);
//             return null;
//         }
//     }
// };
// // Export the main calculateMetrics function
// export const { calculateMetrics } = metricsCalculator;
/**
 * @fileoverview Main metrics calculator that orchestrates the sequential calculation
 * of various repository quality metrics and combines them into a weighted net score.
 */
var log_1 = require("../utils/log");
var netScore_1 = require("./netScore");
var worker_1 = require("../utils/worker"); // Import the sequential calculation function we created
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
            var busFactorResult, correctnessResult, responsivenessResult, licenseResult, dependencyPinningResult, codeReviewResult, busFactor, busFactorLatency, correctness, correctnessLatency, responsiveness, responsivenessLatency, license, licenseLatency, dependencyPinning, dependencyPinningLatency, codeReview, codeReviewLatency, scores, _a, netScore, netScoreLatency, metrics, error_1;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 7, , 8]);
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
                                metric: "responsiveness"
                            })];
                    case 3:
                        responsivenessResult = _b.sent();
                        return [4 /*yield*/, (0, worker_1.calculateMetric)({
                                owner: owner,
                                repo: repo,
                                token: token,
                                repoURL: repoURL,
                                repoData: repoData,
                                metric: "license"
                            })];
                    case 4:
                        licenseResult = _b.sent();
                        return [4 /*yield*/, (0, worker_1.calculateMetric)({
                                owner: owner,
                                repo: repo,
                                token: token,
                                repoURL: repoURL,
                                repoData: repoData,
                                metric: "dependencyPinning"
                            })];
                    case 5:
                        dependencyPinningResult = _b.sent();
                        return [4 /*yield*/, (0, worker_1.calculateMetric)({
                                owner: owner,
                                repo: repo,
                                token: token,
                                repoURL: repoURL,
                                repoData: repoData,
                                metric: "codeReview"
                            })];
                    case 6:
                        codeReviewResult = _b.sent();
                        busFactor = busFactorResult.score, busFactorLatency = busFactorResult.latency;
                        correctness = correctnessResult.score, correctnessLatency = correctnessResult.latency;
                        responsiveness = responsivenessResult.score, responsivenessLatency = responsivenessResult.latency;
                        license = licenseResult.score, licenseLatency = licenseResult.latency;
                        dependencyPinning = dependencyPinningResult.score, dependencyPinningLatency = dependencyPinningResult.latency;
                        codeReview = codeReviewResult.score, codeReviewLatency = codeReviewResult.latency;
                        scores = {
                            busFactor: busFactor,
                            correctness: correctness,
                            responsiveness: responsiveness,
                            license: license,
                            dependencyPinning: dependencyPinning,
                            codeReview: codeReview
                        };
                        if (!(0, netScore_1.validateMetricScores)(scores)) {
                            (0, log_1.logToFile)("One or more critical metrics could not be calculated", 1);
                            return [2 /*return*/, null];
                        }
                        _a = (0, netScore_1.calculateNetScore)(scores), netScore = _a.score, netScoreLatency = _a.latency;
                        metrics = {
                            URL: inputURL,
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
                    case 7:
                        error_1 = _b.sent();
                        (0, log_1.logToFile)("Error in calculateMetrics: ".concat(error_1 instanceof Error ? error_1.message : String(error_1)), 1);
                        return [2 /*return*/, null];
                    case 8: return [2 /*return*/];
                }
            });
        });
    }
};
// Export the main calculateMetrics function
exports.calculateMetrics = exports.metricsCalculator.calculateMetrics;
