"use strict";
/**
* index.ts
* Main entry point for metric calculation system
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
exports.main = exports.runWorker = void 0;
var worker_threads_1 = require("worker_threads");
var githubApi_1 = require("./api/githubApi");
var urlHandler_1 = require("./utils/urlHandler");
var log_1 = require("./utils/log");
var metric_1 = require("./metrics/metric");
var dotenv = require('dotenv');
dotenv.config();
/**
* Creates and manages worker thread for metric calculation
*/
function runWorker(owner, repo, token, repoURL, repoData, metric) {
    return new Promise(function (resolve, reject) {
        try {
            var worker_1 = new worker_threads_1.Worker('./src/utils/worker.ts', {
                execArgv: ['--require', 'ts-node/register']
            });
            worker_1.postMessage({ owner: owner, repo: repo, token: token, repoURL: repoURL, repoData: repoData, metric: metric });
            worker_1.on('message', function (result) {
                resolve(result);
                worker_1.terminate();
            });
            worker_1.on('error', function (error) {
                console.error('Worker error:', error);
                reject(error);
                worker_1.terminate();
            });
            worker_1.on('exit', function (code) {
                if (code !== 0) {
                    reject(new Error("Worker stopped with exit code ".concat(code)));
                }
            });
        }
        catch (error) {
            console.error('Error creating worker:', error);
            reject(error);
        }
    });
}
exports.runWorker = runWorker;
/**
* Main function - fetches repo data and calculates metrics
*/
var main = function (url) { return __awaiter(void 0, void 0, void 0, function () {
    var token, inputURL, _a, owner, repo, repoURL, repoData, metrics, error_1;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                token = process.env.GITHUB_TOKEN || "";
                inputURL = url;
                (0, log_1.initLogFile)();
                _b.label = 1;
            case 1:
                _b.trys.push([1, 5, , 6]);
                return [4 /*yield*/, (0, urlHandler_1.getRepoDetails)(token, inputURL)];
            case 2:
                _a = _b.sent(), owner = _a[0], repo = _a[1], repoURL = _a[2];
                return [4 /*yield*/, (0, githubApi_1.fetchRepoData)(owner, repo, token)];
            case 3:
                repoData = _b.sent();
                if (!repoData.data) {
                    (0, log_1.logToFile)("Error fetching repo data", 1);
                    return [2 /*return*/];
                }
                return [4 /*yield*/, (0, metric_1.calculateMetrics)(owner, repo, token, repoURL, repoData, inputURL)];
            case 4:
                metrics = _b.sent();
                if (metrics == null)
                    return [2 /*return*/];
                (0, log_1.logToFile)(JSON.stringify(metrics, null, 2), 1);
                (0, log_1.metricsLogToStdout)(metrics, 1);
                return [3 /*break*/, 6];
            case 5:
                error_1 = _b.sent();
                (0, log_1.logToFile)("Error in main: ".concat(error_1 instanceof Error ? error_1.message : String(error_1)), 1);
                return [3 /*break*/, 6];
            case 6: return [2 /*return*/];
        }
    });
}); };
exports.main = main;
// Run main when called directly
if (require.main === module) {
    var args = process.argv.slice(2);
    if (args.length > 0) {
        (0, exports.main)(args[0]);
    }
}
