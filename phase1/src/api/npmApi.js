"use strict";
/**
* npmApi.ts
* Functions for interacting with NPM registry API to fetch package details
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
exports.fetchGithubUrlFromNpm = void 0;
var apiUtils_1 = require("./apiUtils");
// Base URL for NPM registry
var NPM_BASE_URL = "https://registry.npmjs.org";
/**
* Fetches and normalizes GitHub repository URL from NPM package
* @param packageName - NPM package name to look up
* @returns Normalized GitHub repo URL or error
*/
var fetchGithubUrlFromNpm = function (packageName) { return __awaiter(void 0, void 0, void 0, function () {
    var url, response, repoUrl;
    var _a, _b;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                url = "".concat(NPM_BASE_URL, "/").concat(packageName);
                return [4 /*yield*/, (0, apiUtils_1.apiGetRequest)(url)];
            case 1:
                response = _c.sent();
                // Validate response data
                if (response.error || !((_b = (_a = response.data) === null || _a === void 0 ? void 0 : _a.repository) === null || _b === void 0 ? void 0 : _b.url)) {
                    return [2 /*return*/, { data: null, error: 'Repository URL not found' }];
                }
                repoUrl = response.data.repository.url
                    .replace(/^git\+/, '') // Remove git+ prefix
                    .replace(/\.git$/, '');
                // Convert various Git URL formats to HTTPS
                if (repoUrl.startsWith('ssh://')) {
                    repoUrl = repoUrl.replace('ssh://git@', 'https://');
                }
                else if (repoUrl.startsWith('git@')) {
                    repoUrl = repoUrl.replace('git@', 'https://').replace('.com:', '.com/');
                }
                else if (repoUrl.startsWith('git://')) {
                    repoUrl = repoUrl.replace('git://', 'https://');
                }
                return [2 /*return*/, { data: repoUrl, error: null }];
        }
    });
}); };
exports.fetchGithubUrlFromNpm = fetchGithubUrlFromNpm;
