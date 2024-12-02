"use strict";
/**
 * @fileoverview Calculates a repository's license score by checking for license information
 * in various standard locations. The score is binary (0 or 1) indicating presence/absence
 * of licensing information.
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
exports.calcLicenseScore = exports.calcLicense = void 0;
var isomorphic_git_1 = require("isomorphic-git");
var fs = require("fs");
var node_1 = require("isomorphic-git/http/node");
var path = require("path");
var utils_1 = require("../utils/utils");
/**
 * Entry point for license metric calculation
 * @param owner - Repository owner's username
 * @param repo - Repository name
 * @param repoURL - Full URL to the repository
 * @returns Promise<number> - Returns 1 if license is found, 0 otherwise
 */
function calcLicense(owner, repo, repoURL) {
    return __awaiter(this, void 0, void 0, function () {
        var localDir;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    localDir = path.join("./repos", "".concat(owner, "_").concat(repo));
                    return [4 /*yield*/, calcLicenseScore(repoURL, localDir)];
                case 1: return [2 /*return*/, _a.sent()];
            }
        });
    });
}
exports.calcLicense = calcLicense;
/**
 * Calculates the license score by checking multiple potential license locations
 * @param repoUrl - URL of the repository to analyze
 * @param localDir - Local directory path where repository will be cloned
 * @returns Promise<number> - Returns 1 if license is found, 0 otherwise
 */
function calcLicenseScore(repoUrl, localDir) {
    return __awaiter(this, void 0, void 0, function () {
        var licenseFilePath, readmeFilePath, packageJsonPath, packageJson, readmeText, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    // Clone repository with minimal depth for faster processing
                    return [4 /*yield*/, (0, isomorphic_git_1.clone)({
                            fs: fs,
                            http: node_1["default"],
                            dir: localDir,
                            url: repoUrl,
                            singleBranch: true,
                            depth: 1
                        })];
                case 1:
                    // Clone repository with minimal depth for faster processing
                    _a.sent();
                    licenseFilePath = "".concat(localDir, "/LICENSE");
                    readmeFilePath = "".concat(localDir, "/README.md");
                    packageJsonPath = "".concat(localDir, "/package.json");
                    // Check method 1: Dedicated LICENSE file
                    if (fs.existsSync(licenseFilePath)) {
                        return [2 /*return*/, 1];
                    }
                    // Check method 2: License field in package.json
                    if (fs.existsSync(packageJsonPath)) {
                        try {
                            packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
                            if (packageJson.license) {
                                return [2 /*return*/, 1];
                            }
                        }
                        catch (error) {
                            // Silently continue to other checks if package.json parsing fails
                        }
                    }
                    // Check method 3: License section in README
                    if (fs.existsSync(readmeFilePath)) {
                        readmeText = fs.readFileSync(readmeFilePath, 'utf8');
                        return [2 /*return*/, (0, utils_1.hasLicenseHeading)(readmeText) ? 1 : 0];
                    }
                    // No license information found in any location
                    return [2 /*return*/, 0];
                case 2:
                    error_1 = _a.sent();
                    // Return 0 if any error occurs during the process
                    return [2 /*return*/, 0];
                case 3: return [2 /*return*/];
            }
        });
    });
}
exports.calcLicenseScore = calcLicenseScore;
