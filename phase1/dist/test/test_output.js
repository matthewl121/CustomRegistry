"use strict";
/**
* analyze_output.ts
* Analyzes Jest test results and code coverage from output file
*/
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var fs = __importStar(require("fs"));
var path = __importStar(require("path"));
var log_js_1 = require("../src/utils/log.js");
try {
    // Initialize log file
    (0, log_js_1.initLogFile)();
    // Read Jest output file
    var filePath = path.join(__dirname, 'jest-output.txt');
    var data = fs.readFileSync(filePath, 'utf8');
    // Extract test counts using regex
    var testsCountRegex = /Tests:\s+(\d+)\s+passed,\s+(\d+)\s+total/;
    var testCountMatch = data.match(testsCountRegex);
    var passed = -1;
    var total = -1;
    if (testCountMatch) {
        passed = parseInt(testCountMatch[1], 10);
        total = parseInt(testCountMatch[2], 10);
    }
    // Extract line coverage using regex 
    var lineCoverageRegex = /All files\s*\|\s*(\d+\.\d+)\s*\|\s*(\d+\.\d+)\s*\|\s*(\d+\.\d+)\s*\|\s*(\d+\.\d+)/;
    var lineCoverageMatch = data.match(lineCoverageRegex);
    var lineCoverage = -1;
    if (lineCoverageMatch) {
        lineCoverage = parseInt(lineCoverageMatch[4]);
    }
    // Log results
    console.log("".concat(passed, "/").concat(total, " test cases passed. ").concat(lineCoverage, "% line coverage achieved."));
}
catch (error) {
    (0, log_js_1.logToFile)("Error reading or parsing the Jest output file: ".concat(error), 1);
}
