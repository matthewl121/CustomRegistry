"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var fs = require("fs");
var path = require("path");
var log_js_1 = require("../src/utils/log.js");
try {
    (0, log_js_1.initLogFile)();
    var filePath = path.join(__dirname, 'jest-output.txt');
    var data = fs.readFileSync(filePath, 'utf8');
    //   const lines = data.split('\n');
    // Get total number of tests and number of tests passed
    var testsCountRegex = /Tests:\s+(?:\d+\s+failed,\s+)?(\d+)\s+passed,\s+(\d+)\s+total/;
    var testCountMatch = data.match(testsCountRegex);
    var passed = -1;
    var total = -1;
    if (testCountMatch) {
        passed = parseInt(testCountMatch[1], 10);
        total = parseInt(testCountMatch[2], 10);
    }
    var lineCoverageRegex = /All files\s*\|\s*(\d+\.\d+)\s*\|\s*(\d+\.\d+)\s*\|\s*(\d+\.\d+)\s*\|\s*(\d+\.\d+)/;
    var lineCoverageMatch = data.match(lineCoverageRegex);
    var lineCoverage = -1;
    if (lineCoverageMatch) {
        lineCoverage = parseInt(lineCoverageMatch[4]);
    }
    console.log("".concat(passed, "/").concat(total, " test cases passed. ").concat(lineCoverage, "% line coverage achieved."));
}
catch (error) {
    (0, log_js_1.logToFile)("Error reading or parsing the Jest output file: ".concat(error), 1);
}
