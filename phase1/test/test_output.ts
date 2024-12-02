import * as fs from 'fs';
import * as path from 'path';
import { initLogFile, logToFile } from '../src/utils/log.js';

try {
  initLogFile();
  const filePath = path.join(__dirname, 'jest-output.txt');
  const data = fs.readFileSync(filePath, 'utf8');
//   const lines = data.split('\n');

  // Get total number of tests and number of tests passed
  const testsCountRegex = /Tests:\s+(\d+)\s+passed,\s+(\d+)\s+total/;
  const testCountMatch = data.match(testsCountRegex);
  let passed = -1;
  let total = -1;
  if (testCountMatch) {
    passed = parseInt(testCountMatch[1], 10);
    total = parseInt(testCountMatch[2], 10);
  }

  const lineCoverageRegex =  /All files\s*\|\s*(\d+\.\d+)\s*\|\s*(\d+\.\d+)\s*\|\s*(\d+\.\d+)\s*\|\s*(\d+\.\d+)/;
  const lineCoverageMatch = data.match(lineCoverageRegex);
  let lineCoverage = -1;
  if (lineCoverageMatch) {
    lineCoverage = parseInt(lineCoverageMatch[4]);
  }

  console.log(`${passed}/${total} test cases passed. ${lineCoverage}% line coverage achieved.`);
} catch (error) {
    logToFile(`Error reading or parsing the Jest output file: ${error}`, 1);
}