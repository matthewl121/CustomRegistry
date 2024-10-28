"use strict";
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
exports.calcDependencyPinning = exports.isVersionPinned = void 0;
var log_1 = require("../utils/log");
var apiUtils_1 = require("../api/apiUtils");
/**
 * Checks if a version string is pinned to at least a major+minor version
 * Valid formats include:
 * - Exact versions: "2.3.4"
 * - Minor version ranges: "2.3.x", "2.3.*", "~2.3.0"
 * - Caret ranges with minor version: "^2.3.0"
 */
var isVersionPinned = function (version) {
    // Remove any leading special characters (^, ~, =, v)
    var cleanVersion = version.replace(/^[~^=v]/, '');
    // Check for exact versions (1.2.3)
    if (/^\d+\.\d+\.\d+$/.test(cleanVersion)) {
        return true;
    }
    // Check for minor version ranges (1.2.x, 1.2.*)
    if (/^\d+\.\d+\.[x*]$/.test(cleanVersion)) {
        return true;
    }
    // Check for ranges that specify minor version
    if (/^\d+\.\d+\./.test(cleanVersion)) {
        return true;
    }
    return false;
};
exports.isVersionPinned = isVersionPinned;
/**
 * Fetches package.json content using GitHub API
 */
var fetchPackageJson = function (owner, repo, token) { return __awaiter(void 0, void 0, void 0, function () {
    var url, response, content;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                url = "https://api.github.com/repos/".concat(owner, "/").concat(repo, "/contents/package.json");
                return [4 /*yield*/, (0, apiUtils_1.apiGetRequest)(url, token)];
            case 1:
                response = _a.sent();
                if (response.error || !response.data || !response.data.content) {
                    return [2 /*return*/, null];
                }
                try {
                    content = Buffer.from(response.data.content, 'base64').toString();
                    return [2 /*return*/, JSON.parse(content)];
                }
                catch (error) {
                    (0, log_1.logToFile)("Error parsing package.json: ".concat(error), 2);
                    return [2 /*return*/, null];
                }
                return [2 /*return*/];
        }
    });
}); };
/**
 * Calculates the fraction of dependencies that are pinned to at least a major+minor version
 * @param owner Repository owner
 * @param repo Repository name
 * @param token GitHub API token
 * @returns Score between 0 and 1
 */
var calcDependencyPinning = function (owner, repo, token) { return __awaiter(void 0, void 0, void 0, function () {
    var packageJson, dependencies, totalDeps, pinnedDeps, score, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, fetchPackageJson(owner, repo, token)];
            case 1:
                packageJson = _a.sent();
                if (!packageJson) {
                    (0, log_1.logToFile)("No package.json found for ".concat(owner, "/").concat(repo), 2);
                    return [2 /*return*/, 1.0]; // If no package.json, treat as having no dependencies
                }
                dependencies = __assign(__assign({}, (packageJson.dependencies || {})), (packageJson.devDependencies || {}));
                totalDeps = Object.keys(dependencies).length;
                // If there are no dependencies, return perfect score
                if (totalDeps === 0) {
                    (0, log_1.logToFile)("No dependencies found for ".concat(owner, "/").concat(repo), 2);
                    return [2 /*return*/, 1.0];
                }
                pinnedDeps = Object.entries(dependencies)
                    .filter(function (_a) {
                    var name = _a[0], version = _a[1];
                    var isPinned = (0, exports.isVersionPinned)(version);
                    (0, log_1.logToFile)("Dependency ".concat(name, "@").concat(version, " is ").concat(isPinned ? 'pinned' : 'not pinned'), 2);
                    return isPinned;
                })
                    .length;
                score = pinnedDeps / totalDeps;
                (0, log_1.logToFile)("Dependency pinning score: ".concat(score, " (").concat(pinnedDeps, "/").concat(totalDeps, " dependencies pinned)"), 2);
                return [2 /*return*/, score];
            case 2:
                error_1 = _a.sent();
                (0, log_1.logToFile)("Error calculating dependency pinning: ".concat(error_1 instanceof Error ? error_1.message : String(error_1)), 1);
                return [2 /*return*/, 0];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.calcDependencyPinning = calcDependencyPinning;
