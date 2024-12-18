"use strict";
/**
* apiUtils.ts
* Utility functions for making HTTP requests to APIs with retry logic and rate limiting
* Includes GET and POST request handlers with configurable retry attempts and delays
* Handles authentication tokens, rate limits, and error responses
*/
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiPostRequest = exports.apiGetRequest = void 0;
var axios_1 = require("axios");
var log_1 = require("../utils/log");
// Helper function to add delay between retries
var delay = function (ms) { return new Promise(function (resolve) { return setTimeout(resolve, ms); }); };
// Makes GET request with retry logic and rate limit handling
var apiGetRequest = function (url_1, token_1) {
    var args_1 = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        args_1[_i - 2] = arguments[_i];
    }
    return __awaiter(void 0, __spreadArray([url_1, token_1], args_1, true), void 0, function (url, // API endpoint URL
    token, // Optional auth token
    retries, // Number of retry attempts 
    retryDelay // Delay between retries in ms
    ) {
        var config, response, error_1, retryAfter, waitTime;
        var _a, _b, _c, _d, _e;
        if (retries === void 0) { retries = 10; }
        if (retryDelay === void 0) { retryDelay = 2000; }
        return __generator(this, function (_f) {
            switch (_f.label) {
                case 0:
                    _f.trys.push([0, 5, , 9]);
                    config = {
                        headers: __assign({ 'Content-Type': 'application/json' }, (token ? { 'Authorization': "Bearer ".concat(token) } : {})),
                    };
                    return [4 /*yield*/, axios_1.default.get(url, config)];
                case 1:
                    response = _f.sent();
                    if (!(response.status === 202 && retries > 0)) return [3 /*break*/, 4];
                    (0, log_1.logToFile)("Received 202, retrying in ".concat(retryDelay / 1000, " seconds..."), 1);
                    return [4 /*yield*/, delay(retryDelay)];
                case 2:
                    _f.sent();
                    return [4 /*yield*/, (0, exports.apiGetRequest)(url, token, retries - 1, retryDelay)];
                case 3: return [2 /*return*/, _f.sent()];
                case 4: return [2 /*return*/, { data: response.data, error: null }];
                case 5:
                    error_1 = _f.sent();
                    if (!(((_a = error_1.response) === null || _a === void 0 ? void 0 : _a.status) === 403 || ((_b = error_1.response) === null || _b === void 0 ? void 0 : _b.status) === 429)) return [3 /*break*/, 8];
                    retryAfter = error_1.response.headers['retry-after'];
                    waitTime = retryAfter ? parseInt(retryAfter, 10) * 1000 : retryDelay;
                    if (!(retries > 0)) return [3 /*break*/, 8];
                    (0, log_1.logToFile)("Rate limit hit, retrying in ".concat(waitTime / 1000, " seconds..."), 1);
                    return [4 /*yield*/, delay(waitTime)];
                case 6:
                    _f.sent();
                    return [4 /*yield*/, (0, exports.apiGetRequest)(url, token, retries - 1, retryDelay * 2)];
                case 7: return [2 /*return*/, _f.sent()];
                case 8:
                    // Log error and return error response
                    (0, log_1.logToFile)("Error details: ".concat(((_c = error_1.response) === null || _c === void 0 ? void 0 : _c.data) || error_1.message || error_1), 1);
                    return [2 /*return*/, {
                            data: null,
                            error: ((_e = (_d = error_1.response) === null || _d === void 0 ? void 0 : _d.data) === null || _e === void 0 ? void 0 : _e.message) || error_1.message || 'Something went wrong'
                        }];
                case 9: return [2 /*return*/];
            }
        });
    });
};
exports.apiGetRequest = apiGetRequest;
// Makes POST request with retry logic and rate limit handling
var apiPostRequest = function (url_1, data_1, token_1) {
    var args_1 = [];
    for (var _i = 3; _i < arguments.length; _i++) {
        args_1[_i - 3] = arguments[_i];
    }
    return __awaiter(void 0, __spreadArray([url_1, data_1, token_1], args_1, true), void 0, function (url, // API endpoint URL
    data, // POST request body
    token, // Optional auth token
    retries, // Number of retry attempts
    retryDelay // Delay between retries in ms
    ) {
        var config, response, error_2, retryAfter, waitTime;
        var _a, _b, _c, _d, _e;
        if (retries === void 0) { retries = 10; }
        if (retryDelay === void 0) { retryDelay = 2000; }
        return __generator(this, function (_f) {
            switch (_f.label) {
                case 0:
                    _f.trys.push([0, 2, , 6]);
                    config = {
                        headers: __assign({ 'Content-Type': 'application/json' }, (token ? { 'Authorization': "Bearer ".concat(token) } : {})),
                    };
                    return [4 /*yield*/, axios_1.default.post(url, data, config)];
                case 1:
                    response = _f.sent();
                    return [2 /*return*/, { data: response.data, error: null }];
                case 2:
                    error_2 = _f.sent();
                    if (!(((_a = error_2.response) === null || _a === void 0 ? void 0 : _a.status) === 403 || ((_b = error_2.response) === null || _b === void 0 ? void 0 : _b.status) === 429)) return [3 /*break*/, 5];
                    retryAfter = error_2.response.headers['retry-after'];
                    waitTime = retryAfter ? parseInt(retryAfter, 10) * 1000 : retryDelay;
                    if (!(retries > 0)) return [3 /*break*/, 5];
                    (0, log_1.logToFile)("Rate limit hit, retrying in ".concat(waitTime / 1000, " seconds..."), 1);
                    return [4 /*yield*/, delay(waitTime)];
                case 3:
                    _f.sent();
                    return [4 /*yield*/, (0, exports.apiPostRequest)(url, data, token, retries - 1, retryDelay * 2)];
                case 4: return [2 /*return*/, _f.sent()];
                case 5:
                    // Log error and return error response
                    (0, log_1.logToFile)("Error details: ".concat(((_c = error_2.response) === null || _c === void 0 ? void 0 : _c.data) || error_2.message || error_2), 1);
                    return [2 /*return*/, {
                            data: null,
                            error: ((_e = (_d = error_2.response) === null || _d === void 0 ? void 0 : _d.data) === null || _e === void 0 ? void 0 : _e.message) || error_2.message || 'Something went wrong'
                        }];
                case 6: return [2 /*return*/];
            }
        });
    });
};
exports.apiPostRequest = apiPostRequest;
