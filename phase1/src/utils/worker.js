"use strict";
/**
* worker.ts
* Handles calculation of different repository metrics
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
exports.calculateMetric = void 0;
var log_1 = require("./log");
var busFactor_1 = require("../metrics/busFactor");
var correctness_1 = require("../metrics/correctness");
var responsiveMaintainer_1 = require("../metrics/responsiveMaintainer");
var license_1 = require("../metrics/license");
var rampUp_1 = require("../metrics/rampUp");
var dependencyPinning_1 = require("../metrics/dependencyPinning");
var codeReview_1 = require("../metrics/codeReview");
/**
* Calculates specified metric for a repository
* @param params - Repository and metric parameters
* @returns Score and calculation latency
*/
function calculateMetric(params) {
    return __awaiter(this, void 0, void 0, function () {
        var owner, repo, token, repoURL, repoData, metric, result, begin, _a, error_1;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 17, , 18]);
                    owner = params.owner, repo = params.repo, token = params.token, repoURL = params.repoURL, repoData = params.repoData, metric = params.metric;
                    (0, log_1.logToFile)("Processing: ".concat(owner, ", ").concat(repo, ", ").concat(repoURL, ", ").concat(metric), 2);
                    result = void 0;
                    begin = Date.now();
                    _a = metric;
                    switch (_a) {
                        case "busFactor": return [3 /*break*/, 1];
                        case "correctness": return [3 /*break*/, 3];
                        case "rampUp": return [3 /*break*/, 5];
                        case "responsiveness": return [3 /*break*/, 7];
                        case "license": return [3 /*break*/, 9];
                        case "dependencyPinning": return [3 /*break*/, 11];
                        case "codeReview": return [3 /*break*/, 13];
                    }
                    return [3 /*break*/, 15];
                case 1: return [4 /*yield*/, (0, busFactor_1.calcBusFactor)(owner, repo, token)];
                case 2:
                    result = _b.sent();
                    return [3 /*break*/, 16];
                case 3: return [4 /*yield*/, (0, correctness_1.calcCorrectness)(repoData)];
                case 4:
                    result = _b.sent();
                    return [3 /*break*/, 16];
                case 5: return [4 /*yield*/, (0, rampUp_1.calcRampUp)(repoData)];
                case 6:
                    result = _b.sent();
                    return [3 /*break*/, 16];
                case 7: return [4 /*yield*/, (0, responsiveMaintainer_1.calcResponsiveness)(repoData)];
                case 8:
                    result = _b.sent();
                    return [3 /*break*/, 16];
                case 9: return [4 /*yield*/, (0, license_1.calcLicense)(owner, repo, repoURL)];
                case 10:
                    result = _b.sent();
                    return [3 /*break*/, 16];
                case 11: return [4 /*yield*/, (0, dependencyPinning_1.calcDependencyPinning)(owner, repo, token)];
                case 12:
                    result = _b.sent();
                    return [3 /*break*/, 16];
                case 13: return [4 /*yield*/, (0, codeReview_1.calcCodeReview)(owner, repo, token)];
                case 14:
                    result = _b.sent();
                    return [3 /*break*/, 16];
                case 15: throw new Error("Unknown metric: ".concat(metric));
                case 16: 
                // Return score and calculation time
                return [2 /*return*/, {
                        score: result,
                        latency: (Date.now() - begin) / 1000
                    }];
                case 17:
                    error_1 = _b.sent();
                    console.error('Processing error:', error_1);
                    return [2 /*return*/, {
                            score: -1,
                            latency: 0,
                            error: error_1 instanceof Error ? error_1.message : String(error_1)
                        }];
                case 18: return [2 /*return*/];
            }
        });
    });
}
exports.calculateMetric = calculateMetric;
// TODO: OLD CONCURRENCY CODE 
// src/utils/worker.ts
// import { ApiResponse, GraphQLResponse } from '../types';
// const { Worker, parentPort } = require('worker_threads');
// const { logToFile } = require('./log');
// const { calcBusFactor } = require('../metrics/busFactor');
// const { calcCorrectness } = require('../metrics/correctness');
// const { calcResponsiveness } = require('../metrics/responsiveMaintainer');
// const { calcLicense } = require('../metrics/license');
// const { calcRampUp } = require('../metrics/rampUp');
// const { calcDependencyPinning } = require('../metrics/dependencyPinning');
// const { calcCodeReview } = require('../metrics/codeReview');
// interface WorkerParams {
//     owner: string;
//     repo: string;
//     token: string;
//     repoURL: string;
//     repoData: ApiResponse<GraphQLResponse | null>;
//     metric: string;
// }
// interface WorkerResponse {
//     score: number;
//     latency: number;
//     error?: string;
// }
// if (!parentPort) {
//     throw new Error('This module must be run as a worker');
// }
// // TODO: THIS IS WHERE THE ERROR IS COMING FROM
// parentPort.on('message', async (params: WorkerParams) => {
//     try {
//         const begin = Date.now();
//         const { owner, repo, token, repoURL, repoData, metric } = params;
//         console.log(params);
//         logToFile(`Worker: ${owner}, ${repo}, ${repoURL}, ${metric}`, 2);
//         let result: number;
//         switch (metric) {
//             case "busFactor":
//                 result = await calcBusFactor(owner, repo, token);
//                 break;
//             case "correctness":
//                 result = await calcCorrectness(repoData);
//                 break;
//             case "rampUp":
//                 result = await calcRampUp(repoData);
//                 break;
//             case "responsiveness":
//                 result = await calcResponsiveness(repoData);
//                 break;
//             case "license":
//                 result = await calcLicense(owner, repo, repoURL);
//                 break;
//             case "dependencyPinning":  // Add new case
//                 result = await calcDependencyPinning(owner, repo, token); 
//                 break;
//             case "codeReview": 
//                 result = await calcCodeReview(owner, repo, token);
//                 break;
//             default:
//                 throw new Error(`Unknown metric: ${metric}`);
//         }
//         const end = Date.now();
//         const response: WorkerResponse = {
//             score: result,
//             latency: (end - begin) / 1000
//         };
//         console.log('Response');
//         console.log(response);
//         parentPort.postMessage(response);
//         console.log(metric);
//     } catch (error) {
//         console.log('Worker error IN WORKER.TS');
//         console.error('Worker error:', error);
//         const errorResponse: WorkerResponse = {
//             score: -1,
//             latency: 0,
//             error: error instanceof Error ? error.message : String(error)
//         };
//         parentPort.postMessage(errorResponse);
//     }
// });
