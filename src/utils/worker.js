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
var _a = require('worker_threads'), Worker = _a.Worker, parentPort = _a.parentPort;
var logToFile = require('./log').logToFile;
var calcBusFactor = require('../metrics/busFactor').calcBusFactor;
var calcCorrectness = require('../metrics/correctness').calcCorrectness;
var calcResponsiveness = require('../metrics/responsiveMaintainer').calcResponsiveness;
var calcLicense = require('../metrics/license').calcLicense;
var calcRampUp = require('../metrics/rampUp').calcRampUp;
var calcDependencyPinning = require('../metrics/dependencyPinning').calcDependencyPinning;
var calcCodeReview = require('../metrics/codeReview').calcCodeReview;
if (!parentPort) {
    throw new Error('This module must be run as a worker');
}
parentPort.on('message', function (params) { return __awaiter(void 0, void 0, void 0, function () {
    var begin, owner, repo, token, repoURL, repoData, metric, result, _a, end, response, error_1, errorResponse;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 15, , 16]);
                begin = Date.now();
                owner = params.owner, repo = params.repo, token = params.token, repoURL = params.repoURL, repoData = params.repoData, metric = params.metric;
                logToFile("Worker: ".concat(owner, ", ").concat(repo, ", ").concat(repoURL, ", ").concat(metric), 2);
                result = void 0;
                _a = metric;
                switch (_a) {
                    case "busFactor": return [3 /*break*/, 1];
                    case "correctness": return [3 /*break*/, 3];
                    case "rampUp": return [3 /*break*/, 4];
                    case "responsiveness": return [3 /*break*/, 6];
                    case "license": return [3 /*break*/, 7];
                    case "dependencyPinning": return [3 /*break*/, 9];
                    case "codeReview": return [3 /*break*/, 11];
                }
                return [3 /*break*/, 13];
            case 1: return [4 /*yield*/, calcBusFactor(owner, repo, token)];
            case 2:
                result = _b.sent();
                return [3 /*break*/, 14];
            case 3:
                result = calcCorrectness(repoData);
                return [3 /*break*/, 14];
            case 4: return [4 /*yield*/, calcRampUp(repoData)];
            case 5:
                result = _b.sent();
                return [3 /*break*/, 14];
            case 6:
                result = calcResponsiveness(repoData);
                return [3 /*break*/, 14];
            case 7: return [4 /*yield*/, calcLicense(owner, repo, repoURL)];
            case 8:
                result = _b.sent();
                return [3 /*break*/, 14];
            case 9: return [4 /*yield*/, calcDependencyPinning(owner, repo, token)];
            case 10:
                result = _b.sent();
                return [3 /*break*/, 14];
            case 11: return [4 /*yield*/, calcCodeReview(owner, repo, token)];
            case 12:
                result = _b.sent();
                return [3 /*break*/, 14];
            case 13: throw new Error("Unknown metric: ".concat(metric));
            case 14:
                end = Date.now();
                response = {
                    score: result,
                    latency: (end - begin) / 1000
                };
                parentPort.postMessage(response);
                return [3 /*break*/, 16];
            case 15:
                error_1 = _b.sent();
                logToFile("Worker error: ".concat(error_1), 1);
                errorResponse = {
                    score: -1,
                    latency: 0,
                    error: error_1 instanceof Error ? error_1.message : String(error_1)
                };
                parentPort.postMessage(errorResponse);
                return [3 /*break*/, 16];
            case 16: return [2 /*return*/];
        }
    });
}); });
