"use strict";
/**
* analyze_output.ts
* Analyzes Jest test results and code coverage from output file
*/
Object.defineProperty(exports, "__esModule", { value: true });
var fs = require("fs");
var path = require("path");
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
