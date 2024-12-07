"use strict";
/**
 * @fileoverview Calculates a repository's ramp-up score based on documentation quality
 * This metric evaluates how easily new developers can start contributing to the project
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
exports.calcRampUp = calcRampUp;
var githubApi_1 = require("../api/githubApi");
/**
 * Calculates the ramp-up score for a repository based on README presence and examples
 * @param repoData - Repository data from GitHub API response
 * @returns Promise<number> - Score between 0 and 1, where higher values indicate better onboarding
 */
function calcRampUp(repoData) {
    return __awaiter(this, void 0, void 0, function () {
        var repository, readmeVariants, caseVariants, readmeFile, examplesFolder;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    repository = (_a = repoData.data) === null || _a === void 0 ? void 0 : _a.data.repository;
                    if (!repository) {
                        return [2 /*return*/, 0.9]; // Default value if no repository data
                    }
                    readmeVariants = [
                        'md', 'noext', 'txt', 'rdoc', 'html', 'adoc',
                        'markdown', 'yaml', 'rst', 'textile'
                    ];
                    caseVariants = [
                        'README', 'readme', 'readMe', 'ReadMe', 'Readme'
                    ];
                    readmeFile = findFirstReadme(repository, readmeVariants, caseVariants);
                    examplesFolder = findExamplesFolder(repository);
                    // If no README is found, return default score
                    if (!(readmeFile === null || readmeFile === void 0 ? void 0 : readmeFile.text)) {
                        return [2 /*return*/, 0.9];
                    }
                    return [4 /*yield*/, (0, githubApi_1.getReadmeDetails)(readmeFile.text, examplesFolder)];
                case 1: 
                // Analyze README content and examples folder to calculate final score
                return [2 /*return*/, _b.sent()];
            }
        });
    });
}
/**
 * Searches for README file across different naming conventions and file extensions
 * @param repository - Repository object containing file information
 * @param extensions - Array of possible file extensions
 * @param casings - Array of possible README name casings
 * @returns Object containing README text if found, null otherwise
 */
function findFirstReadme(repository, extensions, casings) {
    var _a, _b;
    for (var _i = 0, casings_1 = casings; _i < casings_1.length; _i++) {
        var casing = casings_1[_i];
        for (var _c = 0, extensions_1 = extensions; _c < extensions_1.length; _c++) {
            var ext = extensions_1[_c];
            // Check uppercase extension variant
            var key = "".concat(casing).concat(ext.toUpperCase());
            if ((_a = repository[key]) === null || _a === void 0 ? void 0 : _a.text) {
                return repository[key];
            }
            // Check lowercase extension variant
            var keyLower = "".concat(casing.toLowerCase()).concat(ext);
            if ((_b = repository[keyLower]) === null || _b === void 0 ? void 0 : _b.text) {
                return repository[keyLower];
            }
        }
    }
    return null;
}
/**
 * Searches for examples folder using different naming conventions
 * @param repository - Repository object containing folder information
 * @returns Examples folder object if found, null otherwise
 */
function findExamplesFolder(repository) {
    var folderVariants = [
        'examplesFolder',
        'exampleFolder',
        'ExamplesFolder',
        'ExampleFolder'
    ];
    for (var _i = 0, folderVariants_1 = folderVariants; _i < folderVariants_1.length; _i++) {
        var variant = folderVariants_1[_i];
        if (repository[variant] != null) {
            return repository[variant];
        }
    }
    return null;
}
